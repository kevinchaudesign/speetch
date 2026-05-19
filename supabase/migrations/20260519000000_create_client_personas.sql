-- ============================================================================
-- Speetch — Table `client_personas`
-- ----------------------------------------------------------------------------
-- Fiches "persona" attachées à un espace client (profiles.is_owner = false).
-- Une ligne = un persona (nom, rôle, âge, citation, goals, frustrations…).
-- ON DELETE CASCADE : si on supprime un client, ses personas partent avec.
--
-- Pas de FK vers auth.users : cohérent avec le reste, les espaces clients
-- sont standalone et non liés à un compte auth.
--
-- RLS verrouillée sans policy → seul le service_role passe. Les server
-- actions admin (createAdminClient) bypass RLS automatiquement ; l'API
-- publique anon/authenticated ne peut rien lire ni écrire ici.
-- ----------------------------------------------------------------------------
-- Migration idempotente — peut être rejouée sans risque.
-- ============================================================================

begin;

-- ------------------------------------------------------------------
-- 1. Table
-- ------------------------------------------------------------------
create table if not exists public.client_personas (
  id            uuid        primary key default gen_random_uuid(),
  profile_id    uuid        not null references public.profiles(id) on delete cascade,
  name          text        not null default 'Nouveau persona',
  role          text,
  age           smallint,
  location      text,
  quote         text,
  bio           text,
  goals         text,
  frustrations  text,
  motivations   text,
  behaviors     text,
  tech_comfort  text,
  notes         text,
  position      integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Garde-fou colonnes (si la table existait déjà avec un schéma plus court).
alter table public.client_personas add column if not exists role         text;
alter table public.client_personas add column if not exists age          smallint;
alter table public.client_personas add column if not exists location     text;
alter table public.client_personas add column if not exists quote        text;
alter table public.client_personas add column if not exists bio          text;
alter table public.client_personas add column if not exists goals        text;
alter table public.client_personas add column if not exists frustrations text;
alter table public.client_personas add column if not exists motivations  text;
alter table public.client_personas add column if not exists behaviors    text;
alter table public.client_personas add column if not exists tech_comfort text;
alter table public.client_personas add column if not exists notes        text;
alter table public.client_personas add column if not exists position     integer not null default 0;

-- ------------------------------------------------------------------
-- 2. Contraintes
-- ------------------------------------------------------------------
-- Bornes d'âge raisonnables (0–150). Postgres interdit les sous-requêtes
-- dans un CHECK, donc on ne peut pas garantir "pas de persona sur owner"
-- au niveau DB : la vérif est faite côté server action via ensureProfileExists().
alter table public.client_personas
  drop constraint if exists client_personas_age_range;
alter table public.client_personas
  add constraint client_personas_age_range
  check (age is null or (age >= 0 and age <= 150));

-- ------------------------------------------------------------------
-- 3. Index
-- ------------------------------------------------------------------
create index if not exists client_personas_profile_id_position_idx
  on public.client_personas (profile_id, position);

-- ------------------------------------------------------------------
-- 4. Trigger updated_at
--    Réutilise public.touch_updated_at créée dans
--    20260513000000_init_profiles.sql.
-- ------------------------------------------------------------------
drop trigger if exists client_personas_touch_updated_at on public.client_personas;
create trigger client_personas_touch_updated_at
  before update on public.client_personas
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------
-- 5. Row-Level Security
--    Aucune policy → anon/authenticated bloqués. Tout passe par
--    service_role côté server actions admin (qui bypass RLS).
-- ------------------------------------------------------------------
alter table public.client_personas enable row level security;
revoke all on public.client_personas from anon, authenticated;

commit;
