-- ============================================================================
-- Speetch — Tables `client_page_deliverables` + `client_deliverable_feedback`
-- ----------------------------------------------------------------------------
-- Permet à une page de type "livrables" (PageContent.meta.style =
-- "deliverables") de contenir N visuels présentés au client pour
-- validation. Le client peut :
--   - poster un commentaire (thread chronologique)
--   - changer le statut du livrable (approved / changes_requested)
--
-- Les médias proviennent de client_media (médiathèque client). On garde la
-- FK pour la lecture mais ON DELETE SET NULL afin que la suppression d'un
-- média ne casse pas un livrable existant (côté UI on rendra un placeholder).
--
-- L'auteur d'un feedback est typé via `author_kind` (owner | client).
-- Pas de FK vers auth.users côté client : les espaces clients sont
-- standalone, c'est le cookie de gate qui légitime l'écriture côté server
-- action.
-- ----------------------------------------------------------------------------
-- Migration idempotente — peut être rejouée.
-- ============================================================================

begin;

-- ------------------------------------------------------------------
-- 1. Table client_page_deliverables
-- ------------------------------------------------------------------
create table if not exists public.client_page_deliverables (
  id          uuid        primary key default gen_random_uuid(),
  page_id     uuid        not null references public.pages(id) on delete cascade,
  media_id    uuid                 references public.client_media(id) on delete set null,
  format      text,
  title       text,
  description text,
  status      text        not null default 'pending',
  position    integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Statut borné
alter table public.client_page_deliverables
  drop constraint if exists client_page_deliverables_status_check;
alter table public.client_page_deliverables
  add constraint client_page_deliverables_status_check
  check (status in ('pending', 'approved', 'changes_requested'));

create index if not exists client_page_deliverables_page_id_position_idx
  on public.client_page_deliverables (page_id, position);

create index if not exists client_page_deliverables_media_id_idx
  on public.client_page_deliverables (media_id)
  where media_id is not null;

-- Trigger updated_at (réutilise public.touch_updated_at)
drop trigger if exists client_page_deliverables_touch_updated_at
  on public.client_page_deliverables;
create trigger client_page_deliverables_touch_updated_at
  before update on public.client_page_deliverables
  for each row execute function public.touch_updated_at();

alter table public.client_page_deliverables enable row level security;
revoke all on public.client_page_deliverables from anon, authenticated;

-- ------------------------------------------------------------------
-- 2. Table client_deliverable_feedback
-- ------------------------------------------------------------------
create table if not exists public.client_deliverable_feedback (
  id             uuid        primary key default gen_random_uuid(),
  deliverable_id uuid        not null references public.client_page_deliverables(id) on delete cascade,
  author_kind    text        not null,
  body           text        not null,
  created_at     timestamptz not null default now()
);

alter table public.client_deliverable_feedback
  drop constraint if exists client_deliverable_feedback_author_kind_check;
alter table public.client_deliverable_feedback
  add constraint client_deliverable_feedback_author_kind_check
  check (author_kind in ('owner', 'client'));

alter table public.client_deliverable_feedback
  drop constraint if exists client_deliverable_feedback_body_not_blank;
alter table public.client_deliverable_feedback
  add constraint client_deliverable_feedback_body_not_blank
  check (length(btrim(body)) > 0);

create index if not exists client_deliverable_feedback_deliverable_id_created_idx
  on public.client_deliverable_feedback (deliverable_id, created_at);

alter table public.client_deliverable_feedback enable row level security;
revoke all on public.client_deliverable_feedback from anon, authenticated;

-- ------------------------------------------------------------------
-- 3. Vue publique pour la lecture côté espace client
--    Filtre sur is_published de la page, du projet et du profil.
--    Le cookie de gate côté app vérifie déjà l'accès.
-- ------------------------------------------------------------------
drop view if exists public.client_page_deliverables_public;
create view public.client_page_deliverables_public with (security_invoker = false) as
  select
    d.id,
    d.page_id,
    pa.project_id,
    pr.profile_id,
    d.media_id,
    cm.filename       as media_filename,
    cm.mime_type      as media_mime_type,
    cm.storage_path   as media_storage_path,
    d.format,
    d.title,
    d.description,
    d.status,
    d.position,
    d.created_at,
    d.updated_at
  from public.client_page_deliverables d
  join public.pages    pa on pa.id = d.page_id
  join public.projects pr on pr.id = pa.project_id
  join public.profiles p  on p.id  = pr.profile_id
  left join public.client_media cm on cm.id = d.media_id
  where p.is_owner = false
    and p.is_published = true
    and p.slug is not null
    and pr.is_published = true
    and pa.is_published = true;

grant select on public.client_page_deliverables_public to anon, authenticated;

-- ------------------------------------------------------------------
-- 4. Vue publique pour les feedbacks
-- ------------------------------------------------------------------
drop view if exists public.client_deliverable_feedback_public;
create view public.client_deliverable_feedback_public with (security_invoker = false) as
  select
    f.id,
    f.deliverable_id,
    pa.id as page_id,
    pr.profile_id,
    f.author_kind,
    f.body,
    f.created_at
  from public.client_deliverable_feedback f
  join public.client_page_deliverables d on d.id = f.deliverable_id
  join public.pages    pa on pa.id = d.page_id
  join public.projects pr on pr.id = pa.project_id
  join public.profiles p  on p.id  = pr.profile_id
  where p.is_owner = false
    and p.is_published = true
    and p.slug is not null
    and pr.is_published = true
    and pa.is_published = true;

grant select on public.client_deliverable_feedback_public to anon, authenticated;

commit;
