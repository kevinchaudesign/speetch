-- CRM Speetch — table "Padawans" (prospects/leads en formation).
--
-- Accès admin uniquement : aucune policy publique, tout passe via
-- service-role depuis le serveur Next.js (createAdminClient). Les
-- clients finaux n'ont JAMAIS visibilité sur ces données.

create table if not exists public.crm_padawans (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  company      text,
  email        text,
  phone        text,
  source       text,
  -- Statuts : 'detected' | 'approached' | 'qualified' | 'won' | 'lost'.
  -- Labels SW gérés côté UI (lib/crm.ts), pas de check contrainte pour
  -- garder la flexibilité d'ajouter des statuts plus tard sans migration.
  status       text not null default 'detected',
  notes        text,
  next_action_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists crm_padawans_status_idx
  on public.crm_padawans (status);

create index if not exists crm_padawans_created_at_idx
  on public.crm_padawans (created_at desc);

-- updated_at auto via trigger générique (réutilise tg_set_updated_at
-- s'il existe déjà, sinon le crée).
do $$
begin
  if not exists (
    select 1 from pg_proc where proname = 'tg_set_updated_at'
  ) then
    create function public.tg_set_updated_at() returns trigger
      language plpgsql as $fn$
    begin
      new.updated_at := now();
      return new;
    end;
    $fn$;
  end if;
end$$;

drop trigger if exists set_updated_at on public.crm_padawans;
create trigger set_updated_at
  before update on public.crm_padawans
  for each row execute function public.tg_set_updated_at();

alter table public.crm_padawans enable row level security;

comment on table public.crm_padawans is
  'CRM Speetch — prospects/leads en formation ("Padawans"). Accès admin uniquement via service-role. Aucune RLS policy publique.';
