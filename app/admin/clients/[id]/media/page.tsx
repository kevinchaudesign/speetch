import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { clientLookupColumn } from "@/lib/admin/resolve-client";
import { Button } from "@/lib/ds";
import {
  MediaLibraryView,
  type MediaItem,
  type MediaFolder,
  type PersonaOption,
} from "./_components/media-library-view";
import type { MediaFolderRow, MediaRow } from "./_lib/types";
import type { ClientPersonaRow } from "../personas/_lib/persona-types";

export const metadata: Metadata = {
  title: "Médiathèque · Holocron",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const BUCKET = "page-media";

export default async function ClientMediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/admin/clients/${id}/media`);
  }
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, is_owner")
    .eq(clientLookupColumn(id), id)
    .maybeSingle();
  // L'owner Speetch accède à sa propre médiathèque (Galerie studio) via
  // la même route que les Holocrons clients — pas de notFound sur owner.
  if (!profile) notFound();

  const { data: foldersData } = await admin
    .from("client_media_folders" as never)
    .select("id, name, position, parent_id, cover_media_id, created_at")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .returns<
      Array<
        Pick<
          MediaFolderRow,
          | "id"
          | "name"
          | "position"
          | "parent_id"
          | "cover_media_id"
          | "created_at"
        >
      >
    >();

  const { data: mediaData } = await admin
    .from("client_media" as never)
    .select(
      "id, folder_id, persona_id, filename, storage_path, mime_type, size_bytes, width, height, duration_seconds, position, created_at",
    )
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<
      Array<
        Pick<
          MediaRow,
          | "id"
          | "folder_id"
          | "persona_id"
          | "filename"
          | "storage_path"
          | "mime_type"
          | "size_bytes"
          | "width"
          | "height"
          | "duration_seconds"
          | "position"
          | "created_at"
        >
      >
    >();

  const { data: personasData } = await admin
    .from("client_personas" as never)
    .select("id, name, position")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .returns<Array<Pick<ClientPersonaRow, "id" | "name" | "position">>>();

  // Résout l'URL publique des images d'aperçu : pour chaque cover_media_id,
  // on remonte le storage_path du média correspondant via une seule requête.
  const coverMediaIds = Array.from(
    new Set(
      (foldersData ?? [])
        .map((f) => f.cover_media_id)
        .filter((v): v is string => !!v),
    ),
  );
  const coverPathById = new Map<string, string>();
  if (coverMediaIds.length > 0) {
    const { data: coversData } = await admin
      .from("client_media" as never)
      .select("id, storage_path")
      .in("id", coverMediaIds)
      .returns<Array<Pick<MediaRow, "id" | "storage_path">>>();
    for (const c of coversData ?? []) {
      coverPathById.set(c.id, c.storage_path);
    }
  }

  const folders: MediaFolder[] = (foldersData ?? []).map((f) => {
    const coverPath = f.cover_media_id
      ? (coverPathById.get(f.cover_media_id) ?? null)
      : null;
    const coverUrl = coverPath
      ? admin.storage.from(BUCKET).getPublicUrl(coverPath).data.publicUrl
      : null;
    return {
      id: f.id,
      name: f.name,
      position: f.position,
      parent_id: f.parent_id,
      cover_media_id: f.cover_media_id,
      cover_url: coverUrl,
    };
  });

  const items: MediaItem[] = (mediaData ?? []).map((m) => {
    const { data: pub } = admin.storage
      .from(BUCKET)
      .getPublicUrl(m.storage_path);
    return {
      id: m.id,
      folder_id: m.folder_id,
      persona_id: m.persona_id,
      filename: m.filename,
      mime_type: m.mime_type,
      size_bytes: m.size_bytes,
      width: m.width,
      height: m.height,
      duration_seconds: m.duration_seconds,
      created_at: m.created_at,
      public_url: pub.publicUrl,
    };
  });

  const personas: PersonaOption[] = (personasData ?? []).map((p) => ({
    id: p.id,
    name: p.name,
  }));

  const clientName = profile.full_name ?? "Client";

  return (
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
      {/* Star field + scanlines + sabre — thème Conseil Jedi */}
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden
        className="sw-scanlines pointer-events-none absolute inset-0 -z-10 opacity-50"
      />
      <div
        aria-hidden
        className="sw-lightsaber-bar pointer-events-none absolute bottom-16 left-2 top-24 hidden w-[2px] rounded-full md:block"
      />

      <section className="mx-auto flex max-w-6xl flex-col gap-12 pt-12 md:pt-20">
        <header className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            <Link
              href="/admin/clients"
              className="transition-colors hover:text-cyan-100"
            >
              Holocrons
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <Link
              href={`/admin/clients/${id}`}
              className="text-cyan-200/85 transition-colors hover:text-cyan-100"
            >
              {clientName}
            </Link>
            <span className="mx-3 text-cyan-200/20">·</span>
            <span className="text-cyan-200/55">Médiathèque</span>
          </p>
          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            Médiathèque{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              {clientName}
            </span>
          </h1>
          <p className="max-w-xl font-serif text-base italic text-white/55 md:text-lg">
            {items.length === 0
              ? "Aucun média pour cet holocron. Glisse des parchemins ou clique pour téléverser."
              : `${items.length} média${items.length > 1 ? "s" : ""}${
                  folders.length > 0
                    ? ` · ${folders.length} dossier${folders.length > 1 ? "s" : ""}`
                    : ""
                }`}
          </p>
        </header>

        <MediaLibraryView
          profileId={profile.id}
          initialFolders={folders}
          initialItems={items}
          personas={personas}
        />

        <div className="flex items-center gap-6 pt-4">
          <Button href={`/admin/clients/${id}`} variant="ghost">
            ← Retour {clientName}
          </Button>
          <Button href="/admin/clients" variant="ghost">
            Tous les Holocrons
          </Button>
        </div>
      </section>
    </div>
  );
}
