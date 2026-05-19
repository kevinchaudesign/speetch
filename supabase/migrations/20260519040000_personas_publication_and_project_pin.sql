-- ============================================================================
-- Speetch — Toggle de publication des personas + pin dans un projet
-- ----------------------------------------------------------------------------
-- Deux flags côté profiles :
--   personas_published   : si false, la page personas n'est plus accessible
--                          côté client (vues publiques filtrent dessus, plus
--                          aucun persona ni média n'est retourné). Default
--                          false → opt-in explicite.
--   personas_project_id  : optionnel, FK vers projects(id). Quand renseigné,
--                          le lien « Personas » sur la home espace client
--                          s'affiche dans la liste des pages de ce projet
--                          au lieu d'une section top-level. ON DELETE SET
--                          NULL pour éviter qu'un projet supprimé bloque
--                          la publication.
-- ----------------------------------------------------------------------------
-- On en profite pour recréer 3 vues publiques :
--   client_spaces                : ajoute personas_published + personas_project_id
--   client_personas_public       : exige personas_published = true
--   client_persona_media_public  : exige personas_published = true
-- ----------------------------------------------------------------------------
-- Migration idempotente — peut être rejouée.
-- ============================================================================

begin;

-- ------------------------------------------------------------------
-- 1. Colonnes
-- ------------------------------------------------------------------
alter table public.profiles
  add column if not exists personas_published boolean not null default false;
alter table public.profiles
  add column if not exists personas_project_id uuid;

-- FK : drop puis recreate pour rester idempotent.
alter table public.profiles
  drop constraint if exists profiles_personas_project_id_fkey;
alter table public.profiles
  add constraint profiles_personas_project_id_fkey
  foreign key (personas_project_id)
  references public.projects(id)
  on delete set null;

-- Index partiel (rare qu'un projet ait des personas pinnés).
create index if not exists profiles_personas_project_id_idx
  on public.profiles (personas_project_id)
  where personas_project_id is not null;

-- ------------------------------------------------------------------
-- 2. Vue client_spaces — expose les nouveaux flags pour la home espace
-- ------------------------------------------------------------------
drop view if exists public.client_spaces;
create view public.client_spaces with (security_invoker = false) as
select
  p.id,
  p.slug,
  p.full_name,
  p.avatar_url,
  p.created_at,
  p.personas_published,
  p.personas_project_id,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id',            pr.id,
          'name',          pr.name,
          'slug',          pr.slug,
          'subtitle',      pr.subtitle,
          'project_type',  pr.project_type,
          'delivery_date', pr.delivery_date,
          'created_at',    pr.created_at,
          'pages',         coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'id',         pa.id,
                  'name',       pa.name,
                  'slug',       pa.slug,
                  'position',   pa.position,
                  'created_at', pa.created_at
                )
                order by pa.position asc, pa.created_at asc
              )
              from public.pages pa
              where pa.project_id = pr.id
                and pa.is_published = true
            ),
            '[]'::jsonb
          )
        )
        order by pr.position asc, pr.created_at asc
      )
      from public.projects pr
      where pr.profile_id = p.id
        and pr.is_published = true
    ),
    '[]'::jsonb
  ) as projects
from public.profiles p
where p.is_owner = false
  and p.is_published = true
  and p.slug is not null;

grant select on public.client_spaces to anon, authenticated;

-- ------------------------------------------------------------------
-- 3. Vue client_personas_public — exige personas_published = true
-- ------------------------------------------------------------------
drop view if exists public.client_personas_public;
create view public.client_personas_public with (security_invoker = false) as
  select
    p.id,
    p.profile_id,
    p.name,
    p.role,
    p.age,
    p.location,
    p.quote,
    p.bio,
    p.goals,
    p.frustrations,
    p.motivations,
    p.behaviors,
    p.tech_comfort,
    p.notes,
    p.cover_media_id,
    p.position,
    p.created_at,
    p.updated_at
  from public.client_personas p
  join public.profiles pr on pr.id = p.profile_id
  where pr.is_owner = false
    and pr.is_published = true
    and pr.personas_published = true
    and pr.slug is not null;

grant select on public.client_personas_public to anon, authenticated;

-- ------------------------------------------------------------------
-- 4. Vue client_persona_media_public — exige personas_published = true
-- ------------------------------------------------------------------
drop view if exists public.client_persona_media_public;
create view public.client_persona_media_public with (security_invoker = false) as
  select
    m.id,
    m.profile_id,
    m.persona_id,
    m.filename,
    m.storage_path,
    m.mime_type,
    m.position,
    m.created_at
  from public.client_media m
  join public.profiles pr on pr.id = m.profile_id
  where m.persona_id is not null
    and pr.is_owner = false
    and pr.is_published = true
    and pr.personas_published = true
    and pr.slug is not null;

grant select on public.client_persona_media_public to anon, authenticated;

commit;
