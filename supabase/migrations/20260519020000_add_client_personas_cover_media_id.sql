-- ============================================================================
-- Speetch — Ajoute `client_personas.cover_media_id`
-- ----------------------------------------------------------------------------
-- Choix EXPLICITE de l'image utilisée comme card preview d'un persona dans
-- la liste /admin/clients/[id]/personas. Si NULL, l'UI applique une
-- heuristique (1er média image taggé, sinon 1er média).
--
-- ON DELETE SET NULL : si on supprime le média, le cover saute proprement.
--
-- Pas de check FK croisée persona ↔ media (cover_media.persona_id =
-- this.id) : Postgres ne l'exprime pas simplement. L'UI valide en lecture
-- (le cover doit être dans la liste des médias taggés du persona), et la
-- server action setPersonaCover valide en écriture.
-- ----------------------------------------------------------------------------
-- Migration idempotente — peut être rejouée.
-- ============================================================================

begin;

-- 1. Colonne
alter table public.client_personas
  add column if not exists cover_media_id uuid;

-- 2. FK (drop puis create pour rester idempotent).
alter table public.client_personas
  drop constraint if exists client_personas_cover_media_id_fkey;
alter table public.client_personas
  add constraint client_personas_cover_media_id_fkey
  foreign key (cover_media_id)
  references public.client_media(id)
  on delete set null;

-- 3. Index partiel
create index if not exists client_personas_cover_media_id_idx
  on public.client_personas (cover_media_id)
  where cover_media_id is not null;

commit;
