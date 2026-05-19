-- ============================================================================
-- Speetch — La page personas peut être pinnée à PLUSIEURS projets
-- ----------------------------------------------------------------------------
-- Passage de 1-1 (profiles.personas_project_id) à N-N via une table de
-- jointure client_personas_project_pins. Sémantique inchangée côté UI :
--   - Aucun pin (table vide pour ce profil)  → section top-level
--   - Au moins un pin                        → lien dans chacun des projets
--                                              pinnés, plus de top-level
--
-- On migre les données existantes avant de dropper la colonne, pour ne
-- perdre aucun choix déjà fait.
-- ----------------------------------------------------------------------------
-- Migration idempotente — peut être rejouée.
-- ============================================================================

begin;

-- ------------------------------------------------------------------
-- 1. Table de jointure
-- ------------------------------------------------------------------
create table if not exists public.client_personas_project_pins (
  profile_id uuid        not null references public.profiles(id) on delete cascade,
  project_id uuid        not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, project_id)
);

create index if not exists client_personas_project_pins_project_id_idx
  on public.client_personas_project_pins (project_id);

-- RLS : aucun accès anon/authenticated. Tout passe par service_role (admin
-- server actions) ou via la vue publique client_spaces qui agrège ces ids
-- pour les afficher côté client.
alter table public.client_personas_project_pins enable row level security;
revoke all on public.client_personas_project_pins from anon, authenticated;

-- ------------------------------------------------------------------
-- 2. Migration data depuis profiles.personas_project_id
--    Si la colonne existait avec une valeur non nulle, on la recrée
--    comme pin. on conflict do nothing en cas de replay.
-- ------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'personas_project_id'
  ) then
    execute $sql$
      insert into public.client_personas_project_pins (profile_id, project_id)
        select id, personas_project_id
        from public.profiles
        where personas_project_id is not null
      on conflict (profile_id, project_id) do nothing
    $sql$;
  end if;
end
$$;

-- ------------------------------------------------------------------
-- 3. Drop la vue qui dépend de profiles.personas_project_id AVANT de
--    pouvoir dropper la colonne (sinon Postgres refuse).
-- ------------------------------------------------------------------
drop view if exists public.client_spaces;

-- ------------------------------------------------------------------
-- 4. Drop ancienne colonne, FK et index
-- ------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_personas_project_id_fkey;
drop index if exists public.profiles_personas_project_id_idx;
alter table public.profiles
  drop column if exists personas_project_id;

-- ------------------------------------------------------------------
-- 5. Recrée la vue client_spaces — expose personas_project_ids (jsonb)
-- ------------------------------------------------------------------
create view public.client_spaces with (security_invoker = false) as
select
  p.id,
  p.slug,
  p.full_name,
  p.avatar_url,
  p.created_at,
  p.personas_published,
  coalesce(
    (
      select jsonb_agg(pin.project_id order by pin.created_at asc)
      from public.client_personas_project_pins pin
      where pin.profile_id = p.id
    ),
    '[]'::jsonb
  ) as personas_project_ids,
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

commit;
