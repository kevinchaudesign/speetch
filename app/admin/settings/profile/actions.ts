"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type UpdateOwnerState = {
  status: "idle" | "success" | "error";
  error?: string;
};

const URL_REGEX = /^https?:\/\/[^\s]+$/i;
const AVATAR_BUCKET = "page-media";
const AVATAR_PATH_PREFIX = "owner/";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_AVATAR_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    case "image/svg+xml":
      return "svg";
    default:
      return "bin";
  }
}

/**
 * Si l'URL d'un avatar pointe vers notre bucket page-media/owner/, renvoie
 * le path Storage correspondant. Permet de supprimer l'ancien fichier au
 * remplacement (pas de fuite dans le bucket).
 */
function ownerAvatarPathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i < 0) return null;
  const path = url.slice(i + marker.length).split("?")[0];
  if (!path.startsWith(AVATAR_PATH_PREFIX)) return null;
  return path;
}

export async function updateOwnerProfile(
  _prev: UpdateOwnerState,
  formData: FormData,
): Promise<UpdateOwnerState> {
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

  const fullName = String(formData.get("full_name") ?? "").trim();
  const avatarUrlRaw = String(formData.get("avatar_url") ?? "").trim();
  const avatarFile = formData.get("avatar_file");
  const clearAvatar = String(formData.get("clear_avatar") ?? "") === "1";

  if (fullName.length < 2) {
    return {
      status: "error",
      error: "Le nom affiché doit faire au moins 2 caractères.",
    };
  }

  const admin = createAdminClient();

  // Lookup du profil owner — on assume au plus une ligne is_owner=true.
  const { data: ownerRow, error: lookupError } = await admin
    .from("profiles")
    .select("id, avatar_url")
    .eq("is_owner", true)
    .maybeSingle();

  if (lookupError) {
    console.error("[updateOwnerProfile] lookup error:", lookupError);
    return { status: "error", error: lookupError.message };
  }

  // Résolution de la nouvelle valeur d'avatar_url :
  //  - clearAvatar=1 → null + suppression du précédent fichier owner/
  //  - avatarFile (File non-vide) → upload, public URL
  //  - avatarUrlRaw → URL externe (validée)
  //  - sinon → on garde la valeur existante (champ caché côté form)
  let nextAvatarUrl: string | null | undefined; // undefined = pas de changement

  if (clearAvatar) {
    nextAvatarUrl = null;
  } else if (avatarFile instanceof File && avatarFile.size > 0) {
    if (avatarFile.size > MAX_AVATAR_BYTES) {
      return {
        status: "error",
        error: `L'image dépasse 5 MB (poids actuel : ${(avatarFile.size / (1024 * 1024)).toFixed(1)} MB).`,
      };
    }
    const mime = avatarFile.type || "application/octet-stream";
    if (!ALLOWED_AVATAR_MIMES.has(mime)) {
      return {
        status: "error",
        error:
          "Format non supporté. Utilise JPG, PNG, WEBP, GIF, AVIF ou SVG.",
      };
    }
    const ext = extFromMime(mime);
    const path = `${AVATAR_PATH_PREFIX}avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from(AVATAR_BUCKET)
      .upload(path, avatarFile, { upsert: false, contentType: mime });
    if (uploadError) {
      console.error("[updateOwnerProfile] upload error:", uploadError);
      return {
        status: "error",
        error: uploadError.message || "Échec de l'upload Supabase.",
      };
    }
    const { data: pub } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    nextAvatarUrl = pub.publicUrl;
  } else if (avatarUrlRaw.length > 0) {
    if (!URL_REGEX.test(avatarUrlRaw)) {
      return {
        status: "error",
        error: "L'URL de l'avatar doit commencer par http(s)://",
      };
    }
    nextAvatarUrl = avatarUrlRaw;
  }
  // sinon : nextAvatarUrl reste undefined (pas de changement)

  // Si on remplace ou efface ET que l'ancien était dans notre bucket,
  // on supprime le fichier pour ne pas laisser d'orphelin.
  if (nextAvatarUrl !== undefined && ownerRow?.avatar_url) {
    const prevPath = ownerAvatarPathFromUrl(ownerRow.avatar_url);
    if (prevPath) {
      const { error: removeError } = await admin.storage
        .from(AVATAR_BUCKET)
        .remove([prevPath]);
      if (removeError) {
        // Non-bloquant : on log mais on continue (l'upload est déjà passé).
        console.warn(
          "[updateOwnerProfile] cleanup old avatar failed:",
          removeError,
        );
      }
    }
  }

  if (!ownerRow) {
    // Pas de profil owner existant : on en crée un. La colonne is_owner est
    // protégée par RLS au niveau service-role uniquement.
    const { error: insertError } = await admin.from("profiles").insert({
      full_name: fullName,
      avatar_url: nextAvatarUrl ?? null,
      is_owner: true,
      is_published: false,
    });
    if (insertError) {
      console.error("[updateOwnerProfile] insert error:", insertError);
      return { status: "error", error: insertError.message };
    }
  } else {
    const patch: { full_name: string; avatar_url?: string | null } = {
      full_name: fullName,
    };
    if (nextAvatarUrl !== undefined) {
      patch.avatar_url = nextAvatarUrl;
    }
    const { error: updateError } = await admin
      .from("profiles")
      .update(patch)
      .eq("id", ownerRow.id);
    if (updateError) {
      console.error("[updateOwnerProfile] update error:", updateError);
      return { status: "error", error: updateError.message };
    }
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/profile");
  revalidatePath("/admin", "layout");
  return { status: "success" };
}
