import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { clientLookupColumn } from "@/lib/admin/resolve-client";
import {
  isValidTemplateId,
  RAW_HTML_VIRTUAL_TEMPLATE_ID,
} from "@/lib/page-templates";
import { listTemplatesForProject, loadTemplate } from "@/lib/page-templates-db";
import { NewPageForm } from "./new-page-form";
import { NewRawHtmlPageForm } from "./new-raw-html-page-form";
import { BusinessPlanPicker } from "./business-plan-picker";
import { TemplatePicker } from "./template-picker";

const BUSINESS_PLAN_TEMPLATE_ID = "business_plan";

export const metadata: Metadata = {
  title: "Nouveau parchemin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewPagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; projectId: string }>;
  searchParams: Promise<{ template?: string; mode?: string }>;
}) {
  const { id, projectId } = await params;
  const { template, mode } = await searchParams;

  if (!UUID_REGEX.test(projectId)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?redirect=/admin/clients/${id}/projects/${projectId}/pages/new`,
    );
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq(clientLookupColumn(id), id)
    .eq("is_owner", false)
    .maybeSingle();
  if (!profile) notFound();

  const { data: project } = await admin
    .from("projects")
    .select("id, name, project_type, profile_id")
    .eq("id", projectId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  // Étape 2a — flow spécial "Reproduction fidèle" : upload HTML direct
  if (template === RAW_HTML_VIRTUAL_TEMPLATE_ID) {
    return (
      <NewRawHtmlPageForm
        clientId={profile.id}
        projectId={projectId}
        projectName={project.name}
      />
    );
  }

  // Étape 2b — flow spécial "Business plan" : écran 4 options (structure /
  // vierge / import docx / import HTML artifact Claude). Le param
  // `?mode=create` lève la garde et continue vers le form de création
  // standard avec le template business_plan pré-rempli.
  if (template === BUSINESS_PLAN_TEMPLATE_ID && mode !== "create") {
    return (
      <BusinessPlanPicker
        clientId={profile.id}
        projectId={projectId}
        projectName={project.name}
      />
    );
  }

  // Étape 2 — formulaire pré-rempli avec le template choisi
  if (template && isValidTemplateId(template)) {
    const resolved = await loadTemplate(admin, template);
    if (resolved) {
      return (
        <NewPageForm
          clientId={profile.id}
          projectId={projectId}
          projectName={project.name}
          initialTemplateId={template}
          templateLabel={resolved.label}
          templateTagline={resolved.tagline}
        />
      );
    }
  }

  // Étape 1 — sélecteur visuel (code presets + templates DB filtrés)
  const templates = await listTemplatesForProject(admin, project.project_type);

  return (
    <TemplatePicker
      clientId={profile.id}
      projectId={projectId}
      projectName={project.name}
      templates={templates}
    />
  );
}
