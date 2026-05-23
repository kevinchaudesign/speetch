-- Crédits Galactiques — devis, factures, avoirs.
--
-- Architecture pensée pour la réforme française de facturation
-- électronique (entrée en vigueur 09/2026 pour la réception, rolling
-- deadlines pour l'émission). Les champs requis par la réforme sont
-- déjà en place côté snapshot client + champs e-invoicing — le
-- branchement PDP (Chorus Pro / Pennylane / etc.) et la génération
-- Factur-X (PDF/A-3 + XML CII) viendront dans une seconde phase.
--
-- Numérotation : strictement séquentielle, sans trou, par année et
-- par type. Lock row-level via `credit_sequences` (UPDATE … RETURNING).
--
-- Snapshot client : les coordonnées sont copiées dans le devis/facture
-- au moment de l'émission. Si le profil client est modifié plus tard,
-- la pièce reste figée — exigence légale.
--
-- RLS : accès admin uniquement via service-role, pas de policy
-- publique (cohérent avec crm_padawans / crm_transmissions).

-- ─── 1. Compteurs séquentiels par année et type ──────────────────────
create table if not exists public.credit_sequences (
  year  int  not null,
  kind  text not null check (kind in ('quote', 'invoice', 'credit_note')),
  current int not null default 0,
  primary key (year, kind)
);

comment on table public.credit_sequences is
  'Compteurs séquentiels (year, kind) → current. Atomique via UPDATE … RETURNING (verrou row-level).';

-- ─── 2. Réglages émetteur (singleton Speetch) ───────────────────────
create table if not exists public.credit_emitter_settings (
  id                       text primary key default 'singleton',
  legal_name               text,
  legal_form               text,
  siren                    text,
  siret                    text,
  vat_number               text,
  vat_exempt               boolean not null default true,
  vat_exempt_mention       text default 'TVA non applicable, art. 293 B du CGI',
  address_line1            text,
  address_line2            text,
  postal_code              text,
  city                     text,
  country                  text default 'France',
  iban                     text,
  bic                      text,
  bank_name                text,
  default_payment_terms    text default '30 jours fin de mois',
  late_payment_rate        text default 'Taux BCE + 10 points',
  recovery_indemnity       numeric(8, 2) default 40,
  legal_mentions           text,
  pdp_provider             text,
  pdp_id                   text,
  quote_prefix             text default 'DV',
  invoice_prefix           text default 'FC',
  credit_note_prefix       text default 'AV',
  logo_url                 text,
  updated_at               timestamptz not null default now(),
  constraint singleton_only check (id = 'singleton')
);

comment on table public.credit_emitter_settings is
  'Singleton — coordonnées légales de l''émetteur (Speetch). Mentions obligatoires françaises, IBAN, préfixes de numérotation, infos PDP pour facturation électronique.';

-- ─── 3. Devis ──────────────────────────────────────────────────────
create table if not exists public.credit_quotes (
  id                  uuid primary key default gen_random_uuid(),
  number              text not null unique,                 -- DV-2026-0001
  profile_id          uuid references public.profiles(id) on delete restrict,
  -- Cycle de vie : 'draft' | 'sent' | 'accepted' | 'refused' | 'expired'
  status              text not null default 'draft',
  issued_at           date not null default current_date,
  valid_until         date,
  -- Snapshot client (figé à l'émission)
  client_name         text not null,
  client_company      text,
  client_address      text,
  client_postal_code  text,
  client_city         text,
  client_country      text default 'France',
  client_siren        text,
  client_vat_number   text,
  client_email        text,
  -- Lignes : [{ description, quantity, unit_price_ht, vat_rate, total_ht }]
  lines               jsonb not null default '[]'::jsonb,
  -- Totaux dérivés mais persistés pour requêtes rapides
  subtotal_ht         numeric(12, 2) not null default 0,
  tax_total           numeric(12, 2) not null default 0,
  total_ttc           numeric(12, 2) not null default 0,
  -- Snapshot du régime TVA au moment de l'émission
  vat_exempt          boolean not null default false,
  vat_exempt_mention  text,
  -- Conditions
  payment_terms       text,
  notes               text,
  intro               text,
  -- Tracking
  sent_at             timestamptz,
  accepted_at         timestamptz,
  refused_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists credit_quotes_status_idx on public.credit_quotes (status);
create index if not exists credit_quotes_profile_idx on public.credit_quotes (profile_id);
create index if not exists credit_quotes_issued_at_idx on public.credit_quotes (issued_at desc);

comment on table public.credit_quotes is
  'Devis émis. Numérotation séquentielle DV-AAAA-NNNN. Snapshot client figé à l''émission. Status : draft / sent / accepted / refused / expired.';

-- ─── 4. Factures ────────────────────────────────────────────────────
create table if not exists public.credit_invoices (
  id                  uuid primary key default gen_random_uuid(),
  number              text not null unique,                 -- FC-2026-0001
  -- Lien optionnel vers le devis source
  quote_id            uuid references public.credit_quotes(id) on delete set null,
  profile_id          uuid references public.profiles(id) on delete restrict,
  -- Cycle de vie : 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'canceled'
  status              text not null default 'draft',
  issued_at           date not null default current_date,
  due_at              date,
  -- Snapshot client (figé à l'émission)
  client_name         text not null,
  client_company      text,
  client_address      text,
  client_postal_code  text,
  client_city         text,
  client_country      text default 'France',
  client_siren        text,
  client_vat_number   text,
  client_email        text,
  lines               jsonb not null default '[]'::jsonb,
  subtotal_ht         numeric(12, 2) not null default 0,
  tax_total           numeric(12, 2) not null default 0,
  total_ttc           numeric(12, 2) not null default 0,
  vat_exempt          boolean not null default false,
  vat_exempt_mention  text,
  payment_terms       text,
  payment_method      text,
  paid_amount         numeric(12, 2) not null default 0,
  paid_at             date,
  notes               text,
  intro               text,
  sent_at             timestamptz,
  -- Réforme facturation électronique
  -- Statut cycle de vie remonté par le PDP : déposée, refusée, mise à disposition, etc.
  lifecycle_status    text,
  -- 'B2B' | 'B2C' | 'B2G' | 'export' | 'intra_eu'
  operation_type      text default 'B2B',
  -- 'goods' | 'services' | 'mixed'
  operation_nature    text default 'services',
  -- Adresse de livraison si distincte de facturation (exigé Factur-X)
  delivery_address    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists credit_invoices_status_idx on public.credit_invoices (status);
create index if not exists credit_invoices_profile_idx on public.credit_invoices (profile_id);
create index if not exists credit_invoices_due_at_idx on public.credit_invoices (due_at);
create index if not exists credit_invoices_issued_at_idx on public.credit_invoices (issued_at desc);

comment on table public.credit_invoices is
  'Factures émises. Numérotation séquentielle FC-AAAA-NNNN. Snapshot client figé. Champs préparés pour facturation électronique (lifecycle_status PDP, operation_type/nature, delivery_address).';

-- ─── 5. Avoirs (notes de crédit) ────────────────────────────────────
create table if not exists public.credit_notes (
  id           uuid primary key default gen_random_uuid(),
  number       text not null unique,                         -- AV-2026-0001
  invoice_id   uuid not null references public.credit_invoices(id) on delete restrict,
  reason       text not null,
  issued_at    date not null default current_date,
  -- Snapshot des montants à annuler (souvent = facture, parfois partiel)
  subtotal_ht  numeric(12, 2) not null default 0,
  tax_total    numeric(12, 2) not null default 0,
  total_ttc    numeric(12, 2) not null default 0,
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists credit_notes_invoice_idx on public.credit_notes (invoice_id);

comment on table public.credit_notes is
  'Avoirs. Émis pour annuler / corriger une facture sans la supprimer (exigence légale française). Numérotation séquentielle AV-AAAA-NNNN.';

-- ─── 6. Trigger updated_at (réutilise la fonction générique) ────────
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'tg_set_updated_at') then
    create function public.tg_set_updated_at() returns trigger
      language plpgsql as $fn$
    begin
      new.updated_at := now();
      return new;
    end;
    $fn$;
  end if;
end$$;

drop trigger if exists set_updated_at on public.credit_emitter_settings;
create trigger set_updated_at
  before update on public.credit_emitter_settings
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.credit_quotes;
create trigger set_updated_at
  before update on public.credit_quotes
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.credit_invoices;
create trigger set_updated_at
  before update on public.credit_invoices
  for each row execute function public.tg_set_updated_at();

-- ─── 7. RPC : génère un numéro séquentiel atomique ──────────────────
-- Pattern : UPDATE … RETURNING avec verrou row-level — résiste à la
-- concurrence sans nécessiter de transaction explicite côté Node.
create or replace function public.next_credit_number(
  p_year int,
  p_kind text,
  p_prefix text
)
returns text
language plpgsql
as $$
declare
  v_next int;
  v_year_str text;
begin
  if p_kind not in ('quote', 'invoice', 'credit_note') then
    raise exception 'Invalid kind: %', p_kind;
  end if;

  insert into public.credit_sequences (year, kind, current)
    values (p_year, p_kind, 0)
    on conflict (year, kind) do nothing;

  update public.credit_sequences
    set current = current + 1
    where year = p_year and kind = p_kind
    returning current into v_next;

  v_year_str := to_char(p_year, 'FM0000');
  return p_prefix || '-' || v_year_str || '-' || to_char(v_next, 'FM0000');
end;
$$;

comment on function public.next_credit_number(int, text, text) is
  'Génère un numéro séquentiel sans trou, atomique, par (année, type). Retour : "PREFIX-YYYY-NNNN".';

-- ─── 8. RLS — service-role only ─────────────────────────────────────
alter table public.credit_sequences         enable row level security;
alter table public.credit_emitter_settings  enable row level security;
alter table public.credit_quotes            enable row level security;
alter table public.credit_invoices          enable row level security;
alter table public.credit_notes             enable row level security;
