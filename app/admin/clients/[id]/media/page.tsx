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
  title: "Médiathèque",
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
  if (!profile || profile.is_owner) notFound();

  const { data: foldersData } = await admin
    .from("client_media_folders" as never)
    .select("id, name, position, created_at")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .returns<
      Array<Pick<MediaFolderRow, "id" | "name" | "position" | "created_at">>
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

  const folders: MediaFolder[] = (foldersData ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    position: f.position,
  }));

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
    <div className="relative min-h-svh w-full px-6 py-10 md:px-16 md:py-14">
      <section className="mx-auto flex max-w-6xl flex-col gap-12 pt-12 md:pt-20">
        <header className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
            <Link
              href="/admin/clients"
              className="transition-colors hover:text-white"
            >
              Espaces clients
            </Link>
            <span className="mx-3 text-white/20">→</span>
            <span className="text-white/55">{clientName}</span>
            <span className="mx-3 text-white/20">·</span>
            <span className="text-white/55">Médiathèque</span>
          </p>
          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            Médiathèque{" "}
            <span className="font-serif italic font-normal text-white/85">
              {clientName}
            </span>
          </h1>
          <p className="max-w-xl font-serif text-base italic text-white/45 md:text-lg">
            {items.length === 0
              ? "Aucun média pour le moment. Glisse des fichiers ou clique pour téléverser."
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

        <div className="flex items-center pt-4">
          <Button href="/admin/clients" variant="ghost">
            ← Retour clients
          </Button>
        </div>
      </section>
    </div>
  );
}
