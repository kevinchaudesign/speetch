import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/owner";
import { isValidSlug } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liste la médiathèque d'un client (dossiers + items avec URL publique).
 * Auth Supabase requise (admin uniquement). Filtré par `slug` du client
 * passé en query string : `?slug=club-abrazo`.
 */

const MEDIA_BUCKET = "page-media";

type ProfileRow = { id: string };
type MediaFolderRow = { id: string; name: string; position: number };
type MediaRow = {
  id: string;
  folder_id: string | null;
  filename: string;
  storage_path: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  position: number;
  created_at: string;
};

export async function GET(req: NextRequest) {
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

  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "slug invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profileRow } = await admin
    .from("profiles")
    .select("id")
    .eq("slug", slug)
    .eq("is_owner", false)
    .maybeSingle<ProfileRow>();
  if (!profileRow) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const [foldersRes, mediaRes] = await Promise.all([
    admin
      .from("client_media_folders" as never)
      .select("id, name, position")
      .eq("profile_id", profileRow.id)
      .order("position", { ascending: true }),
    admin
      .from("client_media" as never)
      .select(
        "id, folder_id, filename, storage_path, mime_type, width, height, size_bytes, position, created_at",
      )
      .eq("profile_id", profileRow.id)
      .order("position", { ascending: true })
      .limit(500),
  ]);

  const folders = ((foldersRes.data ?? []) as unknown as MediaFolderRow[]).map(
    (f) => ({ id: f.id, name: f.name, position: f.position }),
  );
  const items = ((mediaRes.data ?? []) as unknown as MediaRow[]).map((m) => {
    const { data: pub } = admin.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(m.storage_path);
    const kind = m.mime_type.startsWith("image/")
      ? "image"
      : m.mime_type.startsWith("video/")
        ? "video"
        : "other";
    return {
      id: m.id,
      folder_id: m.folder_id,
      filename: m.filename,
      url: pub?.publicUrl ?? "",
      kind: kind as "image" | "video" | "other",
      width: m.width,
      height: m.height,
      size_bytes: m.size_bytes,
      created_at: m.created_at,
    };
  });

  return NextResponse.json({ ok: true, folders, items });
}
