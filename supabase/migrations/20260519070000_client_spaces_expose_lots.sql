-- Recrée la vue public.client_spaces pour exposer le regroupement par lot
-- côté espace client public :
--   - chaque page porte son lot_id (utilisé pour bucketer dans LotBlock)
--   - chaque projet expose un tableau lots[] (id, name, position)
--
-- Aucun changement de schéma sous-jacent : la table project_lots et la
-- colonne pages.lot_id existent déjà (utilisées par l'admin), on les remonte
-- simplement à la couche publique. Sans ça, ClientSpaceView et
-- ProjectPageView reçoivent toujours lots = [] et page.lot_id = undefined,
-- donc useLotLayout reste false et tout retombe en liste plate.
--
-- security_invoker = false (= security definer) pour que la vue lise
-- project_lots avec les droits du propriétaire (les clients anon n'ont pas
-- de select direct sur project_lots/projects/pages).

begin;

drop view if exists public.client_spaces;

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
                  'created_at', pa.created_at,
                  'lot_id',     pa.lot_id
                )
                order by pa.position asc, pa.created_at asc
              )
              from public.pages pa
              where pa.project_id = pr.id
                and pa.is_published = true
            ),
            '[]'::jsonb
          ),
          'lots',          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'id',       lo.id,
                  'name',     lo.name,
                  'position', lo.position
                )
                order by lo.position asc, lo.created_at asc
              )
              from public.project_lots lo
              where lo.project_id = pr.id
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
