"use server";
import { revalidateClientPath } from "@/lib/admin/resolve-client";

/**
 * Server actions pour les mockups Meta Ads.
 *
 * Les mockups sont stockés dans `pages.content.meta.meta_ads[]` (JSONB)
 * — pas de table dédiée. À chaque opération on relit le content, on patch
 * le tableau, puis on UPDATE le JSON entier. Acceptable tant que le nombre
 * de mockups par page reste raisonnable (cap dur via MAX_MOCKUPS_PER_PAGE).
 */

import { randomUUID } from "node:crypto";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  isValidMetaAdFormat,
  isValidMetaCta,
  getMetaAdFormatSpec,
} from "@/lib/meta-ads";
import type {
  MetaAdCarouselCard,
  MetaAdCta,
  MetaAdFormat,
  MetaAdMockup,
  PageContent,
} from "@/types/database";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_LABEL_LEN = 120;
const MAX_BRAND_NAME_LEN = 80;
const MAX_SPONSORED_LEN = 60;
const MAX_PRIMARY_TEXT_LEN = 2000;
const MAX_HEADLINE_LEN = 200;
const MAX_DESCRIPTION_LEN = 300;
const MAX_DISPLAY_URL_LEN = 120;
const MAX_MOCKUPS_PER_PAGE = 200;
const MAX_CAROUSEL_CARDS = 10;

export type MetaAdsActionContext = {
  profileId: string;
  projectId: string;
  pageId: string;
};

type AuthOk = {
  ok: true;
  admin: ReturnType<typeof createAdminClient>;
};
type ActionErr = { ok: false; error: string };

async function requireOwnerAndAdmin(): Promise<AuthOk | ActionErr> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Session expirée. Reconnecte-toi." };
  }
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { ok: false, error: "Accès réservé au propriétaire." };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manquant." };
  }
  return { ok: true, admin: createAdminClient() };
}

function validateCtx(ctx: MetaAdsActionContext): string | null {
  if (!UUID_REGEX.test(ctx.profileId)) return "Client invalide.";
  if (!UUID_REGEX.test(ctx.projectId)) return "Projet invalide.";
  if (!UUID_REGEX.test(ctx.pageId)) return "Page invalide.";
  return null;
}

function cleanText(raw: unknown, maxLen: number): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > maxLen) return trimmed.slice(0, maxLen);
  return trimmed;
}

async function revalidateBoth(ctx: MetaAdsActionContext) {
  await revalidateClientPath(
    ctx.profileId,
    `/projects/${ctx.projectId}/pages/${ctx.pageId}`,
  );
}

/**
 * Charge le content de la page + vérifie qu'elle appartient bien au projet
 * et au client. Renvoie le content normalisé (`meta.meta_ads` toujours
 * défini comme tableau).
 */
async function loadPageContent(
  admin: ReturnType<typeof createAdminClient>,
  ctx: MetaAdsActionContext,
): Promise<
  | {
      ok: true;
      content: PageContent;
      mockups: MetaAdMockup[];
    }
  | ActionErr
> {
  const { data: page } = await admin
    .from("pages")
    .select("id, project_id, content, projects!inner(id, profile_id)")
    .eq("id", ctx.pageId)
    .eq("project_id", ctx.projectId)
    .maybeSingle();
  if (!page) return { ok: false, error: "Page introuvable." };

  const project = (
    Array.isArray(page.projects) ? page.projects[0] : page.projects
  ) as { id: string; profile_id: string } | null;
  if (!project || project.profile_id !== ctx.profileId) {
    return { ok: false, error: "Page introuvable pour ce client." };
  }

  const content = ((page.content as PageContent) ?? {}) as PageContent;
  const mockups = Array.isArray(content.meta?.meta_ads)
    ? (content.meta!.meta_ads as MetaAdMockup[])
    : [];
  return { ok: true, content, mockups };
}

