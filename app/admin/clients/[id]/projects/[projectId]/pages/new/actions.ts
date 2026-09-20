"use server";
import {
  resolveClientSegment,
  resolveProjectSegment,
  revalidateProjectPath,
} from "@/lib/admin/routes";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ensureUniqueSlug, slugify } from "@/lib/slug";
import { instantiateTemplate, isValidTemplateId } from "@/lib/page-templates";
import { loadTemplate } from "@/lib/page-templates-db";
import type { PageContent } from "@/types/database";

export type CreatePageState = {
  status: "idle" | "success" | "error";
  error?: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_HTML_SIZE = 3 * 1024 * 1024; // 3 MB
const MAX_DOCX_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_MARKDOWN_SIZE = 2 * 1024 * 1024; // 2 MB (texte brut)

const ALLOWED_DOCX_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword", // fallback pour les .doc, on tente quand même Mammoth
]);

const ALLOWED_HTML_MIME = new Set([
  "text/html",
  "application/xhtml+xml",
  "", // certains navigateurs n'envoient pas de mime pour les .html
]);

const ALLOWED_MARKDOWN_MIME = new Set([
  "text/markdown",
  "text/x-markdown",
  "text/plain",
  "application/octet-stream", // macOS/Windows n'ont pas toujours de mime .md
  "", // certains navigateurs n'envoient rien du tout
]);

