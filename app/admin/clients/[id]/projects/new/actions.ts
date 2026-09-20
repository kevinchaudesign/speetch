"use server";
import { revalidateClientPath } from "@/lib/admin/resolve-client";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isValidProjectType } from "@/lib/project-types";
import { ensureUniqueSlug, slugify } from "@/lib/slug";

export type CreateProjectState = {
  status: "idle" | "success" | "error";
  error?: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createProject(
  _prev: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
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
  const name = String(formData.get("name") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const projectTypeRaw = String(formData.get("project_type") ?? "").trim();
  const isPublished = formData.get("is_published") === "on";

  if (!UUID_REGEX.test(profileId)) {
    return { status: "error", error: "Client invalide." };
  }
  if (name.length < 2) {
    return {
      status: "error",
      error: "Le nom du projet doit faire au moins 2 caractères.",
    };
  }

  const projectType =
    projectTypeRaw && isValidProjectType(projectTypeRaw)
      ? projectTypeRaw
      : null;

  const admin = createAdminClient();

  // Slug unique parmi les projets du même client
  const baseSlug = slugify(name) || "projet";
  const slug = await ensureUniqueSlug(baseSlug, async (candidate) => {
    const { data } = await admin
      .from("projects")
      .select("id")
      .eq("profile_id", profileId)
      .eq("slug", candidate)
      .maybeSingle();
    return !!data;
  });

  // Calcule la prochaine position (à la fin)
  const { data: existing } = await admin
    .from("projects")
    .select("position")
    .eq("profile_id", profileId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition =
    existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { error: insertError } = await admin.from("projects").insert({
    profile_id: profileId,
    name,
    slug,
    subtitle: subtitle || null,
    project_type: projectType,
    content: {},
    is_published: isPublished,
    position: nextPosition,
  });

  if (insertError) {
    console.error("[createProject] insert error:", insertError);
    return {
      status: "error",
      error: insertError.message || "Erreur d'insertion en base.",
    };
  }

  revalidatePath("/admin/clients");
  await revalidateClientPath(profileId);
  redirect("/admin/clients");
}
