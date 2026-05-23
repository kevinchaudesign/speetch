-- ============================================================================
-- Speetch — Tables `todo_lists` + `todo_notes`
-- ----------------------------------------------------------------------------
-- Application "Tâches Jedi" — fonctionnement type Notes iOS :
--   · todo_lists  = dossiers / collections de notes (équivalent "Folder" Notes)
--   · todo_notes  = notes individuelles, texte libre, première ligne = titre
--
-- Une ligne par owner (profiles.is_owner = true) uniquement — pas de Tâches
-- sur les Holocrons clients (vérif côté server action). Les notes sont
-- rattachées à une liste via list_id (nullable → "Toutes les notes").
--
-- RLS verrouillée sans policy → seul le service_role passe. Les server
-- actions admin (createAdminClient) bypass RLS automatiquement.
-- ----------------------------------------------------------------------------
-- Migration idempotente — peut être rejouée sans risque.
-- ============================================================================

begin;

-- ------------------------------------------------------------------
-- 1. todo_lists
-- ------------------------------------------------------------------
create table if not exists public.todo_lists (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references public.profiles(id) on delete cascade,
  name        text        not null default 'Nouvelle liste',
  color       text,                          -- hex optionnel pour pastille de couleur
  position    integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists todo_lists_profile_id_position_idx
  on public.todo_lists (profile_id, position);

-- ------------------------------------------------------------------
-- 2. todo_notes
-- ------------------------------------------------------------------
create table if not exists public.todo_notes (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references public.profiles(id) on delete cascade,
  list_id     uuid        references public.todo_lists(id) on delete set null,
  content     text        not null default '',
  is_pinned   boolean     not null default false,
  position    integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Garde-fou colonnes (si la table existait déjà avec un schéma plus court).
alter table public.todo_notes add column if not exists list_id    uuid;
alter table public.todo_notes add column if not exists is_pinned  boolean not null default false;
alter table public.todo_notes add column if not exists position   integer not null default 0;

create index if not exists todo_notes_profile_id_updated_at_idx
  on public.todo_notes (profile_id, updated_at desc);

create index if not exists todo_notes_list_id_idx
  on public.todo_notes (list_id);

create index if not exists todo_notes_pinned_idx
  on public.todo_notes (profile_id, is_pinned, updated_at desc);

-- ------------------------------------------------------------------
-- 3. Triggers updated_at
--    Réutilise public.touch_updated_at créée dans
--    20260513000000_init_profiles.sql.
-- ------------------------------------------------------------------
drop trigger if exists todo_lists_touch_updated_at on public.todo_lists;
create trigger todo_lists_touch_updated_at
  before update on public.todo_lists
  for each row
  execute function public.touch_updated_at();

drop trigger if exists todo_notes_touch_updated_at on public.todo_notes;
create trigger todo_notes_touch_updated_at
  before update on public.todo_notes
  for each row
  execute function public.touch_updated_at();

-- ------------------------------------------------------------------
-- 4. RLS — verrouillé service-role uniquement
-- ------------------------------------------------------------------
alter table public.todo_lists enable row level security;
alter table public.todo_notes enable row level security;
-- Pas de policy : seul service_role peut lire/écrire.

commit;
