-- CRM Speetch — table "Transmissions" (emailings envoyés via Brevo).
--
-- Une transmission = un envoi (1 sujet, 1 corps, N destinataires figés au
-- moment de l'envoi). Le snapshot recipients permet de garder la trace
-- même si un Padawan est supprimé / modifié plus tard.
--
-- Accès admin uniquement : RLS sans policy, tout passe par service-role.

create table if not exists public.crm_transmissions (
  id                uuid primary key default gen_random_uuid(),
  subject           text not null,
  body_html         text,
  body_text         text,
  sender_name       text,
  sender_email      text not null,
  reply_to          text,
  -- Snapshot des destinataires : [{ padawan_id, email, full_name, status,
  -- brevo_message_id, error }, ...]. Garde la trace même si le padawan
  -- source est supprimé/modifié après l'envoi.
  recipients        jsonb not null default '[]'::jsonb,
  recipient_count   integer not null default 0,
  delivered_count   integer not null default 0,
  failed_count      integer not null default 0,
  -- 'pending' | 'sending' | 'sent' | 'partial' | 'failed'
  status            text not null default 'pending',
  error             text,
  created_at        timestamptz not null default now(),
  sent_at           timestamptz
);

create index if not exists crm_transmissions_created_at_idx
  on public.crm_transmissions (created_at desc);

create index if not exists crm_transmissions_status_idx
  on public.crm_transmissions (status);

alter table public.crm_transmissions enable row level security;

comment on table public.crm_transmissions is
  'CRM Speetch — emailings (Brevo). Snapshot des destinataires figé au moment de l''envoi. Accès admin via service-role uniquement.';