async function savePageMockups(
  admin: ReturnType<typeof createAdminClient>,
  ctx: MetaAdsActionContext,
  content: PageContent,
  nextMockups: MetaAdMockup[],
): Promise<ActionErr | { ok: true }> {
  // On renumérote les positions pour rester clean (0..N-1).
  const normalised = nextMockups.map((m, i) => ({ ...m, position: i }));
  const nextContent: PageContent = {
    ...content,
    meta: {
      ...(content.meta ?? {}),
      style: "meta_ads",
      meta_ads: normalised,
    },
  };
  const { error } = await admin
    .from("pages")
    .update({ content: nextContent })
    .eq("id", ctx.pageId);
  if (error) {
    console.error("[meta-ads] update content error:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Récupère un média de la médiathèque client et renvoie une URL publique.
 * Retourne null si introuvable ou pas le bon client.
 */
async function resolveMediaForClient(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
  mediaId: string,
): Promise<{ url: string; mime_type: string } | null> {
  if (!UUID_REGEX.test(mediaId)) return null;
  const { data } = await admin
    .from("client_media" as never)
    .select("id, profile_id, mime_type, storage_path")
    .eq("id", mediaId)
    .maybeSingle<{
      id: string;
      profile_id: string;
      mime_type: string;
      storage_path: string;
    }>();
  if (!data || data.profile_id !== profileId) return null;
  const { data: pub } = admin.storage
    .from("page-media")
    .getPublicUrl(data.storage_path);
  return { url: pub.publicUrl, mime_type: data.mime_type };
}

// ─── Create ────────────────────────────────────────────────────────────────

export type CreateMockupResult =
  | { ok: true; mockupId: string }
  | { ok: false; error: string };

export async function createMetaAdMockup(input: {
  ctx: MetaAdsActionContext;
  format: MetaAdFormat;
}): Promise<CreateMockupResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const err = validateCtx(input.ctx);
  if (err) return { ok: false, error: err };
  if (!isValidMetaAdFormat(input.format)) {
    return { ok: false, error: "Format Meta inconnu." };
  }

  const loaded = await loadPageContent(auth.admin, input.ctx);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  if (loaded.mockups.length >= MAX_MOCKUPS_PER_PAGE) {
    return {
      ok: false,
      error: `Limite atteinte (${MAX_MOCKUPS_PER_PAGE} mockups max par page).`,
    };
  }

  const id = randomUUID();
  const newMockup: MetaAdMockup = {
    id,
    position: loaded.mockups.length,
    format: input.format,
    label: null,
    brand: {
      name: "Mon Annonceur",
      avatar_url: null,
      sponsored_label: "Sponsorisé",
    },
    copy: {
      primary_text: "",
      headline: "",
      description: "",
      display_url: "",
    },
    cta: "learn_more",
    media: null,
    carousel: getMetaAdFormatSpec(input.format)?.carousel ? [] : undefined,
  };

  const saved = await savePageMockups(auth.admin, input.ctx, loaded.content, [
    ...loaded.mockups,
    newMockup,
  ]);
  if (!saved.ok) return saved;

  await revalidateBoth(input.ctx);
  return { ok: true, mockupId: id };
}

// ─── Update ────────────────────────────────────────────────────────────────

export type UpdateMockupPatch = {
  label?: string | null;
  format?: MetaAdFormat;
  brand?: {
    name?: string;
    sponsored_label?: string | null;
    avatar_media_id?: string | null;
  };
  copy?: {
    primary_text?: string | null;
    headline?: string | null;
    description?: string | null;
    display_url?: string | null;
  };
  cta?: MetaAdCta;
  media_id?: string | null;
};

export type UpdateMockupResult = { ok: true } | { ok: false; error: string };

export async function updateMetaAdMockup(input: {
  ctx: MetaAdsActionContext;
  mockupId: string;
  patch: UpdateMockupPatch;
}): Promise<UpdateMockupResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const err = validateCtx(input.ctx);
  if (err) return { ok: false, error: err };
  if (!UUID_REGEX.test(input.mockupId)) {
    return { ok: false, error: "Mockup invalide." };
  }

  const loaded = await loadPageContent(auth.admin, input.ctx);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const idx = loaded.mockups.findIndex((m) => m.id === input.mockupId);
  if (idx === -1) return { ok: false, error: "Mockup introuvable." };

  const current = loaded.mockups[idx];
  const next: MetaAdMockup = { ...current };

  if (input.patch.label !== undefined) {
    next.label = cleanText(input.patch.label, MAX_LABEL_LEN);
  }
  if (input.patch.format !== undefined) {
    if (!isValidMetaAdFormat(input.patch.format)) {
      return { ok: false, error: "Format Meta inconnu." };
    }
    next.format = input.patch.format;
    const spec = getMetaAdFormatSpec(input.patch.format);
    // Si on passe d'un format non-carousel à un format carousel, on initialise
    // le tableau. Inverse : on laisse — pas destructif tant que le renderer
    // ignore carousel quand le format n'est pas carousel.
    if (spec?.carousel && !next.carousel) next.carousel = [];
  }
  if (input.patch.cta !== undefined) {
    if (!isValidMetaCta(input.patch.cta)) {
      return { ok: false, error: "CTA inconnu." };
    }
    next.cta = input.patch.cta;
  }
  if (input.patch.brand !== undefined) {
    const b = input.patch.brand;
    const nextBrand = { ...next.brand };
    if (b.name !== undefined) {
      nextBrand.name = cleanText(b.name, MAX_BRAND_NAME_LEN) ?? "Annonceur";
    }
    if (b.sponsored_label !== undefined) {
      nextBrand.sponsored_label = cleanText(
        b.sponsored_label,
        MAX_SPONSORED_LEN,
      );
    }
    if (b.avatar_media_id !== undefined) {
      if (b.avatar_media_id === null) {
        nextBrand.avatar_url = null;
      } else {
        const resolved = await resolveMediaForClient(
          auth.admin,
          input.ctx.profileId,
          b.avatar_media_id,
        );
        if (!resolved) {
          return { ok: false, error: "Avatar introuvable pour ce client." };
        }
        if (!resolved.mime_type.startsWith("image/")) {
          return { ok: false, error: "L'avatar doit être une image." };
        }
        nextBrand.avatar_url = resolved.url;
      }
    }
    next.brand = nextBrand;
  }
  if (input.patch.copy !== undefined) {
    const c = input.patch.copy;
    const nextCopy = { ...next.copy };
    if (c.primary_text !== undefined) {
      nextCopy.primary_text =
        cleanText(c.primary_text, MAX_PRIMARY_TEXT_LEN) ?? "";
    }
    if (c.headline !== undefined) {
      nextCopy.headline = cleanText(c.headline, MAX_HEADLINE_LEN) ?? "";
    }
    if (c.description !== undefined) {
      nextCopy.description =
        cleanText(c.description, MAX_DESCRIPTION_LEN) ?? "";
    }
    if (c.display_url !== undefined) {
      nextCopy.display_url =
        cleanText(c.display_url, MAX_DISPLAY_URL_LEN) ?? "";
    }
    next.copy = nextCopy;
  }
  if (input.patch.media_id !== undefined) {
    if (input.patch.media_id === null) {
      next.media = null;
    } else {
      const resolved = await resolveMediaForClient(
        auth.admin,
        input.ctx.profileId,
        input.patch.media_id,
      );
      if (!resolved) {
        return { ok: false, error: "Média introuvable pour ce client." };
      }
      next.media = { url: resolved.url, mime_type: resolved.mime_type };
    }
  }

  const nextList = [...loaded.mockups];
  nextList[idx] = next;
  const saved = await savePageMockups(
    auth.admin,
    input.ctx,
    loaded.content,
    nextList,
  );
  if (!saved.ok) return saved;
  await revalidateBoth(input.ctx);
  return { ok: true };
}

// ─── Delete ────────────────────────────────────────────────────────────────

export async function deleteMetaAdMockup(input: {
  ctx: MetaAdsActionContext;
  mockupId: string;
}): Promise<{ ok: true } | ActionErr> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const err = validateCtx(input.ctx);
  if (err) return { ok: false, error: err };
  if (!UUID_REGEX.test(input.mockupId)) {
    return { ok: false, error: "Mockup invalide." };
  }

  const loaded = await loadPageContent(auth.admin, input.ctx);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const nextList = loaded.mockups.filter((m) => m.id !== input.mockupId);
  if (nextList.length === loaded.mockups.length) {
    return { ok: false, error: "Mockup introuvable." };
  }
  const saved = await savePageMockups(
    auth.admin,
    input.ctx,
    loaded.content,
    nextList,
  );
  if (!saved.ok) return saved;
  await revalidateBoth(input.ctx);
  return { ok: true };
}

