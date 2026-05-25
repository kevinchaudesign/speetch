-- Médiathèque : sous-dossiers (1 niveau max — contrainte applicative) +
-- image d'aperçu par dossier.
--
-- Contraintes :
--   - parent_id : référence à un autre dossier (même profile). Profondeur
--     max = 1 imposée côté application (un sous-dossier ne peut pas avoir
--     d'enfants). ON DELETE CASCADE → suppression d'un parent supprime ses
--     enfants ; les médias des enfants se retrouvent en "hors dossier" via
--     le ON DELETE SET NULL déjà en place sur client_media.folder_id.
--   - cover_media_id : référence à un client_media (n'importe lequel du
--     profile, pas forcément dans ce dossier — flexibilité voulue côté
--     produit). ON DELETE SET NULL pour ne pas bloquer la suppression d'un
--     média désigné comme aperçu.

alter table public.client_media_folders
  add column if not exists parent_id uuid
  references public.client_media_folders(id) on delete cascade;

alter table public.client_media_folders
  add column if not exists cover_media_id uuid
  references public.client_media(id) on delete set null;

create index if not exists client_media_folders_parent_id_idx
  on public.client_media_folders(parent_id);

create index if not exists client_media_folders_cover_media_id_idx
  on public.client_media_folders(cover_media_id);

-- Empêche un dossier d'être son propre parent (sanity check côté DB).
alter table public.client_media_folders
  drop constraint if exists client_media_folders_no_self_parent;
alter table public.client_media_folders
  add constraint client_media_folders_no_self_parent
  check (parent_id is null or parent_id <> id);
