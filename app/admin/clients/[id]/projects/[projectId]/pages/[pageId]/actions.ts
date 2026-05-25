"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { PageContent } from "@/types/database";
import { CUSTOM_TEMPLATE_ID } from "@/lib/page-templates";
import {
  isValidChildSectionType,
  isValidSectionType,
  type ChildSection,
  type ChildSectionType,
  type Section,
  type SectionType,
} from "@/lib/section-types";
import type {
  ActionContext,
  ActionResult,
  SectionListResult,
  SectionResult,
} from "./actions-types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BUCKET = "page-media";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// ─── Helpers ────────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "fichier";
  return (
    base
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 200) || "fichier"
  );
}

function extractStoragePath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.slice(i + marker.length);
}

async function requireOwnerAndAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Session expirée. Reconnecte-toi." };
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { ok: false as const, error: "Accès réservé au propriétaire." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false as const,
      error:
        "SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local — impossible d'écrire dans Supabase.",
    };
  }

  return { ok: true as const, admin: createAdminClient() };
}

function validateContext(ctx: ActionContext): string | null {
  if (!UUID_REGEX.test(ctx.profileId)) return "Client invalide.";
  if (!UUID_REGEX.test(ctx.projectId)) return "Projet invalide.";
  if (!UUID_REGEX.test(ctx.pageId)) return "Page invalide.";
  return null;
}

async function fetchOwnedPage(
  admin: ReturnType<typeof createAdminClient>,
  ctx: ActionContext,
): Promise<
  | { ok: true; content: PageContent }
  | { ok: false; error: string }
> {
  const { data, error } = await admin
    .from("pages")
    .select("content, project_id, projects!inner(id, profile_id)")
    .eq("id", ctx.pageId)
    .eq("project_id", ctx.projectId)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "Page introuvable." };

  const project = data.projects as
    | { id: string; profile_id: string }
    | { id: string; profile_id: string }[]
    | null;
  const profileId = Array.isArray(project)
    ? project[0]?.profile_id
    : project?.profile_id;

  if (profileId !== ctx.profileId) {
    return { ok: false, error: "Page introuvable." };
  }

  return { ok: true, content: (data.content as PageContent) ?? {} };
}

async function saveContent(
  admin: ReturnType<typeof createAdminClient>,
  pageId: string,
  content: PageContent,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await admin
    .from("pages")
    .update({ content })
    .eq("id", pageId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function revalidateEditor(ctx: ActionContext) {
  revalidatePath(
    `/admin/clients/${ctx.profileId}/projects/${ctx.projectId}/pages/${ctx.pageId}`,
  );
  revalidatePath(`/admin/clients/${ctx.profileId}/projects/${ctx.projectId}`);
}

function makeEmptySection(type: SectionType): Section {
  const id = randomUUID();
  switch (type) {
    case "text":
      return { id, type, title: "", body: "" };
    case "image":
      return { id, type, title: "", media: [] };
    case "video":
      return { id, type, title: "", media: [] };
    case "embed":
      return { id, type, title: "", embedUrl: "" };
    case "gallery":
      return { id, type, title: "", media: [] };
    case "code":
      return { id, type, title: "", code: "", language: "text" };
    case "container":
      return { id, type, title: "", children: [] };
  }
}

function makeEmptyChildSection(type: ChildSectionType): ChildSection {
  const id = randomUUID();
  switch (type) {
    case "text":
      return { id, type, title: "", body: "" };
    case "image":
      return { id, type, title: "", media: [] };
    case "video":
      return { id, type, title: "", media: [] };
    case "embed":
      return { id, type, title: "", embedUrl: "" };
    case "gallery":
      return { id, type, title: "", media: [] };
    case "code":
      return { id, type, title: "", code: "", language: "text" };
  }
}

/**
 * Localise une section par son id dans l'arbre top-level / enfants de container.
 * Renvoie `null` si introuvable. Profondeur max : 1 (un container ne contient
 * pas d'autre container).
 */
type SectionLocation =
  | { kind: "top"; index: number }
  | { kind: "child"; parentIndex: number; childIndex: number };

function findSectionLocation(
  sections: Section[],
  sectionId: string,
): SectionLocation | null {
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].id === sectionId) return { kind: "top", index: i };
    if (sections[i].type === "container") {
      const children = sections[i].children ?? [];
      for (let j = 0; j < children.length; j++) {
        if (children[j].id === sectionId) {
          return { kind: "child", parentIndex: i, childIndex: j };
        }
      }
    }
  }
  return null;
}

