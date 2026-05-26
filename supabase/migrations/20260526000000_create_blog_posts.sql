-- ============================================================================
-- Speetch — Table `blog_posts`
-- ----------------------------------------------------------------------------
-- Blog studio Speetch — owner uniquement (vérif côté server action). Une
-- ligne par article. Contenu stocké en JSON Tiptap (source de vérité) +
-- HTML pré-rendu (servi tel quel côté public, zéro overhead JS).
--
-- RLS : lecture publique des posts publiés (status='published' et
-- published_at non null). Écriture réservée au service_role (server
-- actions admin).
-- ----------------------------------------------------------------------------
-- Migration idempotente — peut être rejouée sans risque.
-- ============================================================================

begin;

create table if not exists public.blog_posts (
  id                   uuid        primary key default gen_random_uuid(),
  slug                 text        not null unique,
  title                text        not null,
  excerpt              text,
  -- Contenu Tiptap. content_json = source de vérité pour la ré-édition,
  -- content_html = rendu pré-calculé servi côté public (SEO + perf).
  content_json         jsonb       not null default '{}'::jsonb,
  content_html         text        not null default '',
  status               text        not null default 'draft'
    check (status in ('draft', 'published')),
  published_at         timestamptz,
  -- Image d'aperçu (FK vers la médiathèque studio — servie en AVIF).
  cover_media_id       uuid        references public.client_media(id) on delete set null,
  -- Métadonnées SXO. NULL → on fallback sur title/excerpt côté render.
  seo_title            text,
  seo_description      text,
  canonical_url        text,
  -- Estimation du temps de lecture (min), recalculée à chaque save.
  reading_time_minutes integer     not null default 1,
  -- Auteur — typiquement l'owner Speetch.
  author_id            uuid        references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Garde-fous colonnes (si rejeu sur un schéma plus court).
alter table public.blog_posts add column if not exists content_json         jsonb       not null default '{}'::jsonb;
alter table public.blog_posts add column if not exists content_html         text        not null default '';
alter table public.blog_posts add column if not exists seo_title            text;
alter table public.blog_posts add column if not exists seo_description      text;
alter table public.blog_posts add column if not exists canonical_url        text;
alter table public.blog_posts add column if not exists reading_time_minutes integer     not null default 1;
alter table public.blog_posts add column if not exists author_id            uuid        references public.profiles(id) on delete set null;

-- Index : liste publique triée par date de pub décroissante.
create index if not exists blog_posts_status_published_at_idx
  on public.blog_posts (status, published_at desc nulls last);

-- Index slug (déjà unique → index implicite mais on l'expose nommément).
create index if not exists blog_posts_slug_idx
  on public.blog_posts (slug);

-- Trigger updated_at — réutilise public.touch_updated_at créée dans
-- 20260513000000_init_profiles.sql.
drop trigger if exists blog_posts_touch_updated_at on public.blog_posts;
create trigger blog_posts_touch_updated_at
  before update on public.blog_posts
  for each row
  execute function public.touch_updated_at();

-- RLS — lecture publique limitée aux posts publiés, écriture service-role only.
alter table public.blog_posts enable row level security;

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts"
  on public.blog_posts
  for select
  using (status = 'published' and published_at is not null);

commit;
