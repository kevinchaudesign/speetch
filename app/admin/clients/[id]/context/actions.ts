"use server";
import {
  resolveClientSegment,
  revalidateClientPath,
  revalidateContextPath,
  revalidateProjectPath,
} from "@/lib/admin/routes";

import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { CUSTOM_TEMPLATE_ID } from "@/lib/page-templates";
import { ensureUniqueSlug, slugify } from "@/lib/slug";
import type { PageContent } from "@/types/database";
import {
  MAX_DOCX_SIZE,
  MAX_HTML_SIZE,
  MAX_MARKDOWN_SIZE,
  MAX_PDF_SIZE,
  MAX_XLSX_SIZE,
  convertDocxToHtml,
  convertHtmlToContext,
  convertMarkdownToHtml,
  convertPdfToHtml,
  convertXlsxToHtml,
  extractMarkdownTitle,
  fetchHtmlFromUrl,
} from "./_lib/context-conversion";
import type { ClientContextInsert, ClientContextRow } from "./_lib/types";

function escapeHtmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeHtmlText(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * Construit le HTML d'un bloc à ajouter dans une note. Inline-styles
 * volontaires pour résister à des HTML source sans CSS du tout.
 */
function buildBlockHtml(block: AppendContextBlockInput["block"]): string {
  switch (block.type) {
    case "title": {
      const text = block.text.trim();
      if (!text) return "";
      const tag = block.level === 3 ? "h3" : "h2";
      const fontSize = block.level === 3 ? "1.4rem" : "1.75rem";
      return `<${tag} style="font-weight: 200; font-size: ${fontSize}; letter-spacing: -0.01em; margin: 2.25rem 0 0.75rem;">${escapeHtmlText(
        text,
      )}</${tag}>`;
    }
    case "text": {
      const trimmed = block.text.trim();
      if (!trimmed) return "";
      const paragraphs = trimmed
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map(
          (p) =>
            `<p style="margin: 0 0 1rem; line-height: 1.7;">${escapeHtmlText(
              p,
            ).replace(/\n/g, "<br>")}</p>`,
        )
        .join("\n");
      return paragraphs;
    }
    case "code": {
      const code = block.code;
      if (!code.trim()) return "";
      const langClass = block.language
        ? ` class="language-${escapeAttr(block.language)}"`
        : "";
      return `<pre style="background: #1a1a1a; color: #f5f5f0; padding: 1rem 1.25rem; border-radius: 8px; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85rem; line-height: 1.55; margin: 1.5rem 0;"><code${langClass}>${escapeHtmlText(
        code,
      )}</code></pre>`;
    }
    case "image": {
      const url = block.url.trim();
      if (!url) return "";
      const alt = block.alt.trim();
      const caption = block.caption?.trim() ?? "";
      const captionHtml = caption
        ? `<figcaption style="margin-top: 0.5rem; font-style: italic; font-family: ui-serif, Georgia, serif; color: #666; font-size: 0.875rem;">${escapeHtmlText(
            caption,
          )}</figcaption>`
        : "";
      return `<figure style="margin: 2rem 0;"><img src="${escapeAttr(
        url,
      )}" alt="${escapeAttr(alt)}" style="display: block; width: 100%; height: auto; border-radius: 4px;">${captionHtml}</figure>`;
    }
  }
}

/**
 * Insère un fragment HTML juste avant </body>. Si la balise n'est pas
 * trouvée, append à la fin.
 */
function insertBeforeBodyClose(html: string, fragment: string): string {
  const idx = html.toLowerCase().lastIndexOf("</body>");
  if (idx >= 0) {
    return html.slice(0, idx) + "\n" + fragment + "\n" + html.slice(idx);
  }
  return html + "\n" + fragment;
}

/**
 * Construit un HTML minimal éditable pour une note vide. Volontairement
 * léger : police système, max-width confortable, fond papier crème. Le
 * titre est échappé pour éviter toute injection.
 */
function buildEmptyNoteHtml(title: string): string {
  const safeTitle = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${safeTitle}</title>
<style>
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    max-width: 720px;
    margin: 0 auto;
    padding: 5rem 1.75rem 6rem;
    color: #1a1a1a;
    line-height: 1.7;
    background: #fafaf7;
  }
  h1 {
    font-weight: 200;
    font-size: clamp(2rem, 5vw, 3rem);
    letter-spacing: -0.02em;
    margin: 0 0 1.5rem;
  }
  p {
    color: #555;
    font-style: italic;
    font-family: ui-serif, Georgia, serif;
  }
</style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>Note vierge — utilise « Éditer HTML » dans la toolbar pour ajouter du contenu.</p>
</body>
</html>`;
}

/**
 * Extrait le contenu de la première balise <title>…</title> d'un HTML.
 * Renvoie null si absent ou vide après trim.
 */
function extractHtmlTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return null;
  const decoded = match[1]
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return decoded.length >= 2 ? decoded : null;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CreateContextState =
  | { status: "idle" }
  | { status: "error"; error: string };

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

/**
 * Crée une note de contexte interne pour un client à partir d'un HTML local
 * (upload) OU d'une URL fetchée côté serveur.
 *
 * Source ∈ {"upload","url"}. Pour "upload", `file` requis. Pour "url", `url`
 * requis. Titre admin optionnel (sinon Claude propose).
 */
export async function createClientContext(
  _prev: CreateContextState,
  formData: FormData,
): Promise<CreateContextState> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { status: "error", error: auth.error };

  const profileId = String(formData.get("profile_id") ?? "").trim();
  if (!UUID_REGEX.test(profileId)) {
    return { status: "error", error: "Client invalide." };
  }

  const sourceKindRaw = String(formData.get("source_kind") ?? "").trim();
  if (
    sourceKindRaw !== "upload" &&
    sourceKindRaw !== "url" &&
    sourceKindRaw !== "empty" &&
    sourceKindRaw !== "markdown" &&
    sourceKindRaw !== "docx" &&
    sourceKindRaw !== "pdf" &&
    sourceKindRaw !== "xlsx"
  ) {
    return {
      status: "error",
      error:
        "Source invalide (upload, markdown, docx, pdf, xlsx, url ou empty attendu).",
    };
  }
  const uiSourceKind = sourceKindRaw as
    | "upload"
    | "url"
    | "empty"
    | "markdown"
    | "docx"
    | "pdf"
    | "xlsx";

  const modeRaw = String(formData.get("mode") ?? "analyze").trim();
  if (modeRaw !== "analyze" && modeRaw !== "raw") {
    return {
      status: "error",
      error: "Mode invalide (analyze ou raw attendu).",
    };
  }
  // Markdown, docx, pdf, xlsx et empty forcent "raw" : rien à analyser via
  // Claude (déjà structuré côté source) ou rien à analyser (note vide).
  const mode =
    uiSourceKind === "empty" ||
    uiSourceKind === "markdown" ||
    uiSourceKind === "docx" ||
    uiSourceKind === "pdf" ||
    uiSourceKind === "xlsx"
      ? "raw"
      : (modeRaw as "analyze" | "raw");

  if (mode === "analyze" && !process.env.ANTHROPIC_API_KEY) {
    return {
      status: "error",
      error:
        "ANTHROPIC_API_KEY manquant dans .env.local — impossible d'appeler Claude pour l'analyse.",
    };
  }

  const overrideTitle = String(formData.get("title") ?? "").trim();

  let html: string;
  let sourceUrl: string | null = null;
  let sourceFilename: string | null = null;
  // Titre déjà résolu en amont (markdown : extrait du H1 / nom de fichier).
  // Quand non-null, court-circuite l'extraction depuis <title> en mode raw.
  let preResolvedTitle: string | null = null;

  if (uiSourceKind === "upload") {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { status: "error", error: "Aucun fichier HTML reçu." };
    }
    if (file.size > MAX_HTML_SIZE) {
      return {
        status: "error",
        error: "Fichier HTML trop volumineux (max 3 MB).",
      };
    }
    html = await file.text();
    sourceFilename = file.name || null;
    if (html.trim().length < 20) {
      return { status: "error", error: "HTML trop court pour être exploité." };
    }
  } else if (uiSourceKind === "markdown") {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { status: "error", error: "Aucun fichier Markdown reçu." };
    }
    if (file.size > MAX_MARKDOWN_SIZE) {
      return {
        status: "error",
        error: "Fichier Markdown trop volumineux (max 2 MB).",
      };
    }
    const mdText = await file.text();
    if (mdText.trim().length < 5) {
      return {
        status: "error",
        error: "Markdown trop court pour être exploité.",
      };
    }
    sourceFilename = file.name || null;
    const mdTitle = extractMarkdownTitle(mdText);
    const filenameTitle = sourceFilename
      ? sourceFilename.replace(/\.(md|markdown|mdx)$/i, "").trim() || null
      : null;
    preResolvedTitle =
      overrideTitle.length >= 2
        ? overrideTitle
        : (mdTitle ?? filenameTitle ?? "Note Markdown");
    html = convertMarkdownToHtml(mdText, preResolvedTitle);
  } else if (uiSourceKind === "docx") {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { status: "error", error: "Aucun fichier Word reçu." };
    }
    if (file.size > MAX_DOCX_SIZE) {
      return {
        status: "error",
        error: "Fichier Word trop volumineux (max 8 MB).",
      };
    }
    sourceFilename = file.name || null;
    const filenameTitle = sourceFilename
      ? sourceFilename.replace(/\.docx?$/i, "").trim() || null
      : null;
    const fallbackTitle =
      overrideTitle.length >= 2
        ? overrideTitle
        : (filenameTitle ?? "Note Word");
    try {
      const buffer = await file.arrayBuffer();
      const result = await convertDocxToHtml(buffer, fallbackTitle);
      preResolvedTitle =
        overrideTitle.length >= 2
          ? overrideTitle
          : (result.extractedTitle ?? filenameTitle ?? "Note Word");
      html = result.html;
    } catch (err) {
      console.error("[createClientContext] docx conversion error:", err);
      return {
        status: "error",
        error:
          "Impossible de convertir ce fichier Word. Vérifie qu'il s'agit bien d'un .docx valide.",
      };
    }
  } else if (uiSourceKind === "pdf") {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { status: "error", error: "Aucun fichier PDF reçu." };
    }
    if (file.size > MAX_PDF_SIZE) {
      return {
        status: "error",
        error: "Fichier PDF trop volumineux (max 12 MB).",
      };
    }
    sourceFilename = file.name || null;
    const filenameTitle = sourceFilename
      ? sourceFilename.replace(/\.pdf$/i, "").trim() || null
      : null;
    const fallbackTitle =
      overrideTitle.length >= 2 ? overrideTitle : (filenameTitle ?? "Note PDF");
    try {
      const buffer = await file.arrayBuffer();
      const result = await convertPdfToHtml(buffer, fallbackTitle);
      preResolvedTitle =
        overrideTitle.length >= 2
          ? overrideTitle
          : (result.extractedTitle ?? filenameTitle ?? "Note PDF");
      html = result.html;
    } catch (err) {
      console.error("[createClientContext] pdf conversion error:", err);
      return {
        status: "error",
        error:
          "Impossible de convertir ce fichier PDF. Vérifie qu'il s'agit bien d'un PDF lisible (non scanné).",
      };
    }
  } else if (uiSourceKind === "xlsx") {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { status: "error", error: "Aucun fichier Excel reçu." };
    }
    if (file.size > MAX_XLSX_SIZE) {
      return {
        status: "error",
        error: "Fichier Excel trop volumineux (max 10 MB).",
      };
    }
    sourceFilename = file.name || null;
    const filenameTitle = sourceFilename
      ? sourceFilename.replace(/\.(xlsx|xlsm|xls)$/i, "").trim() || null
      : null;
    const fallbackTitle =
      overrideTitle.length >= 2
        ? overrideTitle
        : (filenameTitle ?? "Note Excel");
    try {
      const buffer = await file.arrayBuffer();
      const result = await convertXlsxToHtml(buffer, fallbackTitle);
      preResolvedTitle =
        overrideTitle.length >= 2
          ? overrideTitle
          : (result.extractedTitle ?? filenameTitle ?? "Note Excel");
      html = result.html;
    } catch (err) {
      console.error("[createClientContext] xlsx conversion error:", err);
      return {
        status: "error",
        error:
          "Impossible de convertir ce fichier Excel. Vérifie qu'il s'agit bien d'un .xlsx valide.",
      };
    }
  } else if (uiSourceKind === "url") {
    const url = String(formData.get("url") ?? "").trim();
    if (!url) {
      return { status: "error", error: "URL manquante." };
    }
    const fetched = await fetchHtmlFromUrl(url);
    if (!fetched.ok) {
      return { status: "error", error: fetched.error };
    }
    html = fetched.html;
    sourceUrl = url;
    if (html.trim().length < 20) {
      return { status: "error", error: "HTML trop court pour être exploité." };
    }
  } else {
    // uiSourceKind === "empty"
    if (overrideTitle.length < 2) {
      return {
        status: "error",
        error:
          "Pour une note vide, le titre est requis (minimum 2 caractères).",
      };
    }
    html = buildEmptyNoteHtml(overrideTitle);
  }

  // Vérifie que le client existe (et est bien non-owner — on ne crée pas de
  // contexte pour l'owner profile).
  const { data: profile, error: profileError } = await auth.admin
    .from("profiles")
    .select("id, full_name, is_owner")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError || !profile) {
    return { status: "error", error: "Client introuvable." };
  }
  if (profile.is_owner) {
    return { status: "error", error: "Pas de contexte sur le profil owner." };
  }

  let finalTitle: string;
  let summary: string | null;
  let content: PageContent;

  if (mode === "raw") {
    // Reproduction fidèle — pas de Claude, HTML brut stocké tel quel.
    // Pour markdown, le titre a déjà été résolu (extraction H1 + fallback).
    const htmlTitle = preResolvedTitle ?? extractHtmlTitle(html);
    finalTitle =
      overrideTitle.length >= 2
        ? overrideTitle
        : (htmlTitle ?? sourceFilename ?? "Note (HTML brut)");
    summary = null;
    content = {
      intro: "",
      sections: [],
      meta: {
        style: "raw_html",
        raw_html: html,
      },
    };
  } else {
    // Mode "analyze" — appel Claude pour structurer le contenu.
    const ai = await convertHtmlToContext(html);
    if (!ai.ok) {
      return { status: "error", error: ai.error };
    }
    finalTitle =
      overrideTitle.length >= 2
        ? overrideTitle
        : ai.title.trim().length > 0
          ? ai.title.trim()
          : "Note de contexte";
    summary = ai.summary || null;
    content = stabilizeSectionIds(ai.content);
  }

  // Slug unique par client
  const baseSlug = slugify(finalTitle) || "note";
  const slug = await ensureUniqueSlug(baseSlug, async (candidate) => {
    const { data } = await auth.admin
      .from("client_contexts" as never)
      .select("id")
      .eq("profile_id", profileId)
      .eq("slug", candidate)
      .maybeSingle();
    return !!data;
  });

  // Le CHECK constraint en base n'accepte que upload/url/empty. Un import
  // .md est aussi un upload (avec un filename qui le distingue).
  // Le CHECK constraint en base n'accepte que upload/url/empty. Markdown,
  // docx, pdf et xlsx sont des sous-cas d'upload (le filename les distingue).
  const dbSourceKind: "upload" | "url" | "empty" =
    uiSourceKind === "markdown" ||
    uiSourceKind === "docx" ||
    uiSourceKind === "pdf" ||
    uiSourceKind === "xlsx"
      ? "upload"
      : uiSourceKind;

  const insertPayload: ClientContextInsert = {
    profile_id: profileId,
    title: finalTitle,
    slug,
    summary,
    content: content as unknown as ClientContextInsert["content"],
    source_kind: dbSourceKind,
    source_url: sourceUrl,
    source_filename: sourceFilename,
  };

  const { data: inserted, error: insertError } = await auth.admin
    .from("client_contexts" as never)
    .insert(insertPayload as never)
    .select("id, slug")
    .single<{ id: string; slug: string }>();

  if (insertError || !inserted) {
    console.error("[createClientContext] insert error:", insertError);
    return {
      status: "error",
      error: insertError?.message ?? "Erreur d'insertion en base.",
    };
  }

  await revalidateClientPath(profileId, `/context`);
  redirect(
    `/admin/clients/${await resolveClientSegment(profileId)}/context/${inserted.slug}`,
  );
}

export type UpdateHiddenElementsResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Met à jour la liste des sélecteurs CSS à masquer dans une note de contexte
 * en mode raw_html. Les sélecteurs sont stockés dans content.meta.hidden_elements
 * et appliqués via une balise <style> injectée au render.
 */
export async function updateContextHiddenElements(input: {
  profileId: string;
  contextId: string;
  hiddenElements: string[];
}): Promise<UpdateHiddenElementsResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.contextId)) {
    return { ok: false, error: "Note invalide." };
  }

  // Filtre + normalise : strings non vides, dédupliquées, max 200 entrées
  const cleaned = Array.from(
    new Set(
      input.hiddenElements
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length < 2000),
    ),
  ).slice(0, 200);

  const { data: row, error: fetchError } = await auth.admin
    .from("client_contexts" as never)
    .select("id, profile_id, content")
    .eq("id", input.contextId)
    .maybeSingle<Pick<ClientContextRow, "id" | "profile_id" | "content">>();

  if (fetchError || !row) {
    return { ok: false, error: "Note introuvable." };
  }
  if (row.profile_id !== input.profileId) {
    return { ok: false, error: "Note introuvable." };
  }

  const current = (row.content as PageContent) ?? {};
  const nextContent: PageContent = {
    ...current,
    meta: {
      ...(current.meta ?? {}),
      hidden_elements: cleaned,
    } as PageContent["meta"],
  };

  const { error } = await auth.admin
    .from("client_contexts" as never)
    .update({
      content: nextContent as unknown as ClientContextInsert["content"],
    } as never)
    .eq("id", input.contextId);

  if (error) {
    console.error("[updateContextHiddenElements] update error:", error);
    return { ok: false, error: error.message };
  }

  await revalidateContextPath(input.profileId, input.contextId);
  return { ok: true };
}

export type UpdateTextOverridesResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Met à jour la map text_overrides (texte original → texte personnalisé)
 * pour une note de contexte en mode raw_html. Le mapping est appliqué au
 * render via un script injecté dans l'iframe (cf. raw-html-context-view).
 */
export async function updateContextTextOverrides(input: {
  profileId: string;
  contextId: string;
  textOverrides: Record<string, string>;
}): Promise<UpdateTextOverridesResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.contextId)) {
    return { ok: false, error: "Note invalide." };
  }

  // Sanitize : strings, longueurs raisonnables, max 500 entrées
  const entries: Array<[string, string]> = Object.entries(
    input.textOverrides ?? {},
  )
    .filter(
      ([k, v]) =>
        typeof k === "string" &&
        typeof v === "string" &&
        k.trim().length > 0 &&
        k.length < 5000 &&
        v.length < 5000,
    )
    .slice(0, 500);
  const sanitized: Record<string, string> = Object.fromEntries(entries);

  const { data: row, error: fetchError } = await auth.admin
    .from("client_contexts" as never)
    .select("id, profile_id, content")
    .eq("id", input.contextId)
    .maybeSingle<Pick<ClientContextRow, "id" | "profile_id" | "content">>();

  if (fetchError || !row) {
    return { ok: false, error: "Note introuvable." };
  }
  if (row.profile_id !== input.profileId) {
    return { ok: false, error: "Note introuvable." };
  }

  const current = (row.content as PageContent) ?? {};
  if (current.meta?.style !== "raw_html") {
    return {
      ok: false,
      error: "Cette note n'est pas en mode reproduction fidèle.",
    };
  }

  const nextContent: PageContent = {
    ...current,
    meta: {
      ...(current.meta ?? {}),
      text_overrides: sanitized,
    } as PageContent["meta"],
  };

  const { error } = await auth.admin
    .from("client_contexts" as never)
    .update({
      content: nextContent as unknown as ClientContextInsert["content"],
    } as never)
    .eq("id", input.contextId);

  if (error) {
    console.error("[updateContextTextOverrides] update error:", error);
    return { ok: false, error: error.message };
  }

  await revalidateContextPath(input.profileId, input.contextId);
  return { ok: true };
}

export type UpdateRawHtmlResult = { ok: true } | { ok: false; error: string };

/**
 * Met à jour le HTML brut d'une note de contexte raw_html ET la liste
 * des sélecteurs CSS masqués. Utilisé quand l'admin supprime physiquement
 * des blocs de la page côté client : le composant viewer retire les
 * éléments dans l'iframe, ré-extrait `outerHTML` et envoie le résultat ici.
 *
 * Garde-fous :
 *  - max 5 MB (le HTML peut grossir suite à des réécritures browser)
 *  - le HTML doit ressembler à un document (contient <html ou <body)
 */
export async function updateContextRawHtml(input: {
  profileId: string;
  contextId: string;
  rawHtml: string;
  hiddenElements: string[];
}): Promise<UpdateRawHtmlResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.contextId)) {
    return { ok: false, error: "Note invalide." };
  }

  const rawHtml = String(input.rawHtml ?? "");
  if (rawHtml.length > 5 * 1024 * 1024) {
    return { ok: false, error: "HTML résultant trop volumineux (max 5 MB)." };
  }
  const lower = rawHtml.toLowerCase();
  if (!lower.includes("<html") && !lower.includes("<body")) {
    return {
      ok: false,
      error: "HTML invalide (pas de <html> ni de <body> détecté).",
    };
  }

  const cleaned = Array.from(
    new Set(
      input.hiddenElements
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length < 2000),
    ),
  ).slice(0, 200);

  const { data: row, error: fetchError } = await auth.admin
    .from("client_contexts" as never)
    .select("id, profile_id, content")
    .eq("id", input.contextId)
    .maybeSingle<Pick<ClientContextRow, "id" | "profile_id" | "content">>();

  if (fetchError || !row) {
    return { ok: false, error: "Note introuvable." };
  }
  if (row.profile_id !== input.profileId) {
    return { ok: false, error: "Note introuvable." };
  }

  const current = (row.content as PageContent) ?? {};
  if (current.meta?.style !== "raw_html") {
    return {
      ok: false,
      error: "Cette note n'est pas en mode reproduction fidèle.",
    };
  }

  const nextContent: PageContent = {
    ...current,
    meta: {
      ...(current.meta ?? {}),
      style: "raw_html",
      raw_html: rawHtml,
      hidden_elements: cleaned,
    } as PageContent["meta"],
  };

  const { error } = await auth.admin
    .from("client_contexts" as never)
    .update({
      content: nextContent as unknown as ClientContextInsert["content"],
    } as never)
    .eq("id", input.contextId);

  if (error) {
    console.error("[updateContextRawHtml] update error:", error);
    return { ok: false, error: error.message };
  }

  await revalidateContextPath(input.profileId, input.contextId);
  return { ok: true };
}

export type SetContextPublishingResult =
  | { ok: true; publishedPageId: string | null }
  | { ok: false; error: string };

/**
 * Met à jour l'état de publication d'une note de contexte vers un projet :
 *  - projectId=null, isPublished=false  → unpublish complet (supprime page)
 *  - projectId=X, isPublished=false     → garde le projet liaison mais
 *                                          supprime la page publiée
 *  - projectId=X, isPublished=true      → publie : crée une page dans le
 *                                          projet X (snapshot du contenu),
 *                                          supprime la page précédente si
 *                                          elle existait dans un autre projet
 *
 * La page publiée est un SNAPSHOT — modifier la note plus tard n'affecte
 * pas la page. Pour rafraîchir, toggle off puis on.
 */
export async function setContextPublishing(input: {
  profileId: string;
  contextId: string;
  projectId: string | null;
  isPublished: boolean;
}): Promise<SetContextPublishingResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.contextId)) {
    return { ok: false, error: "Note invalide." };
  }
  if (input.projectId !== null && !UUID_REGEX.test(input.projectId)) {
    return { ok: false, error: "Projet invalide." };
  }
  if (input.isPublished && input.projectId === null) {
    return {
      ok: false,
      error: "Choisis d'abord un projet de destination.",
    };
  }

  // 1. Vérifie la note
  const { data: ctx, error: fetchError } = await auth.admin
    .from("client_contexts" as never)
    .select(
      "id, profile_id, title, slug, content, project_id, published_page_id, lot_id",
    )
    .eq("id", input.contextId)
    .maybeSingle<
      Pick<
        ClientContextRow,
        | "id"
        | "profile_id"
        | "title"
        | "slug"
        | "content"
        | "project_id"
        | "published_page_id"
        | "lot_id"
      >
    >();

  if (fetchError || !ctx) {
    return { ok: false, error: "Note introuvable." };
  }
  if (ctx.profile_id !== input.profileId) {
    return { ok: false, error: "Note introuvable." };
  }

  // 2. Si la note avait une page publiée, la supprimer (toujours, qu'on
  //    republie ailleurs ou qu'on dépublie). Le FK ON DELETE SET NULL sur
  //    published_page_id se chargera de remettre la colonne à NULL.
  if (ctx.published_page_id) {
    const { error: delErr } = await auth.admin
      .from("pages")
      .delete()
      .eq("id", ctx.published_page_id);
    if (delErr) {
      console.error(
        "[setContextPublishing] delete previous page error:",
        delErr,
      );
      return {
        ok: false,
        error: `Impossible de supprimer la page précédente : ${delErr.message}`,
      };
    }
  }

  // 3. Si on publie : valide le projet + crée la page
  let newPageId: string | null = null;

  if (input.isPublished && input.projectId !== null) {
    const { data: project, error: projectError } = await auth.admin
      .from("projects")
      .select("id, profile_id")
      .eq("id", input.projectId)
      .maybeSingle();

    if (projectError || !project) {
      return { ok: false, error: "Projet introuvable." };
    }
    if (project.profile_id !== input.profileId) {
      return { ok: false, error: "Projet introuvable pour ce client." };
    }

    // Slug unique au sein du projet
    const baseSlug = slugify(ctx.title) || "note";
    const pageSlug = await ensureUniqueSlug(baseSlug, async (candidate) => {
      const { data } = await auth.admin
        .from("pages")
        .select("id")
        .eq("project_id", input.projectId as string)
        .eq("slug", candidate)
        .maybeSingle();
      return !!data;
    });

    // Si la note est déjà rangée dans un lot du projet de destination, on
    // transmet le lot_id à la page snapshot pour que la vue publique
    // (client_spaces) puisse grouper directement. Si le lot vient d'un autre
    // projet, on laisse null — le rattachement n'a plus de sens.
    let snapshotLotId: string | null = null;
    if (ctx.lot_id) {
      const { data: lot } = await auth.admin
        .from("project_lots" as never)
        .select("id, project_id")
        .eq("id", ctx.lot_id)
        .maybeSingle<{ id: string; project_id: string }>();
      if (lot && lot.project_id === input.projectId) {
        snapshotLotId = ctx.lot_id;
      }
    }

    const { data: createdPage, error: insertError } = await auth.admin
      .from("pages")
      .insert({
        project_id: input.projectId,
        name: ctx.title,
        slug: pageSlug,
        template_id: CUSTOM_TEMPLATE_ID,
        content: ctx.content as PageContent,
        is_published: true,
        lot_id: snapshotLotId,
      } as never)
      .select("id")
      .single<{ id: string }>();

    if (insertError || !createdPage) {
      console.error("[setContextPublishing] insert page error:", insertError);
      return {
        ok: false,
        error: insertError?.message ?? "Erreur de création de la page.",
      };
    }
    newPageId = createdPage.id;
  }

  // 4. Update la note : project_id + published_page_id (+ lot_id si le
  // projet change, pour éviter une référence morte vers un lot d'un autre
  // projet).
  const finalProjectId = input.projectId;
  const updatePayload: Record<string, unknown> = {
    project_id: finalProjectId,
    published_page_id: newPageId,
  };
  if (ctx.project_id !== finalProjectId) {
    updatePayload.lot_id = null;
  }
  const { error: updateError } = await auth.admin
    .from("client_contexts" as never)
    .update(updatePayload as never)
    .eq("id", input.contextId);

  if (updateError) {
    console.error("[setContextPublishing] update context error:", updateError);
    // Rollback : si on a créé une page mais que l'update échoue, supprime la page
    if (newPageId) {
      await auth.admin.from("pages").delete().eq("id", newPageId);
    }
    return { ok: false, error: updateError.message };
  }

  await revalidateClientPath(input.profileId, `/context`);
  await revalidateContextPath(input.profileId, input.contextId);
  if (finalProjectId) {
    await revalidateProjectPath(input.profileId, finalProjectId);
  }
  return { ok: true, publishedPageId: newPageId };
}

const CONTEXT_MEDIA_BUCKET = "page-media";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export type AppendContextBlockInput = {
  profileId: string;
  contextId: string;
  block:
    | { type: "title"; text: string; level: 2 | 3 }
    | { type: "text"; text: string }
    | { type: "code"; code: string; language?: string | null }
    | {
        type: "image";
        url: string;
        alt: string;
        caption?: string | null;
      };
};

export type AppendContextBlockResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Ajoute un bloc HTML à la fin du raw_html d'une note (avant </body>).
 * Préserve hidden_elements et text_overrides puisque le HTML existant
 * n'est pas modifié.
 */
export async function appendContextBlock(
  input: AppendContextBlockInput,
): Promise<AppendContextBlockResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.contextId)) {
    return { ok: false, error: "Note invalide." };
  }

  const html = buildBlockHtml(input.block);
  if (!html) {
    return { ok: false, error: "Bloc vide — rien à ajouter." };
  }

  const { data: ctx, error: fetchError } = await auth.admin
    .from("client_contexts" as never)
    .select("id, profile_id, content")
    .eq("id", input.contextId)
    .maybeSingle<Pick<ClientContextRow, "id" | "profile_id" | "content">>();

  if (fetchError || !ctx) {
    return { ok: false, error: "Note introuvable." };
  }
  if (ctx.profile_id !== input.profileId) {
    return { ok: false, error: "Note introuvable." };
  }

  const current = (ctx.content as PageContent) ?? {};
  if (current.meta?.style !== "raw_html") {
    return {
      ok: false,
      error: "Cette note n'est pas en mode reproduction fidèle.",
    };
  }
  const currentRaw = current.meta.raw_html ?? "";
  const nextRaw = insertBeforeBodyClose(currentRaw, html);

  const nextContent: PageContent = {
    ...current,
    meta: {
      ...(current.meta ?? {}),
      raw_html: nextRaw,
    } as PageContent["meta"],
  };

  const { error } = await auth.admin
    .from("client_contexts" as never)
    .update({
      content: nextContent as unknown as ClientContextInsert["content"],
    } as never)
    .eq("id", input.contextId);

  if (error) {
    console.error("[appendContextBlock] update error:", error);
    return { ok: false, error: error.message };
  }

  await revalidateContextPath(input.profileId, input.contextId);
  return { ok: true };
}

export type UploadContextImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Upload une image dans le bucket page-media sous le chemin
 * `contexts/{contextId}/{timestamp}-{cleanName}` et renvoie l'URL publique.
 * Utilisé par le panneau "Ajouter un bloc image".
 */
export async function uploadContextImage(
  formData: FormData,
): Promise<UploadContextImageResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const profileId = String(formData.get("profile_id") ?? "").trim();
  const contextId = String(formData.get("context_id") ?? "").trim();
  if (!UUID_REGEX.test(profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(contextId)) {
    return { ok: false, error: "Note invalide." };
  }

  // Vérifie la note (et ownership)
  const { data: ctx, error: fetchError } = await auth.admin
    .from("client_contexts" as never)
    .select("id, profile_id")
    .eq("id", contextId)
    .maybeSingle<Pick<ClientContextRow, "id" | "profile_id">>();
  if (fetchError || !ctx || ctx.profile_id !== profileId) {
    return { ok: false, error: "Note introuvable." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucun fichier reçu." };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { ok: false, error: "Image trop volumineuse (max 8 MB)." };
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "Format non supporté (png, jpeg, webp, gif, svg).",
    };
  }

  const cleanName =
    (file.name || "image")
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image";
  const ext =
    file.type === "image/svg+xml"
      ? "svg"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";
  const path = `contexts/${contextId}/${Date.now()}-${cleanName}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await auth.admin.storage
    .from(CONTEXT_MEDIA_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[uploadContextImage] upload error:", uploadError);
    return { ok: false, error: uploadError.message };
  }

  const { data: pub } = auth.admin.storage
    .from(CONTEXT_MEDIA_BUCKET)
    .getPublicUrl(path);

  return { ok: true, url: pub.publicUrl };
}

