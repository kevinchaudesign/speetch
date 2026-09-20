import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { lookupColumn, routeSegment } from "@/lib/admin/resolve-client";
import { deleteDesignFile } from "./actions";
import { UploadZone } from "./upload-zone";

const DESIGN_BUCKET = "client-design-systems";

export const metadata: Metadata = {
  title: "Design · Holocron",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatSize(bytes: number | null | undefined): string {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Retire le préfixe timestamp ajouté à l'upload (xxxxxxxxxxxxx-)
function displayName(name: string): string {
  return name.replace(/^\d{10,14}-/, "");
}

export default async function DesignPage({
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
    redirect(`/login?redirect=/admin/clients/${id}/design`);
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("profiles")
    .select("id, full_name, slug")
    .eq(lookupColumn(id), id)
    .eq("is_owner", false)
    .maybeSingle();

  if (!client) notFound();
  const clientSlug = routeSegment(client);
  // URL canonique : le segment porte le nom du client, jamais son UUID.
  if (clientSlug !== id) redirect(`/admin/clients/${clientSlug}/design`);

  // Liste les fichiers du bucket dans le dossier <client-id>/
  const { data: storageFiles, error: storageError } = await admin.storage
    .from(DESIGN_BUCKET)
    .list(client.id, {
      sortBy: { column: "created_at", order: "desc" },
    });

  // Génère des signed URLs (1h) pour chaque fichier
  const files = await Promise.all(
    (storageFiles ?? [])
      .filter((f) => f.name && !f.name.startsWith(".")) // ignore placeholders
      .map(async (f) => {
        const path = `${client.id}/${f.name}`;
        const { data: signed } = await admin.storage
          .from(DESIGN_BUCKET)
          .createSignedUrl(path, 60 * 60);
        return {
          name: f.name,
          path,
          size: f.metadata?.size as number | undefined,
          mimetype: (f.metadata?.mimetype as string | undefined) ?? null,
          created_at: f.created_at,
          url: signed?.signedUrl ?? null,
        };
      }),
  );

  const clientName = client.full_name ?? "Sans nom";

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

      {/* Header — mobile only */}
      <header className="flex items-center justify-between md:hidden">
        <Link
          href={`/admin/clients/${clientSlug}`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors duration-300 hover:text-cyan-100"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-10 group-hover:bg-cyan-200" />
          {clientName}
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Design
        </span>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col gap-12 pt-20">
        {/* Intro */}
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            <Link
              href={`/admin/clients/${clientSlug}`}
              className="text-cyan-200/85 transition-colors hover:text-cyan-100"
            >
              Holocron : {clientName}
            </Link>
            <span className="mx-3 text-cyan-200/20">·</span>
            <span className="text-cyan-200/55">Design</span>
          </p>

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
          >
            Charte{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif font-normal italic">
              visuelle
            </span>
          </h1>

          <p className="max-w-xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            Téléverse les parchemins qui définissent le design de cet holocron :
            charte graphique, logos, palette, typographie, références. Tu
            pourras ensuite me les partager dans la conversation pour qu&apos;on
            adapte l&apos;espace public.
          </p>
        </div>

        {/* Upload zone */}
        <UploadZone clientId={client.id} />

        {/* Parchemins existants */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
              Parchemins téléversés
            </h2>
            <span className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55">
              {files.length} parchemin{files.length > 1 ? "s" : ""}
            </span>
          </div>

          {storageError && (
            <p
              className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85"
              style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
            >
              Erreur Storage · {storageError.message}
            </p>
          )}

          {files.length === 0 && !storageError ? (
            <div className="relative pt-8">
              <div
                aria-hidden
                className="sw-hologram-line absolute inset-x-0 top-0"
              />
              <p className="font-serif text-base italic text-white/55">
                Aucun parchemin pour cet holocron. Téléverse-en via la zone
                ci-dessus.
              </p>
            </div>
          ) : (
            <ul className="relative flex flex-col">
              <div
                aria-hidden
                className="sw-hologram-line absolute inset-x-0 top-0"
              />
              {files.map((file, i) => (
                <li
                  key={file.path}
                  className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4"
                >
                  {i < files.length - 1 && (
                    <div
                      aria-hidden
                      className="sw-hologram-line absolute inset-x-0 bottom-0"
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-mono text-sm text-[#F5F5F7]">
                      {displayName(file.name)}
                    </span>
                    <span className="font-mono text-[11px] text-white/40">
                      {formatSize(file.size)}
                      <span className="mx-2 text-cyan-200/25">·</span>
                      {formatDate(file.created_at)}
                      {file.mimetype && (
                        <>
                          <span className="mx-2 text-cyan-200/25">·</span>
                          {file.mimetype}
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-6">
                    {file.url && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener"
                        download={displayName(file.name)}
                        className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-200/65 transition-colors hover:text-cyan-100"
                      >
                        <span>Télécharger</span>
                        <span className="inline-block h-px w-4 bg-current transition-all duration-500 ease-out group-hover:w-10 group-hover:bg-cyan-200" />
                      </a>
                    )}
                    <form action={deleteDesignFile}>
                      <input type="hidden" name="client_id" value={client.id} />
                      <input type="hidden" name="path" value={file.path} />
                      <button
                        type="submit"
                        className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-red-300/85"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
