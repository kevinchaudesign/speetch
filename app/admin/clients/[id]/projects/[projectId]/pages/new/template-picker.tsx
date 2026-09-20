import Link from "next/link";
import type { PageTemplate } from "@/lib/page-templates";
import { useClientSegment } from "@/lib/admin/use-client-segment";

export function TemplatePicker({
  projectId,
  projectName,
  templates,
}: {
  projectId: string;
  projectName: string;
  templates: PageTemplate[];
}) {
  const clientSlug = useClientSegment();
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
          href={`/admin/clients/${clientSlug}/projects/${projectId}`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors duration-300 hover:text-cyan-100"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-10 group-hover:bg-cyan-200" />
          Retour mission
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Nouveau parchemin
        </span>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-12 pt-20">
        {/* Intro */}
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            Nouveau parchemin
            <span className="mx-3 text-cyan-200/20">·</span>
            <span className="text-cyan-200/85">Mission : {projectName}</span>
          </p>

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
          >
            Quel{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif font-normal italic">
              blueprint
            </span>{" "}
            ?
          </h1>

          <p className="max-w-xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            Choisis une mise en forme pour démarrer. Le parchemin sera forgé
            avec un contenu pré-rempli que tu pourras ajuster ensuite.
          </p>
        </div>

        {/* Grille des blueprints */}
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-cyan-200/[0.1] md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, idx) => (
            <li key={template.id}>
              <Link
                href={`/admin/clients/${clientSlug}/projects/${projectId}/pages/new?template=${template.id}`}
                className="group relative flex h-full flex-col gap-6 bg-black p-7 transition-colors duration-500 ease-out hover:bg-cyan-200/[0.04] md:p-9"
              >
                {/* Numéro + source */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/40 transition-colors duration-500 group-hover:text-cyan-200/75">
                    {String(idx + 1).padStart(2, "0")}
                    <span className="mx-2 text-cyan-200/15">/</span>
                    {String(templates.length).padStart(2, "0")}
                  </span>
                  {template.source === "db" && (
                    <span className="inline-flex items-center rounded-full border border-cyan-200/25 bg-cyan-200/[0.05] px-2 py-0.5 text-[9px] uppercase tracking-[0.32em] text-cyan-200/70">
                      HTML
                    </span>
                  )}
                  {template.source === "raw_html_virtual" && (
                    <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/[0.06] px-2 py-0.5 text-[9px] uppercase tracking-[0.32em] text-amber-200/85">
                      Upload direct
                    </span>
                  )}
                  {template.source === "markdown_virtual" && (
                    <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/[0.06] px-2 py-0.5 text-[9px] uppercase tracking-[0.32em] text-amber-200/85">
                      Upload .md
                    </span>
                  )}
                </div>

                {/* Nom */}
                <h2
                  className="font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-[#F5F5F7] transition-colors duration-500 group-hover:text-cyan-100"
                  style={{ fontSize: "clamp(1.5rem, 2.6vw, 2.25rem)" }}
                >
                  {template.label}
                </h2>

                {/* Tagline */}
                <p className="font-serif text-sm italic text-white/65 transition-colors duration-500 group-hover:text-white/85 md:text-base">
                  {template.tagline}
                </p>

                {template.description && (
                  <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/45">
                    {template.description}
                  </p>
                )}

                {/* Indicateur hover */}
                <span className="mt-auto inline-flex items-center gap-3 pt-4 text-[10px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors duration-500 group-hover:text-cyan-100">
                  <span className="inline-block h-px w-4 bg-current transition-all duration-500 ease-out group-hover:w-12" />
                  <span>Choisir</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Cancel */}
        <div className="flex items-center pt-4">
          <Link
            href={`/admin/clients/${clientSlug}/projects/${projectId}`}
            className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors hover:text-cyan-100"
          >
            ← Annuler
          </Link>
        </div>
      </section>
    </div>
  );
}