export type RefreshContextSnapshotResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Rafraîchit la page snapshot d'une note publiée : recopie content + title
 * de client_contexts vers la page liée. Évite le détour toggle off/on quand
 * l'admin veut juste propager une modif (texte, masquage, style Speetch…)
 * au côté public sans changer de projet ni de slug.
 */
export async function refreshContextSnapshot(input: {
  profileId: string;
  contextId: string;
}): Promise<RefreshContextSnapshotResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.contextId)) {
    return { ok: false, error: "Note invalide." };
  }

  const { data: ctx, error: fetchError } = await auth.admin
    .from("client_contexts" as never)
    .select("id, profile_id, title, content, published_page_id")
    .eq("id", input.contextId)
    .maybeSingle<
      Pick<
        ClientContextRow,
        "id" | "profile_id" | "title" | "content" | "published_page_id"
      >
    >();

  if (fetchError || !ctx) {
    return { ok: false, error: "Note introuvable." };
  }
  if (ctx.profile_id !== input.profileId) {
    return { ok: false, error: "Note introuvable." };
  }
  if (!ctx.published_page_id) {
    return { ok: false, error: "Cette note n'est pas publiée." };
  }

  const { error: updateError } = await auth.admin
    .from("pages")
    .update({
      name: ctx.title,
      content: ctx.content as PageContent,
    })
    .eq("id", ctx.published_page_id);

  if (updateError) {
    console.error("[refreshContextSnapshot] update page error:", updateError);
    return { ok: false, error: updateError.message };
  }

  await revalidateContextPath(input.profileId, input.contextId);
  return { ok: true };
}