/** Collecte tous les chemins de média (section + enfants si container). */
function collectMediaPaths(section: Section | ChildSection): string[] {
  const paths: string[] = [];
  for (const m of section.media ?? []) {
    const p = extractStoragePath(m.url);
    if (p) paths.push(p);
  }
  if ("children" in section && section.children) {
    for (const child of section.children) {
      paths.push(...collectMediaPaths(child));
    }
  }
  return paths;
}

// ─── Page-level fields ──────────────────────────────────────────────────

export async function updatePageName(
  input: ActionContext & { name: string },
): Promise<ActionResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const err = validateContext(input);
  if (err) return { ok: false, error: err };

  const name = input.name.trim();
  if (name.length < 2) {
    return {
      ok: false,
      error: "Le titre doit faire au moins 2 caractères.",
    };
  }

  const page = await fetchOwnedPage(auth.admin, input);
  if (!page.ok) return { ok: false, error: page.error };

  const { error } = await auth.admin
    .from("pages")
    .update({ name })
    .eq("id", input.pageId);
  if (error) return { ok: false, error: error.message };

  revalidateEditor(input);
  return { ok: true };
}

export async function updatePagePublished(
  input: ActionContext & { isPublished: boolean },
): Promise<ActionResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const err = validateContext(input);
  if (err) return { ok: false, error: err };

  const page = await fetchOwnedPage(auth.admin, input);
  if (!page.ok) return { ok: false, error: page.error };

  const { error } = await auth.admin
    .from("pages")
    .update({ is_published: input.isPublished })
    .eq("id", input.pageId);
  if (error) return { ok: false, error: error.message };

  revalidateEditor(input);
  return { ok: true };
}

/**
 * Détache une page de son template d'origine. Le contenu (intro, sections,
 * meta.raw_html, etc.) reste intact ; seul `template_id` passe à la sentinelle
 * `_custom`. Permet ensuite de retravailler librement la page sans lien
 * avec le template (qui peut même être supprimé sans impact).
 */
export async function detachPage(
  input: ActionContext,
): Promise<ActionResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const err = validateContext(input);
  if (err) return { ok: false, error: err };

  const page = await fetchOwnedPage(auth.admin, input);
  if (!page.ok) return { ok: false, error: page.error };

  const { error } = await auth.admin
    .from("pages")
    .update({ template_id: CUSTOM_TEMPLATE_ID })
    .eq("id", input.pageId);
  if (error) return { ok: false, error: error.message };

  revalidateEditor(input);
  revalidatePath(
    `/admin/clients/${input.profileId}/projects/${input.projectId}`,
  );
  return { ok: true };
}

// ─── Intro ──────────────────────────────────────────────────────────────

export async function updatePageIntro(
  input: ActionContext & { intro: string },
): Promise<ActionResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const err = validateContext(input);
  if (err) return { ok: false, error: err };

  const page = await fetchOwnedPage(auth.admin, input);
  if (!page.ok) return { ok: false, error: page.error };

  const next: PageContent = { ...page.content, intro: input.intro };
  const result = await saveContent(auth.admin, input.pageId, next);
  if (!result.ok) return result;

  revalidateEditor(input);
  return { ok: true };
}

// ─── Sections ───────────────────────────────────────────────────────────

