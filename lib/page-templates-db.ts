/**
 * Chargement combiné des templates de page : presets code (lib/page-templates.ts)
 * + templates BDD (table `page_templates`).
 *
 * Utilisé par l'écran "Nouvelle page" (filtré par project_type) et par
 * l'action `createPage` (résolution d'un id en template instanciable).
 */
import type { PageContent } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getPageTemplate as getCodeTemplate,
  MARKDOWN_VIRTUAL_TEMPLATE,
  PAGE_TEMPLATES,
  RAW_HTML_VIRTUAL_TEMPLATE,
  type PageTemplate,
} from "@/lib/page-templates";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Liste les templates disponibles pour un type de projet donné :
 *   - tous les presets code (toujours)
 *   - les templates DB dont `project_type` est null ou matche le type courant
 *
 * `projectType` peut être null (projet sans type) → on retourne uniquement
 * les templates DB "toutes catégories".
 */
export async function listTemplatesForProject(
  admin: AdminClient,
  projectType: string | null,
): Promise<PageTemplate[]> {
  const query = admin
    .from("page_templates")
    .select(
      "id, label, tagline, description, project_type, default_content, created_at",
    )
    .order("created_at", { ascending: false });

  // Filtrage : on récupère les templates "toutes catégories" (null) + ceux
  // qui matchent le projectType s'il est défini.
  const { data, error } = projectType
    ? await query.or(`project_type.is.null,project_type.eq.${projectType}`)
    : await query.is("project_type", null);

  if (error) {
    console.error("[listTemplatesForProject] DB error:", error);
    return [...PAGE_TEMPLATES];
  }

  const dbTemplates: PageTemplate[] = (data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    tagline: row.tagline ?? "Template personnalisé",
    description: row.description ?? undefined,
    source: "db" as const,
    projectType: row.project_type,
    defaultContent: (row.default_content as PageContent) ?? {},
  }));

  // Les tuiles d'upload direct ("Reproduction fidèle", "Parchemin Markdown")
  // apparaissent toujours, en premier : elles sont universelles et ne
  // dépendent pas du type de projet.
  return [
    RAW_HTML_VIRTUAL_TEMPLATE,
    MARKDOWN_VIRTUAL_TEMPLATE,
    ...PAGE_TEMPLATES,
    ...dbTemplates,
  ];
}

/**
 * Résout un id de template (code ou UUID DB) en `PageTemplate` instanciable.
 * Retourne null si inexistant.
 */
export async function loadTemplate(
  admin: AdminClient,
  id: string,
): Promise<PageTemplate | null> {
  const codeTemplate = getCodeTemplate(id);
  if (codeTemplate) return codeTemplate;

  const { data } = await admin
    .from("page_templates")
    .select("id, label, tagline, description, project_type, default_content")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    label: data.label,
    tagline: data.tagline ?? "Template personnalisé",
    description: data.description ?? undefined,
    source: "db",
    projectType: data.project_type,
    defaultContent: (data.default_content as PageContent) ?? {},
  };
}