export type SetContextSpeetchStyleResult =
  | { ok: true; enabled: boolean }
  | { ok: false; error: string };

/**
 * Active ou désactive l'overlay CSS Speetch sur une note. Stocké dans
 * `content.meta.apply_speetch_ds` (boolean). Le viewer raw_html lit ce
 * flag et injecte la feuille de style si true.
 */
export async function setContextSpeetchStyle(input: {
  profileId: string;
  contextId: string;
  enabled: boolean;
}): Promise<SetContextSpeetchStyleResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.contextId)) {
    return { ok: false, error: "Note invalide." };
  }

  const { data: row, error: fetchError } = await auth.admin
    .from("client_contexts" as never)
    .select("id, profile_id, content")
    .eq("id", input.contextId)
    .maybeSingle<Pick<ClientContextRow, "id" | "profile_id" | "content">>();

  if (fetchError || !row) {
    return { ok: false, error: "Note introuvable." };
  }
  if (row.profile_id !== input.profileId) {
    return { ok: false, error: "Note introuvable." };
  }

  const current = (row.content as PageContent) ?? {};
  const nextContent: PageContent = {
    ...current,
    meta: {
      ...(current.meta ?? {}),
      apply_speetch_ds: input.enabled,
    } as PageContent["meta"],
  };

  const { error } = await auth.admin
    .from("client_contexts" as never)
    .update({
      content: nextContent as unknown as ClientContextInsert["content"],
    } as never)
    .eq("id", input.contextId);

  if (error) {
    console.error("[setContextSpeetchStyle] update error:", error);
    return { ok: false, error: error.message };
  }

  await revalidateClientPath(input.profileId, `/context`);
  await revalidateContextPath(input.profileId, input.contextId);
  return { ok: true, enabled: input.enabled };
}