// ─── Reorder ───────────────────────────────────────────────────────────────

export async function reorderMetaAdMockups(input: {
  ctx: MetaAdsActionContext;
  mockupIds: string[];
}): Promise<{ ok: true } | ActionErr> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const err = validateCtx(input.ctx);
  if (err) return { ok: false, error: err };
  if (
    !Array.isArray(input.mockupIds) ||
    input.mockupIds.length === 0 ||
    input.mockupIds.length > MAX_MOCKUPS_PER_PAGE ||
    !input.mockupIds.every((id) => UUID_REGEX.test(id)) ||
    new Set(input.mockupIds).size !== input.mockupIds.length
  ) {
    return { ok: false, error: "Liste invalide." };
  }

  const loaded = await loadPageContent(auth.admin, input.ctx);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  if (input.mockupIds.length !== loaded.mockups.length) {
    return { ok: false, error: "Liste désynchronisée — rafraîchis la page." };
  }
  const byId = new Map(loaded.mockups.map((m) => [m.id, m] as const));
  const nextList: MetaAdMockup[] = [];
  for (const id of input.mockupIds) {
    const found = byId.get(id);
    if (!found) {
      return { ok: false, error: "Mockup absent de la liste." };
    }
    nextList.push(found);
  }
  const saved = await savePageMockups(
    auth.admin,
    input.ctx,
    loaded.content,
    nextList,
  );
  if (!saved.ok) return saved;
  await revalidateBoth(input.ctx);
  return { ok: true };
}

