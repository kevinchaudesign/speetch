import { NextResponse, type NextRequest } from "next/server";
import JSZip from "jszip";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Télécharge un ou plusieurs médias d'un client sous forme de ZIP.
 *
 * POST body : { profileId: string, mediaIds: string[] }
 * Auth : owner-only.
 *
 * Sécurité : on filtre côté DB par `profile_id` pour empêcher de zipper des
 * médias appartenant à un autre client, même si le caller bidouille les UUIDs.
 *
 * Limite : 200 médias / 500 MB cumulés pour éviter l'OOM. Au-delà, l'admin
 * doit splitter sa sélection.
 */

const BUCKET = "page-media";
const MAX_MEDIA_COUNT = 200;
const MAX_TOTAL_BYTES = 500 * 1024 * 1024;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DownloadBody = {
  profileId?: unknown;
  mediaIds?: unknown;
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const owner = await requireOwner(supabase);
  if (!owner.ok) {
    return NextResponse.json(
      {
        error:
          owner.reason === "no_session"
            ? "Non authentifié"
            : "Accès réservé au propriétaire",
      },
      { status: owner.reason === "no_session" ? 401 : 403 },
    );
  }

  let body: DownloadBody;
  try {
    body = (await req.json()) as DownloadBody;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const profileId = typeof body.profileId === "string" ? body.profileId : "";
  if (!UUID_REGEX.test(profileId)) {
    return NextResponse.json({ error: "profileId invalide" }, { status: 400 });
  }
  if (!Array.isArray(body.mediaIds) || body.mediaIds.length === 0) {
    return NextResponse.json({ error: "Aucun média" }, { status: 400 });
  }
  if (body.mediaIds.length > MAX_MEDIA_COUNT) {
    return NextResponse.json(
      { error: `Trop de médias (max ${MAX_MEDIA_COUNT})` },
      { status: 400 },
    );
  }
  const mediaIds: string[] = [];
  for (const id of body.mediaIds) {
    if (typeof id !== "string" || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Identifiant invalide" },
        { status: 400 },
      );
    }
    mediaIds.push(id);
  }

  const admin = createAdminClient();

  // Récupère les médias appartenant vraiment au client.
  // `client_media` n'est pas dans les types générés → cast `as never` côté
  // table + typage explicite côté .returns().
  const { data: rows, error: fetchError } = await admin
    .from("client_media" as never)
    .select("id, filename, storage_path, mime_type, size_bytes")
    .in("id", Array.from(new Set(mediaIds)))
    .eq("profile_id", profileId)
    .returns<
      Array<{
        id: string;
        filename: string;
        storage_path: string;
        mime_type: string;
        size_bytes: number;
      }>
    >();

  if (fetchError) {
    console.error("[download zip] fetch error:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: "Aucun média trouvé" }, { status: 404 });
  }

  const totalBytes = rows.reduce((s, r) => s + (r.size_bytes ?? 0), 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    return NextResponse.json(
      {
        error: `Taille cumulée trop élevée (max ${Math.round(MAX_TOTAL_BYTES / 1024 / 1024)} MB).`,
      },
      { status: 400 },
    );
  }

  // Télécharge tous les fichiers en parallèle, agrège dans un zip.
  const zip = new JSZip();
  const usedNames = new Set<string>();

  const downloads = await Promise.all(
    rows.map(async (r) => {
      const { data, error } = await admin.storage
        .from(BUCKET)
        .download(r.storage_path);
      if (error || !data) {
        console.error(
          "[download zip] storage error",
          r.storage_path,
          error,
        );
        return null;
      }
      const buf = Buffer.from(await data.arrayBuffer());
      return { row: r, buf };
    }),
  );

  for (const d of downloads) {
    if (!d) continue;
    const name = uniqueFilename(d.row.filename, usedNames);
    zip.file(name, d.buf);
  }

  if (Object.keys(zip.files).length === 0) {
    return NextResponse.json(
      { error: "Échec du téléchargement des fichiers." },
      { status: 500 },
    );
  }

  const zipBuf = await zip.generateAsync({
    type: "nodebuffer",
    compression: "STORE", // pas de compression : images déjà compressées
  });

  const stamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[-T:]/g, "");
  const downloadName = `mediatheque-${stamp}.zip`;

  return new NextResponse(zipBuf as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Content-Length": String(zipBuf.byteLength),
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Gère les collisions de noms : si "logo.png" existe déjà, renvoie
 * "logo (2).png", "logo (3).png", etc.
 */
function uniqueFilename(filename: string, used: Set<string>): string {
  const safe = filename.replace(/[/\\]/g, "_").slice(0, 200) || "media";
  if (!used.has(safe)) {
    used.add(safe);
    return safe;
  }
  const dot = safe.lastIndexOf(".");
  const base = dot > 0 ? safe.slice(0, dot) : safe;
  const ext = dot > 0 ? safe.slice(dot) : "";
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base} (${i})${ext}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  // Fallback impossible en pratique
  const fallback = `${base}-${Date.now()}${ext}`;
  used.add(fallback);
  return fallback;
}