export async function createPage(
  _prev: CreatePageState,
  formData: FormData,
): Promise<CreatePageState> {
  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", error: "Session expirée. Reconnecte-toi." };
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { status: "error", error: "Accès réservé au propriétaire." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      status: "error",
      error:
        "SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local — impossible d'écrire dans Supabase.",
    };
  }

  // Validation
  const profileId = String(formData.get("profile_id") ?? "").trim();
  const projectId = String(formData.get("project_id") ?? "").trim();
  const templateIdRaw = String(formData.get("template_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const isPublished = formData.get("is_published") === "on";

  if (!UUID_REGEX.test(profileId)) {
    return { status: "error", error: "Client invalide." };
  }
  if (!UUID_REGEX.test(projectId)) {
    return { status: "error", error: "Projet invalide." };
  }
  if (name.length < 2) {
    return {
      status: "error",
      error: "Le titre de la page doit faire au moins 2 caractères.",
    };
  }
  if (!isValidTemplateId(templateIdRaw)) {
    return { status: "error", error: "Template inconnu." };
  }

  const admin = createAdminClient();

  const template = await loadTemplate(admin, templateIdRaw);
  if (!template) {
    return { status: "error", error: "Template introuvable." };
  }

  // Vérifie que le projet appartient bien au client
  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("id, profile_id")
    .eq("id", projectId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (projectError || !project) {
    return { status: "error", error: "Projet introuvable." };
  }

  // Slug unique au sein du projet
  const baseSlug = slugify(name) || "page";
  const slug = await ensureUniqueSlug(baseSlug, async (candidate) => {
    const { data } = await admin
      .from("pages")
      .select("id")
      .eq("project_id", projectId)
      .eq("slug", candidate)
      .maybeSingle();
    return !!data;
  });

  // Position : prochaine à la fin
  const { data: existing } = await admin
    .from("pages")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition =
    existing && existing.length > 0 ? existing[0].position + 1 : 0;

  // Instancie le template (uuids frais pour chaque section)
  const content = instantiateTemplate(template, () => randomUUID());

  const { error: insertError } = await admin.from("pages").insert({
    project_id: projectId,
    name,
    slug,
    template_id: template.id,
    content,
    position: nextPosition,
    is_published: isPublished,
  });

  if (insertError) {
    console.error("[createPage] insert error:", insertError);
    return {
      status: "error",
      error: insertError.message || "Erreur d'insertion en base.",
    };
  }

  await revalidateProjectPath(profileId, projectId);
  revalidatePath(`/admin/clients`);
  redirect(
    `/admin/clients/${await resolveClientSegment(profileId)}/projects/${await resolveProjectSegment(profileId, projectId)}`,
  );
}

/**
 * Crée une page en mode "Reproduction fidèle" depuis un upload HTML direct.
 * Pas de passage par un template BDD : le HTML est stocké inline dans
 * pages.content.meta.raw_html, comme pour les pages issues d'un template
 * raw_html. `template_id` est fixé à la sentinelle "_raw_html" pour signaler
 * l'origine sans pointer vers une ligne `page_templates`.
 */
export async function createRawHtmlPage(
  _prev: CreatePageState,
  formData: FormData,
): Promise<CreatePageState> {
  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", error: "Session expirée. Reconnecte-toi." };
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { status: "error", error: "Accès réservé au propriétaire." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      status: "error",
      error:
        "SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local — impossible d'écrire dans Supabase.",
    };
  }

  // Validation
  const profileId = String(formData.get("profile_id") ?? "").trim();
  const projectId = String(formData.get("project_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const isPublished = formData.get("is_published") === "on";
  const file = formData.get("file");

  if (!UUID_REGEX.test(profileId)) {
    return { status: "error", error: "Client invalide." };
  }
  if (!UUID_REGEX.test(projectId)) {
    return { status: "error", error: "Projet invalide." };
  }
  if (name.length < 2) {
    return {
      status: "error",
      error: "Le titre de la page doit faire au moins 2 caractères.",
    };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", error: "Aucun fichier HTML reçu." };
  }
  if (file.size > MAX_HTML_SIZE) {
    return {
      status: "error",
      error: "Fichier HTML trop volumineux (max 3 MB).",
    };
  }

  const html = await file.text();
  if (html.trim().length < 20) {
    return { status: "error", error: "HTML trop court pour être exploitable." };
  }

  const admin = createAdminClient();

  // Vérifie l'appartenance projet → client
  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("id, profile_id")
    .eq("id", projectId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (projectError || !project) {
    return { status: "error", error: "Projet introuvable." };
  }

  // Slug unique au sein du projet
  const baseSlug = slugify(name) || "page";
  const slug = await ensureUniqueSlug(baseSlug, async (candidate) => {
    const { data } = await admin
      .from("pages")
      .select("id")
      .eq("project_id", projectId)
      .eq("slug", candidate)
      .maybeSingle();
    return !!data;
  });

  const { data: existing } = await admin
    .from("pages")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition =
    existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const content: PageContent = {
    intro: "",
    sections: [],
    meta: {
      style: "raw_html",
      raw_html: html,
    },
  };

  const { error: insertError } = await admin.from("pages").insert({
    project_id: projectId,
    name,
    slug,
    template_id: "_raw_html",
    content,
    position: nextPosition,
    is_published: isPublished,
  });

  if (insertError) {
    console.error("[createRawHtmlPage] insert error:", insertError);
    return {
      status: "error",
      error: insertError.message || "Erreur d'insertion en base.",
    };
  }

  await revalidateProjectPath(profileId, projectId);
  revalidatePath(`/admin/clients`);
  redirect(
    `/admin/clients/${await resolveClientSegment(profileId)}/projects/${await resolveProjectSegment(profileId, projectId)}`,
  );
}

/* ─── Import de parchemin : .docx, .md ou HTML artifact Claude ──────── */

/**
 * Crée un parchemin en mode raw_html à partir d'un upload.
 *
 * Sources supportées :
 *  - .docx (Word) : converti en HTML stylé via Mammoth
 *  - .md (Markdown) : converti en HTML stylé via marked
 *  - .html (artifact Claude ou export Word HTML) : stocké tel quel
 *
 * Le résultat est toujours un parchemin style "raw_html" qui rend le
 * HTML dans une iframe sandbox sur la page publique. Utilisé par les
 * blueprints à import (business plan, étude de marché, pitch deck) et par
 * la tuile universelle "Parchemin Markdown".
 */
export async function createPageFromImport(
  _prev: CreatePageState,
  formData: FormData,
): Promise<CreatePageState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", error: "Session expirée. Reconnecte-toi." };
  }
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { status: "error", error: "Accès réservé au propriétaire." };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      status: "error",
      error:
        "SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local — impossible d'écrire dans Supabase.",
    };
  }

  const profileId = String(formData.get("profile_id") ?? "").trim();
  const projectId = String(formData.get("project_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const isPublished = formData.get("is_published") === "on";
  const file = formData.get("file");

  if (!UUID_REGEX.test(profileId)) {
    return { status: "error", error: "Client invalide." };
  }
  if (!UUID_REGEX.test(projectId)) {
    return { status: "error", error: "Projet invalide." };
  }
  if (name.length < 2) {
    return {
      status: "error",
      error: "Le titre du parchemin doit faire au moins 2 caractères.",
    };
  }
  if (source !== "docx" && source !== "html" && source !== "markdown") {
    return { status: "error", error: "Source d'import inconnue." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", error: "Aucun fichier reçu." };
  }

  let html: string;
  if (source === "docx") {
    if (!ALLOWED_DOCX_MIME.has(file.type) && !/\.docx?$/i.test(file.name)) {
      return {
        status: "error",
        error: `Format attendu : .docx (reçu : ${file.type || "inconnu"}).`,
      };
    }
    if (file.size > MAX_DOCX_SIZE) {
      return {
        status: "error",
        error: "Fichier .docx trop volumineux (max 8 MB).",
      };
    }
    try {
      const buffer = await file.arrayBuffer();
      const { convertDocxToHtml } =
        await import("@/app/admin/clients/[id]/context/_lib/context-conversion");
      const result = await convertDocxToHtml(buffer, name);
      html = result.html;
    } catch (err) {
      console.error("[createPageFromImport] docx convert:", err);
      return {
        status: "error",
        error:
          err instanceof Error
            ? `Conversion .docx échouée : ${err.message}`
            : "Conversion .docx échouée.",
      };
    }
  } else if (source === "markdown") {
    if (
      !ALLOWED_MARKDOWN_MIME.has(file.type) &&
      !/\.(md|markdown|mdx)$/i.test(file.name)
    ) {
      return {
        status: "error",
        error: `Format attendu : .md (reçu : ${file.type || "inconnu"}).`,
      };
    }
    if (file.size > MAX_MARKDOWN_SIZE) {
      return {
        status: "error",
        error: "Fichier .md trop volumineux (max 2 MB).",
      };
    }
    const markdown = await file.text();
    if (markdown.trim().length < 2) {
      return {
        status: "error",
        error: "Markdown vide ou trop court pour être exploitable.",
      };
    }
    try {
      const { convertMarkdownToHtml } =
        await import("@/app/admin/clients/[id]/context/_lib/context-conversion");
      html = convertMarkdownToHtml(markdown, name);
    } catch (err) {
      console.error("[createPageFromImport] markdown convert:", err);
      return {
        status: "error",
        error:
          err instanceof Error
            ? `Conversion .md échouée : ${err.message}`
            : "Conversion .md échouée.",
      };
    }
  } else {
    if (!ALLOWED_HTML_MIME.has(file.type) && !/\.html?$/i.test(file.name)) {
      return {
        status: "error",
        error: `Format attendu : .html (reçu : ${file.type || "inconnu"}).`,
      };
    }
    if (file.size > MAX_HTML_SIZE) {
      return {
        status: "error",
        error: "Fichier HTML trop volumineux (max 3 MB).",
      };
    }
    html = await file.text();
    if (html.trim().length < 20) {
      return {
        status: "error",
        error: "HTML trop court pour être exploitable.",
      };
    }
  }

  const admin = createAdminClient();

  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("id, profile_id")
    .eq("id", projectId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (projectError || !project) {
    return { status: "error", error: "Projet introuvable." };
  }

  const baseSlug = slugify(name) || "parchemin";
  const slug = await ensureUniqueSlug(baseSlug, async (candidate) => {
    const { data } = await admin
      .from("pages")
      .select("id")
      .eq("project_id", projectId)
      .eq("slug", candidate)
      .maybeSingle();
    return !!data;
  });

  const { data: existing } = await admin
    .from("pages")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition =
    existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const content: PageContent = {
    intro: "",
    sections: [],
    meta: {
      style: "raw_html",
      raw_html: html,
    },
  };

  const { error: insertError } = await admin.from("pages").insert({
    project_id: projectId,
    name,
    slug,
    template_id: "_raw_html",
    content,
    position: nextPosition,
    is_published: isPublished,
  });

  if (insertError) {
    console.error("[createPageFromImport] insert error:", insertError);
    return {
      status: "error",
      error: insertError.message || "Erreur d'insertion en base.",
    };
  }

  await revalidateProjectPath(profileId, projectId);
  revalidatePath(`/admin/clients`);
  redirect(
    `/admin/clients/${await resolveClientSegment(profileId)}/projects/${await resolveProjectSegment(profileId, projectId)}`,
  );
}
