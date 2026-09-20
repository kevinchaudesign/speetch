"use server";
import { revalidateClientPath } from "@/lib/admin/resolve-client";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { generateClientPassword, hashPassword } from "@/lib/crypto";
import { isValidProjectType } from "@/lib/project-types";
import { ensureUniqueSlug, slugify } from "@/lib/slug";

export type CreateClientResult = {
  slug: string;
  fullName: string;
  url: string;
  password: string; // affiché UNE seule fois côté UI
  clientId: string;
};

export type CreateClientState = {
  status: "idle" | "success" | "error";
  error?: string;
  result?: CreateClientResult;
};

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Crée un client (profile) ET son premier projet en une étape.
 * Les projets additionnels passent par /admin/clients/[id]/projects/new.
 */
export async function createClientSpace(
  _prev: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  // 1. Garde-fou auth — uniquement le propriétaire
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

  // 2. Validation
  const fullName = String(formData.get("full_name") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const clientEmailRaw = String(formData.get("client_email") ?? "").trim();
  const customPassword = String(formData.get("password") ?? "").trim();
  const projectTypeRaw = String(formData.get("project_type") ?? "").trim();
  const projectType =
    projectTypeRaw && isValidProjectType(projectTypeRaw)
      ? projectTypeRaw
      : null;

  if (fullName.length < 2) {
    return {
      status: "error",
      error: "Le nom du client doit faire au moins 2 caractères.",
    };
  }

  if (clientEmailRaw && !EMAIL_REGEX.test(clientEmailRaw)) {
    return { status: "error", error: "E-mail du client invalide." };
  }

  if (customPassword && customPassword.length < 6) {
    return {
      status: "error",
      error: "Mot de passe trop court (min. 6 caractères).",
    };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      status: "error",
      error:
        "SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local — impossible d'écrire dans Supabase.",
    };
  }

  const admin = createAdminClient();

  // 3. Slug unique (basé sur full_name)
  const baseSlug = slugify(fullName);
  let slug: string;
  try {
    slug = await ensureUniqueSlug(baseSlug, async (candidate) => {
      const { data, error } = await admin
        .from("profiles")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    });
  } catch (e) {
    console.error("[createClientSpace] slug lookup error:", e);
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: unknown }).message)
          : "Impossible de générer un slug unique.";
    return { status: "error", error: message };
  }

  // 4. Mot de passe + hash
  const password = customPassword || generateClientPassword();
  let hashed: { hash: string; salt: string };
  try {
    hashed = hashPassword(password);
  } catch (e) {
    return {
      status: "error",
      error: e instanceof Error ? e.message : "Erreur lors du hash.",
    };
  }

  // 5. Insertion du CLIENT (profile)
  const { data: insertedProfile, error: profileError } = await admin
    .from("profiles")
    .insert({
      full_name: fullName,
      slug,
      client_email: clientEmailRaw ? clientEmailRaw.toLowerCase() : null,
      password_hash: hashed.hash,
      password_salt: hashed.salt,
      is_owner: false,
      is_published: true,
    })
    .select("id")
    .single();

  if (profileError || !insertedProfile) {
    return {
      status: "error",
      error: profileError?.message ?? "Erreur d'insertion du client.",
    };
  }

  // 6. Insertion du PREMIER PROJET
  // Slug du projet = slug du client (unique au sein du client, donc OK).
  const { error: projectError } = await admin.from("projects").insert({
    profile_id: insertedProfile.id,
    name: fullName,
    slug,
    subtitle: subtitle || null,
    project_type: projectType,
    content: {},
    is_published: true,
    position: 0,
  });

  if (projectError) {
    // Le client est créé mais sans projet — l'admin peut en ajouter via la
    // page détail. On remonte l'erreur en partial-success.
    console.error("[createClientSpace] project insert error:", projectError);
    return {
      status: "error",
      error: `Client créé mais erreur sur le premier projet : ${projectError.message}`,
    };
  }

  // 7. Succès
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  revalidatePath("/admin/clients");
  await revalidateClientPath(insertedProfile.id);

  return {
    status: "success",
    result: {
      slug,
      fullName,
      url: `${siteUrl}/clients/${slug}`,
      password,
      clientId: insertedProfile.id,
    },
  };
}
