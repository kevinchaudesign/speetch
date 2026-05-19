-- ============================================================================
-- Speetch — Ajoute `client_media.persona_id` (FK vers client_personas)
-- ----------------------------------------------------------------------------
-- Sert à tagger une image de la médiathèque avec un persona du même client.
-- Côté UI le champ n'est exposé que pour les médias placés dans un dossier
-- nommé « Personas » (case-insensitive), mais la colonne est libre côté DB.
--
-- ON DELETE SET NULL : si on supprime un persona, ses photos restent (le tag
-- saute juste). Pas de CASCADE — on ne veut pas perdre l'image avec le tag.
--
-- Pas de check FK croisée client (persona.profile_id = media.profile_id) :
-- Postgres ne sait pas exprimer ça simplement, c'est la server action
-- setMediaPersona qui valide l'appartenance avant d'écrire.
-- ----------------------------------------------------------------------------
-- Migration idempotente — peut être rejouée.
-- ============================================================================

begin;

-- 1. Colonne
alter table public.client_media
  add column if not exists persona_id uuid;

-- 2. FK (drop puis create pour rester idempotent même si la contrainte
--    existait avec une autre définition).
alter table public.client_media
  drop constraint if exists client_media_persona_id_fkey;
alter table public.client_media
  add constraint client_media_persona_id_fkey
  foreign key (persona_id)
  references public.client_personas(id)
  on delete set null;

-- 3. Index partiel sur les lignes taggées (la majorité aura persona_id NULL).
create index if not exists client_media_persona_id_idx
  on public.client_media (persona_id)
  where persona_id is not null;

commit;
