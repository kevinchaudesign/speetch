-- ============================================================================
-- Speetch — Table `email_accounts`
-- ----------------------------------------------------------------------------
-- Configuration des comptes email (IMAP/SMTP) gérés depuis l'admin
-- Speetch. Une ligne par owner — pour le MVP, on supporte un seul
-- compte (contact@speetch.com via Infomaniak), mais la table autorise
-- plusieurs si besoin futur.
--
-- Le mot de passe IMAP/SMTP est stocké CHIFFRÉ (AES-256-GCM) dans
-- password_encrypted. La clé de chiffrement vit dans la variable
-- d'environnement SPEETCH_EMAIL_ENCRYPTION_KEY (32 bytes hex). Voir
-- `lib/email/crypto.ts`.
--
-- RLS verrouillée sans policy → service-role only.
-- ----------------------------------------------------------------------------
-- Migration idempotente.
-- ============================================================================

begin;

create table if not exists public.email_accounts (
  id                  uuid        primary key default gen_random_uuid(),
  profile_id          uuid        not null references public.profiles(id) on delete cascade,
  email               text        not null,
  display_name        text,
  -- IMAP (réception)
  imap_host           text        not null default 'mail.infomaniak.com',
  imap_port           integer     not null default 993,
  imap_secure         boolean     not null default true,
  -- SMTP (envoi)
  smtp_host           text        not null default 'mail.infomaniak.com',
  smtp_port           integer     not null default 465,
  smtp_secure         boolean     not null default true,
  -- Mot de passe chiffré AES-256-GCM, encodé base64. Format :
  -- iv(12) | authTag(16) | ciphertext.
  password_encrypted  text        not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique(profile_id, email)
);

create index if not exists email_accounts_profile_id_idx
  on public.email_accounts (profile_id);

-- Trigger updated_at
drop trigger if exists email_accounts_touch_updated_at on public.email_accounts;
create trigger email_accounts_touch_updated_at
  before update on public.email_accounts
  for each row
  execute function public.touch_updated_at();

-- RLS verrouillée
alter table public.email_accounts enable row level security;

commit;
