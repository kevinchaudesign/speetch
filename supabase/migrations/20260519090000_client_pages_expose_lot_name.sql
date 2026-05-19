-- Ajoute lo.name dans la vue public.client_pages — utilisé pour étiqueter
-- les sections du sommaire (« Lot 01 · Brief créa ») côté dropdown des
-- pages d'un projet. Sans ça on n'a que lot_id + lot_position, donc la
-- section ne peut pas porter le nom du lot saisi en admin.

begin;

drop view if exists public.client_pages;

create view public.client_pages with (security_invoker = false) as
select
  p.id           as profile_id,
  p.slug         as client_slug,
  p.full_name    as client_name,
  pr.id          as project_id,
  pr.slug        as project_slug,
  pr.name        as project_name,
  pr.project_type,
  pr.delivery_date,
  pa.id          as page_id,
  pa.slug        as page_slug,
  pa.name        as page_name,
  pa.template_id,
  pa.content     as page_content,
  pa.position    as page_position,
  pa.lot_id      as lot_id,
  lo.position    as lot_position,
  lo.name        as lot_name,
  pa.created_at  as page_created_at,
  pa.updated_at  as page_updated_at
from public.profiles p
join public.projects pr on pr.profile_id = p.id
join public.pages    pa on pa.project_id = pr.id
left join public.project_lots lo on lo.id = pa.lot_id
where p.is_owner = false
  and p.is_published = true
  and p.slug is not null
  and pr.is_published = true
  and pa.is_published = true;

grant select on public.client_pages to anon, authenticated;

commit;
