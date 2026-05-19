-- Étend public.client_pages avec lot_id et lot_position pour que le sommaire
-- des pages d'un projet côté public puisse respecter l'ordre défini en admin.
--
-- Contexte : l'admin renumérote les pages 0..N-1 PAR LOT (cf.
-- reorderLotItems). Donc trier par pa.position seul mélange les lots :
-- une page en position 0 de Lot B arrive avant une page en position 1 de
-- Lot A. La vraie clé de tri globale est (lot.position, page.position),
-- avec les pages sans lot en fin (NULLS LAST côté requête).
--
-- security_invoker = false (security definer) conservé pour rester
-- lisible par anon sans select direct sur project_lots.

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