// ─── Carousel cards ────────────────────────────────────────────────────────

export async function addCarouselCard(input: {
  ctx: MetaAdsActionContext;
  mockupId: string;
  mediaId: string;
}): Promise<{ ok: true; cardId: string } | ActionErr> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const err = validateCtx(input.ctx);
  if (err) return { ok: false, error: err };
  if (!UUID_REGEX.test(input.mockupId)) {
    return { ok: false, error: "Mockup invalide." };
  }

  const loaded = await loadPageContent(auth.admin, input.ctx);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const idx = loaded.mockups.findIndex((m) => m.id === input.mockupId);
  if (idx === -1) return { ok: false, error: "Mockup introuvable." };
  const mockup = loaded.mockups[idx];

  const spec = getMetaAdFormatSpec(mockup.format);
  if (!spec?.carousel) {
    return { ok: false, error: "Ce format n'accepte pas de carrousel." };
  }
  const cards = mockup.carousel ?? [];
  if (cards.length >= MAX_CAROUSEL_CARDS) {
    return {
      ok: false,
      error: `Maximum ${MAX_CAROUSEL_CARDS} cartes par carrousel.`,
    };
  }
  const resolved = await resolveMediaForClient(
    auth.admin,
    input.ctx.profileId,
    input.mediaId,
  );
  if (!resolved) {
    return { ok: false, error: "Média introuvable pour ce client." };
  }
  const newCard: MetaAdCarouselCard = {
    id: randomUUID(),
    media: { url: resolved.url, mime_type: resolved.mime_type },
    headline: "",
    description: "",
  };
  const nextMockup: MetaAdMockup = {
    ...mockup,
    carousel: [...cards, newCard],
  };
  const nextList = [...loaded.mockups];
  nextList[idx] = nextMockup;
  const saved = await savePageMockups(
    auth.admin,
    input.ctx,
    loaded.content,
    nextList,
  );
  if (!saved.ok) return saved;
  await revalidateBoth(input.ctx);
  return { ok: true, cardId: newCard.id };
}