export async function addSection(
  input: ActionContext & { type: SectionType },
): Promise<SectionResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const err = validateContext(input);
  if (err) return { ok: false, error: err };

  if (!isValidSectionType(input.type)) {
    return { ok: false, error: "Type de section inconnu." };
  }

  const page = await fetchOwnedPage(auth.admin, input);
  if (!page.ok) return { ok: false, error: page.error };

  const section = makeEmptySection(input.type);
  const sections = [...(page.content.sections ?? []), section];
  const next: PageContent = { ...page.content, sections };

  const result = await saveContent(auth.admin, input.pageId, next);
  if (!result.ok) return result;

  revalidateEditor(input);
  return { ok: true, section };
}

export async function updateSection(
  input: ActionContext & {
    sectionId: string;
    patch: Partial<Section>;
  },
): Promise<ActionResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const err = validateContext(input);
  if (err) return { ok: false, error: err };

  const page = await fetchOwnedPage(auth.admin, input);
  if (!page.ok) return { ok: false, error: page.error };

  const sections = page.content.sections ?? [];
  const loc = findSectionLocation(sections, input.sectionId);
  if (!loc) return { ok: false, error: "Section introuvable." };

  const nextSections = [...sections];
  if (loc.kind === "top") {
    const current = sections[loc.index];
    nextSections[loc.index] = {
      ...current,
      ...input.patch,
      id: current.id,
      type: current.type,
    };
  } else {
    const parent = sections[loc.parentIndex];
    const children = [...(parent.children ?? [])];
    const currentChild = children[loc.childIndex];
    children[loc.childIndex] = {
      ...currentChild,
      ...(input.patch as Partial<ChildSection>),
      id: currentChild.id,
      type: currentChild.type,
    };
    nextSections[loc.parentIndex] = { ...parent, children };
  }

  const next: PageContent = { ...page.content, sections: nextSections };

  const result = await saveContent(auth.admin, input.pageId, next);
  if (!result.ok) return result;

  revalidateEditor(input);
  return { ok: true };
}

/**
 * Ajoute un nouveau bloc enfant à la fin d'un conteneur. Un conteneur ne peut
 * pas contenir un autre conteneur (validation côté serveur).
 */
export async function addChildSection(
  input: ActionContext & { parentId: string; childType: ChildSectionType },
): Promise<SectionResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const err = validateContext(input);
  if (err) return { ok: false, error: err };

  if (!isValidChildSectionType(input.childType)) {
    return { ok: false, error: "Type de bloc enfant inconnu." };
  }

  const page = await fetchOwnedPage(auth.admin, input);
  if (!page.ok) return { ok: false, error: page.error };

  const sections = page.content.sections ?? [];
  const parentIdx = sections.findIndex((s) => s.id === input.parentId);
  if (parentIdx === -1) return { ok: false, error: "Conteneur introuvable." };
  if (sections[parentIdx].type !== "container") {
    return { ok: false, error: "Ce bloc n'est pas un conteneur." };
  }

  const child = makeEmptyChildSection(input.childType);
  const parent = sections[parentIdx];
  const nextChildren = [...(parent.children ?? []), child];
  const nextSections = [...sections];
  nextSections[parentIdx] = { ...parent, children: nextChildren };

  const next: PageContent = { ...page.content, sections: nextSections };
  const result = await saveContent(auth.admin, input.pageId, next);
  if (!result.ok) return result;

  revalidateEditor(input);
  return { ok: true, section: child as Section };
}

export async function removeSection(
  input: ActionContext & { sectionId: string },
): Promise<ActionResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const err = validateContext(input);
  if (err) return { ok: false, error: err };

  const page = await fetchOwnedPage(auth.admin, input);
  if (!page.ok) return { ok: false, error: page.error };

  const sections = page.content.sections ?? [];
  const loc = findSectionLocation(sections, input.sectionId);
  if (!loc) return { ok: false, error: "Section introuvable." };

  let nextSections: Section[];
  let mediaPaths: string[] = [];

  if (loc.kind === "top") {
    const target = sections[loc.index];
    mediaPaths = collectMediaPaths(target);
    nextSections = sections.filter((_, i) => i !== loc.index);
  } else {
    const parent = sections[loc.parentIndex];
    const children = parent.children ?? [];
    const targetChild = children[loc.childIndex];
    mediaPaths = collectMediaPaths(targetChild);
    const nextChildren = children.filter((_, j) => j !== loc.childIndex);
    nextSections = [...sections];
    nextSections[loc.parentIndex] = { ...parent, children: nextChildren };
  }

  if (mediaPaths.length > 0) {
    await auth.admin.storage.from(BUCKET).remove(mediaPaths);
  }

  const next: PageContent = { ...page.content, sections: nextSections };
  const result = await saveContent(auth.admin, input.pageId, next);
  if (!result.ok) return result;

  revalidateEditor(input);
  return { ok: true };
}

