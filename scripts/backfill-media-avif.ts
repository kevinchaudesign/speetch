/**
 * scripts/backfill-media-avif.ts
 *
 * Ré-encode en AVIF les images de la **médiathèque studio** (profil owner)
 * uniquement. Les Holocrons clients gardent leurs originaux — c'est de la
 * livraison fidèle, pas une vitrine optimisée.
 *
 * Pour chaque image qualifiée : download → AVIF (qualité 55 / effort 4) →
 * upload → update DB (storage_path, filename, mime_type, size_bytes,
 * width, height) → suppression de l'original.
 *
 * Ce que le script ne touche pas :
 *   - Médias appartenant à un profile non-owner (Holocrons clients)
 *   - SVG (vecteur)
 *   - GIF (animation)
 *   - AVIF déjà
 *   - Fichiers nommés comme assets navigateur : favicon*, apple-touch-icon*,
 *     og-image*, icon-NNN*, manifest*, browserconfig*, mstile*
 *
 * Usage :
 *   npx tsx scripts/backfill-media-avif.ts            # dry-run (par défaut)
 *   npx tsx scripts/backfill-media-avif.ts --apply    # exécute pour de vrai
 *
 * Requiert NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans
 * .env.local. Bypass RLS via service-role — à lancer en local, en confiance.
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { readFile } from "node:fs/promises";

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

const BUCKET = "page-media";
const AVIF_QUALITY = 55;
const AVIF_EFFORT = 4;

// Mimes à ne pas re-convertir.
const SKIP_MIMES = new Set<string>([
  "image/svg+xml",
  "image/gif",
  "image/avif",
]);

// Noms (regex) qui suggèrent un asset attendu par le navigateur dans un
// format précis (favicon, og:image, manifest icons…). On ne touche pas.
const BROWSER_ASSET_PATTERNS: RegExp[] = [
  /favicon/i,
  /apple-touch-icon/i,
  /og[-_]?image/i,
  /opengraph/i,
  /twitter[-_]?card/i,
  /icon-?(?:16|32|48|64|96|128|144|152|180|192|256|384|512)/i,
  /manifest-?icon/i,
  /browserconfig/i,
  /mstile/i,
];

function isBrowserAsset(filename: string, storagePath: string): boolean {
  return BROWSER_ASSET_PATTERNS.some(
    (re) => re.test(filename) || re.test(storagePath),
  );
}

function formatSize(b: number): string {
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} ko`;
  return `${(b / 1024 / 1024).toFixed(1)} Mo`;
}

type MediaRow = {
  id: string;
  profile_id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
};

async function main() {
  await loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "✘ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local",
    );
    process.exit(1);
  }

  const apply = process.argv.includes("--apply");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(
    apply
      ? "✦ MODE APPLY — modifications réelles sur Storage + DB"
      : "◌ MODE DRY-RUN — aucune écriture (passe --apply pour exécuter)",
  );
  console.log();

  // Résout les profils owner — seuls leurs médias sont concernés.
  const { data: owners, error: ownerErr } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_owner", true);
  if (ownerErr) {
    console.error("✘ Lecture profils owner :", ownerErr.message);
    process.exit(1);
  }
  const ownerIds = (owners ?? []).map((o) => o.id as string);
  if (ownerIds.length === 0) {
    console.log("Aucun profil marqué is_owner=true — rien à faire.");
    return;
  }
  console.log(
    `Profil(s) owner : ${(owners ?? [])
      .map((o) => `${o.full_name ?? "(sans nom)"} [${(o.id as string).slice(0, 8)}]`)
      .join(", ")}`,
  );
  console.log();

  const { data: rows, error } = await supabase
    .from("client_media")
    .select(
      "id, profile_id, filename, storage_path, mime_type, size_bytes, width, height",
    )
    .in("profile_id", ownerIds)
    .like("mime_type", "image/%")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("✘ Lecture client_media :", error.message);
    process.exit(1);
  }
  const all = (rows ?? []) as MediaRow[];

  const skipped: Array<{ row: MediaRow; reason: string }> = [];
  const candidates: MediaRow[] = [];
  for (const r of all) {
    if (SKIP_MIMES.has(r.mime_type)) {
      skipped.push({ row: r, reason: `mime ${r.mime_type}` });
      continue;
    }
    if (isBrowserAsset(r.filename, r.storage_path)) {
      skipped.push({ row: r, reason: "browser-asset" });
      continue;
    }
    candidates.push(r);
  }

  console.log(`Total images en base    : ${all.length}`);
  console.log(`Skip (SVG / GIF / AVIF) : ${skipped.filter((s) => s.reason.startsWith("mime")).length}`);
  console.log(`Skip (browser assets)   : ${skipped.filter((s) => s.reason === "browser-asset").length}`);
  console.log(`À convertir             : ${candidates.length}`);
  console.log();

  if (skipped.some((s) => s.reason === "browser-asset")) {
    console.log("Browser assets préservés :");
    for (const s of skipped.filter((x) => x.reason === "browser-asset")) {
      console.log(`  · ${s.row.filename}  (${s.row.storage_path})`);
    }
    console.log();
  }

  if (candidates.length === 0) {
    console.log("Rien à faire.");
    return;
  }

  let totalOld = 0;
  let totalNew = 0;
  let okCount = 0;
  let errCount = 0;

  for (const r of candidates) {
    const label = `[${r.id.slice(0, 8)}] ${r.filename}`.padEnd(60).slice(0, 60);
    process.stdout.write(label + " ");
    try {
      const { data: blob, error: dlErr } = await supabase.storage
        .from(BUCKET)
        .download(r.storage_path);
      if (dlErr || !blob) {
        throw new Error(`download: ${dlErr?.message ?? "no blob"}`);
      }
      const inputBuffer = Buffer.from(await blob.arrayBuffer());

      const avifBuffer = await sharp(inputBuffer)
        .rotate()
        .avif({ quality: AVIF_QUALITY, effort: AVIF_EFFORT })
        .toBuffer();
      const meta = await sharp(avifBuffer).metadata();

      const oldSize = r.size_bytes || inputBuffer.byteLength;
      const newSize = avifBuffer.byteLength;
      totalOld += oldSize;
      totalNew += newSize;
      const ratio = ((1 - newSize / oldSize) * 100).toFixed(1);

      const newStoragePath = r.storage_path.replace(/\.[a-z0-9]+$/i, ".avif");
      const newFilename = /\.[a-z0-9]+$/i.test(r.filename)
        ? r.filename.replace(/\.[a-z0-9]+$/i, ".avif")
        : `${r.filename}.avif`;

      process.stdout.write(
        `${formatSize(oldSize).padStart(8)} → ${formatSize(newSize).padStart(8)} (-${ratio}%) `,
      );

      if (apply) {
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(newStoragePath, avifBuffer, {
            contentType: "image/avif",
            upsert: true,
          });
        if (upErr) throw new Error(`upload: ${upErr.message}`);

        const { error: dbErr } = await supabase
          .from("client_media")
          .update({
            storage_path: newStoragePath,
            filename: newFilename,
            mime_type: "image/avif",
            size_bytes: newSize,
            width: meta.width ?? r.width,
            height: meta.height ?? r.height,
          })
          .eq("id", r.id);
        if (dbErr) throw new Error(`db: ${dbErr.message}`);

        // Supprime l'ancien fichier si on a vraiment changé le chemin.
        if (newStoragePath !== r.storage_path) {
          const { error: rmErr } = await supabase.storage
            .from(BUCKET)
            .remove([r.storage_path]);
          if (rmErr) {
            // Non bloquant — on préfère un orphelin Storage qu'une ligne DB
            // pointant vers du vide.
            console.log(`OK (orphan: ${rmErr.message})`);
            okCount++;
            continue;
          }
        }
      }

      console.log("OK");
      okCount++;
    } catch (err) {
      console.log(`FAIL — ${(err as Error).message}`);
      errCount++;
    }
  }

  console.log();
  console.log("─".repeat(70));
  console.log(`OK    : ${okCount}`);
  console.log(`FAIL  : ${errCount}`);
  console.log(`Avant : ${formatSize(totalOld)}`);
  console.log(`Après : ${formatSize(totalNew)}`);
  if (totalOld > 0) {
    const gain = totalOld - totalNew;
    const pct = ((1 - totalNew / totalOld) * 100).toFixed(1);
    console.log(`Gain  : ${formatSize(gain)} (-${pct}%)`);
  }
  if (!apply) {
    console.log();
    console.log("Dry-run terminé. Relance avec --apply pour exécuter.");
  }
}

main().catch((err) => {
  console.error("✘ Crash :", err);
  process.exit(1);
});
