-- Réglages Brevo de l'agence (singleton).
--
-- Une seule ligne (id = 'singleton'). API key chiffrée AES-256-GCM avec
-- SPEETCH_EMAIL_ENCRYPTION_KEY (même clé que les comptes email).
-- Sender par défaut utilisé pour toutes les transmissions CRM.
--
-- Accès admin uniquement : RLS sans policy, tout passe par service-role.

create table if not exists public.crm_brevo_settings (
  id                text primary key default 'singleton',
  api_key_encrypted text,
  sender_email      text,
  sender_name       text,
  reply_to          text,
  updated_at        timestamptz not null default now(),
  constraint singleton_only check (id = 'singleton')
);

-- Réutilise le trigger générique défini par crm_padawans (idempotent
-- au cas où l'ordre des migrations changerait).
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

drop trigger if exists set_updated_at on public.crm_brevo_settings;
create trigger set_updated_at
  before update on public.crm_brevo_settings
  for each row execute function public.tg_set_updated_at();

alter table public.crm_brevo_settings enable row level security;

comment on table public.crm_brevo_settings is
  'Singleton (id = ''singleton'') — config Brevo de l''agence : API key chiffrée AES-256-GCM, sender par défaut, reply-to. Accès admin via service-role.';