export async function moveSection(
  input: ActionContext & {
    sectionId: string;
    direction: "up" | "down";
  },
): Promise<SectionListResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const err = validateContext(input);
  if (err) return { ok: false, error: err };

  const page = await fetchOwnedPage(auth.admin, input);
  if (!page.ok) return { ok: false, error: page.error };

  const sections = [...(page.content.sections ?? [])];
  const loc = findSectionLocation(sections, input.sectionId);
  if (!loc) return { ok: false, error: "Section introuvable." };

  if (loc.kind === "top") {
    const newIdx = input.direction === "up" ? loc.index - 1 : loc.index + 1;
    if (newIdx < 0 || newIdx >= sections.length) {
      return { ok: true, sections };
    }
    [sections[loc.index], sections[newIdx]] = [
      sections[newIdx],
      sections[loc.index],
    ];
  } else {
    const parent = sections[loc.parentIndex];
    const children = [...(parent.children ?? [])];
    const newIdx =
      input.direction === "up" ? loc.childIndex - 1 : loc.childIndex + 1;
    if (newIdx < 0 || newIdx >= children.length) {
      return { ok: true, sections };
    }
    [children[loc.childIndex], children[newIdx]] = [
      children[newIdx],
      children[loc.childIndex],
    ];
    sections[loc.parentIndex] = { ...parent, children };
  }

  const next: PageContent = { ...page.content, sections };
  const result = await saveContent(auth.admin, input.pageId, next);
  if (!result.ok) return result;

  revalidateEditor(input);
  return { ok: true, sections };
}

// ─── Media ──────────────────────────────────────────────────────────────

export async function uploadSectionMedia(
  formData: FormData,
): Promise<SectionResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const ctx: ActionContext = {
    profileId: String(formData.get("profile_id") ?? "").trim(),
    projectId: String(formData.get("project_id") ?? "").trim(),
    pageId: String(formData.get("page_id") ?? "").trim(),
  };
  const sectionId = String(formData.get("section_id") ?? "").trim();

  const err = validateContext(ctx);
  if (err) return { ok: false, error: err };
  if (!sectionId) return { ok: false, error: "Section invalide." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucun fichier reçu." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "Fichier trop volumineux (max 50 MB)." };
  }

  const page = await fetchOwnedPage(auth.admin, ctx);
  if (!page.ok) return { ok: false, error: page.error };

  const sections = page.content.sections ?? [];
  const loc = findSectionLocation(sections, sectionId);
  if (!loc) return { ok: false, error: "Section introuvable." };

  const section: Section | ChildSection =
    loc.kind === "top"
      ? sections[loc.index]
      : (sections[loc.parentIndex].children ?? [])[loc.childIndex];

  const filename = sanitizeFilename(file.name);
  const path = `${ctx.pageId}/${sectionId}/${Date.now()}-${filename}`;

  const { error: uploadError } = await auth.admin.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
  if (uploadError) {
    console.error("[uploadSectionMedia] upload error:", uploadError);
    return { ok: false, error: uploadError.message };
  }

  const { data: publicUrlData } = auth.admin.storage
    .from(BUCKET)
    .getPublicUrl(path);
  const url = publicUrlData.publicUrl;
  const newMedia = { url };

  const currentMedia = section.media ?? [];
  const nextMedia =
    section.type === "image" || section.type === "video"
      ? [newMedia]
      : [...currentMedia, newMedia];

  // Pour image/video : on remplace → supprime l'ancien fichier du bucket
  if (
    (section.type === "image" || section.type === "video") &&
    currentMedia.length > 0
  ) {
    const oldPaths = currentMedia
      .map((m) => extractStoragePath(m.url))
      .filter((p): p is string => !!p);
    if (oldPaths.length > 0) {
      await auth.admin.storage.from(BUCKET).remove(oldPaths);
    }
  }

  const nextSections = [...sections];
  let updatedReturn: Section;
  if (loc.kind === "top") {
    const updated: Section = { ...(section as Section), media: nextMedia };
    nextSections[loc.index] = updated;
    updatedReturn = updated;
  } else {
    const parent = sections[loc.parentIndex];
    const children = [...(parent.children ?? [])];
    const updatedChild: ChildSection = {
      ...(section as ChildSection),
      media: nextMedia,
    };
    children[loc.childIndex] = updatedChild;
    nextSections[loc.parentIndex] = { ...parent, children };
    updatedReturn = updatedChild as Section;
  }

  const next: PageContent = { ...page.content, sections: nextSections };

  const result = await saveContent(auth.admin, ctx.pageId, next);
  if (!result.ok) return result;

  revalidateEditor(ctx);
  return { ok: true, section: updatedReturn };
}