export type DeleteContextResult = { ok: true } | { ok: false; error: string };

export async function deleteClientContext(input: {
  profileId: string;
  contextId: string;
}): Promise<DeleteContextResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.contextId)) {
    return { ok: false, error: "Note invalide." };
  }

  const { data: row, error: fetchError } = await auth.admin
    .from("client_contexts" as never)
    .select("id, profile_id")
    .eq("id", input.contextId)
    .maybeSingle<Pick<ClientContextRow, "id" | "profile_id">>();

  if (fetchError || !row) {
    return { ok: false, error: "Note introuvable." };
  }
  if (row.profile_id !== input.profileId) {
    return { ok: false, error: "Note introuvable." };
  }

  const { error } = await auth.admin
    .from("client_contexts" as never)
    .delete()
    .eq("id", input.contextId);

  if (error) {
    console.error("[deleteClientContext] delete error:", error);
    return { ok: false, error: error.message };
  }

  await revalidateClientPath(input.profileId, `/context`);
  return { ok: true };
}

/**
 * Remplace les __SECTION_N__ placeholders par des uuids stables côté serveur.
 * (crypto.randomUUID est dispo dans le runtime Node de Next 15.)
 */
function stabilizeSectionIds(content: PageContent): PageContent {
  if (!content.sections || content.sections.length === 0) return content;
  return {
    ...content,
    sections: content.sections.map((s) => ({
      ...s,
      id: s.id?.startsWith("__SECTION_")
        ? crypto.randomUUID()
        : (s.id ?? crypto.randomUUID()),
    })),
  };
}