export async function updateCarouselCard(input: {
  ctx: MetaAdsActionContext;
  mockupId: string;
  cardId: string;
  patch: {
    headline?: string | null;
    description?: string | null;
    media_id?: string | null;
    cta?: MetaAdCta | null;
  };
}): Promise<{ ok: true } | ActionErr> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const err = validateCtx(input.ctx);
  if (err) return { ok: false, error: err };
  if (!UUID_REGEX.test(input.mockupId) || !UUID_REGEX.test(input.cardId)) {
    return { ok: false, error: "Identifiant invalide." };
  }

  const loaded = await loadPageContent(auth.admin, input.ctx);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const mIdx = loaded.mockups.findIndex((m) => m.id === input.mockupId);
  if (mIdx === -1) return { ok: false, error: "Mockup introuvable." };
  const mockup = loaded.mockups[mIdx];
  const cards = mockup.carousel ?? [];
  const cIdx = cards.findIndex((c) => c.id === input.cardId);
  if (cIdx === -1) return { ok: false, error: "Carte introuvable." };
  const card = cards[cIdx];
  const nextCard: MetaAdCarouselCard = { ...card };

  if (input.patch.headline !== undefined) {
    nextCard.headline = cleanText(input.patch.headline, MAX_HEADLINE_LEN) ?? "";
  }
  if (input.patch.description !== undefined) {
    nextCard.description =
      cleanText(input.patch.description, MAX_DESCRIPTION_LEN) ?? "";
  }
  if (input.patch.media_id !== undefined) {
    if (input.patch.media_id === null) {
      nextCard.media = null;
    } else {
      const resolved = await resolveMediaForClient(
        auth.admin,
        input.ctx.profileId,
        input.patch.media_id,
      );
      if (!resolved) {
        return { ok: false, error: "Média introuvable pour ce client." };
      }
      nextCard.media = { url: resolved.url, mime_type: resolved.mime_type };
    }
  }
  if (input.patch.cta !== undefined) {
    if (input.patch.cta === null) {
      nextCard.cta = undefined;
    } else if (!isValidMetaCta(input.patch.cta)) {
      return { ok: false, error: "CTA inconnu." };
    } else {
      nextCard.cta = input.patch.cta;
    }
  }

  const nextCards = [...cards];
  nextCards[cIdx] = nextCard;
  const nextList = [...loaded.mockups];
  nextList[mIdx] = { ...mockup, carousel: nextCards };
  const saved = await savePageMockups(
    auth.admin,
    input.ctx,
    loaded.content,
    nextList,
  );
  if (!saved.ok) return saved;
  await revalidateBoth(input.ctx);
  return { ok: true };
}

export async function deleteCarouselCard(input: {
  ctx: MetaAdsActionContext;
  mockupId: string;
  cardId: string;
}): Promise<{ ok: true } | ActionErr> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const err = validateCtx(input.ctx);
  if (err) return { ok: false, error: err };
  if (!UUID_REGEX.test(input.mockupId) || !UUID_REGEX.test(input.cardId)) {
    return { ok: false, error: "Identifiant invalide." };
  }

  const loaded = await loadPageContent(auth.admin, input.ctx);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const mIdx = loaded.mockups.findIndex((m) => m.id === input.mockupId);
  if (mIdx === -1) return { ok: false, error: "Mockup introuvable." };
  const mockup = loaded.mockups[mIdx];
  const cards = mockup.carousel ?? [];
  const nextCards = cards.filter((c) => c.id !== input.cardId);
  if (nextCards.length === cards.length) {
    return { ok: false, error: "Carte introuvable." };
  }
  const nextList = [...loaded.mockups];
  nextList[mIdx] = { ...mockup, carousel: nextCards };
  const saved = await savePageMockups(
    auth.admin,
    input.ctx,
    loaded.content,
    nextList,
  );
  if (!saved.ok) return saved;
  await revalidateBoth(input.ctx);
  return { ok: true };
}
