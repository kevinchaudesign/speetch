/**
 * scripts/seed-brand-assets.ts
 *
 * Upload tous les assets de l'identité visuelle Speetch dans la médiathèque
 * d'un Holocron, dans un dossier dédié "Identité visuelle".
 *
 * Usage :
 *   npx tsx scripts/seed-brand-assets.ts <profileId>
 *   npx tsx scripts/seed-brand-assets.ts                # liste les profils
 *
 * Requiert NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans
 * .env.local (lus automatiquement).
 *
 * Sécurité : utilise la clé service-role, donc bypass RLS. À ne lancer
 * qu'en local, en confiance.
 */

import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { config as loadDotenv } from "node:process";

// Charge .env.local sans dépendance externe
async function loadEnv() {
  try {
    const raw = await readFile(
      new URL("../.env.local", import.meta.url),
      "utf8",
    );
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (err) {
    console.error("⚠️  Impossible de lire .env.local :", err);
  }
}

const FOLDER_NAME = "Identité visuelle";
const BUCKET = "page-media";
const STORAGE_PREFIX = "clients";
const LOGO_DIR = new URL("../public/logo/", import.meta.url);

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
};

type Profile = {
  id: string;
  full_name: string | null;
  slug: string | null;
  is_owner: boolean;
};

async function main() {
  await loadEnv();
  void loadDotenv; // satisfies tsc unused-import in noEmit; safe to remove

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "✘ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local",
    );
    process.exit(1);
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Argument : profileId
  const arg = process.argv[2]?.trim();

  if (!arg) {
    console.log("Aucun profileId fourni. Profils disponibles :\n");
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, slug, is_owner")
      .order("is_owner", { ascending: false })
      .order("full_name", { ascending: true });
    if (error) {
      console.error("✘ Lecture profils :", error.message);
      process.exit(1);
    }
    for (const p of (profiles ?? []) as Profile[]) {
      const tag = p.is_owner ? "[owner]" : "       ";
      console.log(
        `  ${tag}  ${p.id}  —  ${p.full_name ?? "(sans nom)"}  /  ${p.slug ?? "—"}`,
      );
    }
    console.log("\nUsage : npx tsx scripts/seed-brand-assets.ts <profileId>");
    process.exit(0);
  }

  // Vérification du profil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, slug")
    .eq("id", arg)
    .maybeSingle();
  if (profileError || !profile) {
    console.error("✘ Profil introuvable :", arg);
    process.exit(1);
  }
  console.log(
    `✓ Holocron cible : ${profile.full_name ?? "(sans nom)"} (${profile.id})`,
  );

  // Étape 1 : trouver ou créer le dossier "Identité visuelle"
  const { data: existingFolder } = await supabase
    .from("client_media_folders" as never)
    .select("id, name")
    .eq("profile_id", profile.id)
    .eq("name", FOLDER_NAME)
    .maybeSingle<{ id: string; name: string }>();

  let folderId: string;
  if (existingFolder) {
    folderId = existingFolder.id;
    console.log(`✓ Dossier "${FOLDER_NAME}" déjà existant (${folderId})`);
  } else {
    // Position = max+1
    const { data: maxRow } = await supabase
      .from("client_media_folders" as never)
      .select("position")
      .eq("profile_id", profile.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle<{ position: number }>();
    const nextPosition = (maxRow?.position ?? -1) + 1;

    const { data: created, error: createErr } = await supabase
      .from("client_media_folders" as never)
      .insert({
        profile_id: profile.id,
        name: FOLDER_NAME,
        position: nextPosition,
      } as never)
      .select("id")
      .single<{ id: string }>();
    if (createErr || !created) {
      console.error("✘ Création dossier :", createErr?.message);
      process.exit(1);
    }
    folderId = created.id;
    console.log(`✓ Dossier "${FOLDER_NAME}" créé (${folderId})`);
  }

  // Étape 2 : récupérer les médias existants pour éviter les doublons
  // (clé naturelle = filename, on remplace si déjà présent)
  const { data: existingMedia } = await supabase
    .from("client_media" as never)
    .select("id, filename, storage_path")
    .eq("profile_id", profile.id)
    .eq("folder_id", folderId)
    .returns<{ id: string; filename: string; storage_path: string }[]>();
  const existingByFilename = new Map(
    (existingMedia ?? []).map((m) => [m.filename, m]),
  );

  // Étape 3 : itérer sur public/logo/*
  const files = await readdir(LOGO_DIR);
  const targets = files
    .filter((f) => !f.startsWith("."))
    .filter((f) => {
      const ext = extname(f).slice(1).toLowerCase();
      return ext in MIME_BY_EXT;
    })
    .sort();

  console.log(`\n→ ${targets.length} fichiers à uploader :\n`);

  let nextPosition = 0;
  const { data: maxMediaRow } = await supabase
    .from("client_media" as never)
    .select("position")
    .eq("profile_id", profile.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();
  nextPosition = (maxMediaRow?.position ?? -1) + 1;

  for (const filename of targets) {
    const ext = extname(filename).slice(1).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    const filePath = join(LOGO_DIR.pathname, filename);
    const buffer = await readFile(filePath);

    // Storage path
    const storagePath = `${STORAGE_PREFIX}/${profile.id}/${Date.now()}-${filename}`;

    // Upload sur Storage
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: mime,
        upsert: false,
      });
    if (uploadErr) {
      console.error(`  ✘ ${filename} — upload : ${uploadErr.message}`);
      continue;
    }

    // Si un média avec ce filename existait, supprimer l'ancien
    const existing = existingByFilename.get(filename);
    if (existing) {
      await supabase.storage.from(BUCKET).remove([existing.storage_path]);
      await supabase
        .from("client_media" as never)
        .delete()
        .eq("id", existing.id);
    }

    // Insert dans client_media
    const { error: insertErr } = await supabase
      .from("client_media" as never)
      .insert({
        profile_id: profile.id,
        folder_id: folderId,
        filename,
        storage_path: storagePath,
        mime_type: mime,
        size_bytes: buffer.byteLength,
        position: nextPosition++,
      } as never);
    if (insertErr) {
      console.error(`  ✘ ${filename} — DB insert : ${insertErr.message}`);
      // Cleanup le storage si l'insert échoue
      await supabase.storage.from(BUCKET).remove([storagePath]);
      continue;
    }
    const sizeLabel =
      buffer.byteLength > 1024 * 1024
        ? `${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`
        : `${(buffer.byteLength / 1024).toFixed(1)} KB`;
    console.log(`  ✓ ${filename}  ·  ${mime}  ·  ${sizeLabel}`);
  }

  console.log(
    `\n✓ Identité visuelle uploadée dans la médiathèque de ${profile.full_name ?? profile.id}`,
  );
  console.log(
    `  Voir : /admin/clients/${profile.slug ?? profile.id}/media (filtrer dossier "${FOLDER_NAME}")`,
  );
}

main().catch((err) => {
  console.error("✘ Erreur non gérée :", err);
  process.exit(1);
});
