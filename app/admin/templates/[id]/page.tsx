import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { PageContent } from "@/types/database";
import { EditTemplateForm } from "./edit-form";

export const metadata: Metadata = {
  title: "Affûter un blueprint",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/admin/templates/${id}`);
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin/settings");
  }

  const admin = createAdminClient();
  const { data: tpl } = await admin
    .from("page_templates")
    .select(
      "id, label, tagline, description, project_type, default_content, source_html, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!tpl) notFound();

  const content = (tpl.default_content as PageContent) ?? {};
  const style = content.meta?.style ?? "document";
  const fidelity: "edit" | "raw" = style === "raw_html" ? "raw" : "edit";
  const sectionsCount = (content.sections ?? []).length;
  const sourceHtmlBytes = typeof tpl.source_html === "string"
    ? new Blob([tpl.source_html]).size
    : 0;

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

      <header className="flex items-center justify-between md:hidden">
        <Link
          href="/admin/templates"
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors duration-300 hover:text-cyan-100"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-10 group-hover:bg-cyan-200" />
          Blueprints
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Affûtage
        </span>
      </header>

      <section className="mx-auto flex max-w-2xl flex-col items-start gap-12 pt-20">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/55">
            <Link
              href="/admin"
              className="transition-colors hover:text-cyan-100"
            >
              Conseil Jedi
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <Link
              href="/admin/settings"
              className="transition-colors hover:text-cyan-100"
            >
              Forge
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <Link
              href="/admin/templates"
              className="transition-colors hover:text-cyan-100"
            >
              Blueprints
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/85">Affûtage</span>
          </p>

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            Affûter{" "}
            <span className="sw-hologram-text font-serif italic font-normal">
              {tpl.label}
            </span>
          </h1>

          <p className="max-w-lg font-serif text-base italic text-white/55 md:text-lg">
            Modifie les métadonnées ou confie un nouveau parchemin HTML pour
            remplacer le contenu. Les parchemins déjà forgés depuis ce
            blueprint gardent leur contenu courant.
          </p>
        </div>

        <EditTemplateForm
          templateId={tpl.id}
          initial={{
            label: tpl.label ?? "",
            tagline: tpl.tagline ?? "",
            description: tpl.description ?? "",
            projectType: tpl.project_type ?? "",
            fidelity,
            sectionsCount,
            sourceHtmlBytes,
          }}
        />

        <Link
          href="/admin/templates"
          className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors hover:text-cyan-100"
        >
          ← Retour aux Blueprints
        </Link>
      </section>
    </div>
  );
}
