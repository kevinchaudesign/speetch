"use server";
import { revalidateClientPath } from "@/lib/admin/routes";

import { createAdminClient, createClient } from "@/lib/supabase/server";

export type UploadState = {
  status: "idle" | "success" | "error";
  error?: string;
  uploaded?: number;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const DESIGN_BUCKET = "client-design-systems";

/**
 * Sanitize un nom de fichier pour éviter les caractères dangereux dans
 * le path de Supabase Storage. Garde le nom lisible (pas d'UUID complet).
 */
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

async function requireOwnerAndAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée. Reconnecte-toi." as const };
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { error: "Accès réservé au propriétaire." as const };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local — impossible d'accéder au Storage." as const,
    };
  }

  return { admin: createAdminClient() };
}

export async function uploadDesignFiles(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return { status: "error", error: auth.error };

  const clientId = String(formData.get("client_id") ?? "").trim();
  if (!UUID_REGEX.test(clientId)) {
    return { status: "error", error: "Client invalide." };
  }

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { status: "error", error: "Aucun fichier sélectionné." };
  }

  let uploaded = 0;

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return {
        status: "error",
        error: `Le fichier "${file.name}" dépasse 10 MB.`,
      };
    }

    const filename = sanitizeFilename(file.name);
    // Préfixe timestamp pour éviter collisions sur doublons de noms.
    const path = `${clientId}/${Date.now()}-${filename}`;

    const { error } = await auth.admin.storage
      .from(DESIGN_BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (error) {
      console.error("[uploadDesignFiles] upload error:", error);
      return {
        status: "error",
        error: error.message || "Erreur Storage Supabase.",
      };
    }
    uploaded++;
  }

  await revalidateClientPath(clientId, `/design`);
  return { status: "success", uploaded };
}

export async function deleteDesignFile(formData: FormData): Promise<void> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return;

  const clientId = String(formData.get("client_id") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();

  // Garde-fou : le path doit appartenir au client (préfixe).
  if (!UUID_REGEX.test(clientId) || !path.startsWith(`${clientId}/`)) {
    return;
  }

  await auth.admin.storage.from(DESIGN_BUCKET).remove([path]);
  await revalidateClientPath(clientId, `/design`);
}
