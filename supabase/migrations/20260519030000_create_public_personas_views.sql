-- ============================================================================
-- Speetch — Vues publiques pour la consultation des personas par le client
-- ----------------------------------------------------------------------------
-- Le client gate (cookie de session sur profile_id) verrouille l'accès au
-- niveau application. Côté DB, ces vues filtrent sur is_published = true et
-- is_owner = false, et bypass RLS (security_invoker = false) pour que anon
-- puisse les lire.
--
-- Deux vues :
--   client_personas_public      : un persona par ligne
--   client_persona_media_public : un média taggé par ligne, joint au persona
--
-- Côté app, on combine les deux par persona_id pour reconstituer la liste
-- des visuels. Le bucket page-media étant déjà public, getPublicUrl() sur
-- storage_path suffit pour générer l'URL.
-- ----------------------------------------------------------------------------
-- Migration idempotente — peut être rejouée.
-- ============================================================================

begin;

-- ------------------------------------------------------------------
-- 1. Vue client_personas_public
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
    and pr.slug is not null;

grant select on public.client_personas_public to anon, authenticated;

-- ------------------------------------------------------------------
-- 2. Vue client_persona_media_public
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
    and pr.slug is not null;

grant select on public.client_persona_media_public to anon, authenticated;

commit;
