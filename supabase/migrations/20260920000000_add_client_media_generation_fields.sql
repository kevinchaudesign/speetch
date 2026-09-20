-- ============================================================================
-- Speetch — Ajoute `client_media.generation_prompt` et `generation_model`
-- ----------------------------------------------------------------------------
-- Documente la provenance d'un média généré par IA : le prompt qui a servi à
-- le produire et le modèle utilisé. Les deux restent NULL pour les médias
-- uploadés normalement — c'est l'absence de valeur qui distingue un fichier
-- « humain » d'une génération.
--
-- Pas de contrainte NOT NULL ni de valeur par défaut : la médiathèque
-- existante est majoritairement composée d'uploads, et forcer une chaîne vide
-- empêcherait de distinguer « non renseigné » de « renseigné puis effacé ».
--
-- generation_model est un texte libre plutôt qu'un enum : les noms de modèles
-- changent trop vite (versions, fournisseurs) pour être figés en base.
-- ----------------------------------------------------------------------------
-- Migration idempotente — peut être rejouée.
-- ============================================================================

begin;

alter table public.client_media
  add column if not exists generation_prompt text;

alter table public.client_media
  add column if not exists generation_model text;

-- Index partiel : sert à retrouver les médias générés (la majorité des lignes
-- aura generation_model NULL).
create index if not exists client_media_generation_model_idx
  on public.client_media (generation_model)
  where generation_model is not null;

commit;