export async function removeSectionMedia(
  input: ActionContext & {
    sectionId: string;
    mediaUrl: string;
  },
): Promise<SectionResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const err = validateContext(input);
  if (err) return { ok: false, error: err };

  const page = await fetchOwnedPage(auth.admin, input);
  if (!page.ok) return { ok: false, error: page.error };

  const sections = page.content.sections ?? [];
  const loc = findSectionLocation(sections, input.sectionId);
  if (!loc) return { ok: false, error: "Section introuvable." };

  const section: Section | ChildSection =
    loc.kind === "top"
      ? sections[loc.index]
      : (sections[loc.parentIndex].children ?? [])[loc.childIndex];

  const nextMedia = (section.media ?? []).filter(
    (m) => m.url !== input.mediaUrl,
  );

  const path = extractStoragePath(input.mediaUrl);
  if (path) {
    await auth.admin.storage.from(BUCKET).remove([path]);
  }

  const nextSections = [...sections];
  let updatedReturn: Section;
  if (loc.kind === "top") {
    const updated: Section = { ...(section as Section), media: nextMedia };
    nextSections[loc.index] = updated;
    updatedReturn = updated;
  } else {
    const parent = sections[loc.parentIndex];
    const children = [...(parent.children ?? [])];
    const updatedChild: ChildSection = {
      ...(section as ChildSection),
      media: nextMedia,
    };
    children[loc.childIndex] = updatedChild;
    nextSections[loc.parentIndex] = { ...parent, children };
    updatedReturn = updatedChild as Section;
  }

  const next: PageContent = { ...page.content, sections: nextSections };

  const result = await saveContent(auth.admin, input.pageId, next);
  if (!result.ok) return result;

  revalidateEditor(input);
  return { ok: true, section: updatedReturn };
}

// ─── Delete page ────────────────────────────────────────────────────────

export async function deletePage(input: ActionContext): Promise<ActionResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const err = validateContext(input);
  if (err) return { ok: false, error: err };

  const page = await fetchOwnedPage(auth.admin, input);
  if (!page.ok) return { ok: false, error: page.error };

  // Cleanup tous les médias des sections (incluant ceux des enfants de containers)
  const mediaPaths: string[] = [];
  for (const section of page.content.sections ?? []) {
    mediaPaths.push(...collectMediaPaths(section));
  }
  if (mediaPaths.length > 0) {
    await auth.admin.storage.from(BUCKET).remove(mediaPaths);
  }

  const { error } = await auth.admin
    .from("pages")
    .delete()
    .eq("id", input.pageId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/clients/${input.profileId}/projects/${input.projectId}`);
  redirect(`/admin/clients/${input.profileId}/projects/${input.projectId}`);
}
