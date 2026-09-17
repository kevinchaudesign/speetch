import Link from "next/link";

/**
 * MarketResearchPicker — écran de choix au moment de créer un parchemin
 * Étude de marché. 5 options présentées sous forme de cards :
 *  1. Structure complète (10 sections pré-remplies)
 *  2. Parchemin vierge
 *  3. Importer un fichier .docx
 *  4. Importer un fichier .md
 *  5. Importer un fichier HTML d'artifact Claude
 *
 * Mirror du BusinessPlanPicker pour le blueprint `market_research`.
 */

type Option = {
  id: string;
  kind: "structure" | "blank" | "import-docx" | "import-md" | "import-html";
  num: string;
  label: string;
  tagline: string;
  description: string;
  status?: "ready" | "phase-2";
};

const OPTIONS: Option[] = [
  {
    id: "structure",
    kind: "structure",
    num: "01",
    label: "Structure complète",
    tagline: "10 sections étude de marché pré-remplies",
    description:
      "Contexte sectoriel, taille du marché, segments cibles, comportements clients, concurrence, tendances, opportunités, recommandations… Une trame éprouvée pour cadrer un sujet de zéro.",
    status: "ready",
  },
  {
    id: "blank",
    kind: "blank",
    num: "02",
    label: "Parchemin vierge",
    tagline: "Sans structure imposée",
    description:
      "Un parchemin nu, à remplir comme tu veux. Tu peux ajouter des sections au fur et à mesure, ou copier-coller depuis un autre outil.",
    status: "ready",
  },
  {
    id: "import-docx",
    kind: "import-docx",
    num: "03",
    label: "Importer un .docx",
    tagline: "Fichier Word converti automatiquement",
    description:
      "Confie une étude existante au format Word. Mammoth convertit en HTML stylé, préservant titres, listes, gras/italiques et tableaux. Images embarquées inlinées.",
    status: "ready",
  },
  {
    id: "import-md",
    kind: "import-md",
    num: "04",
    label: "Importer un .md",
    tagline: "Fichier Markdown converti automatiquement",
    description:
      "Confie une note, un README ou un export Markdown. Titres, listes, tableaux, blocs de code et citations sont convertis en HTML stylé Speetch.",
    status: "ready",
  },
  {
    id: "import-html",
    kind: "import-html",
    num: "05",
    label: "Importer un artifact Claude",
    tagline: "Fichier HTML généré par Claude",
    description:
      "Confie un fichier HTML d'artifact Claude (export depuis une conversation). Le parchemin est créé en mode Réplique fidèle avec le rendu d'origine.",
    status: "ready",
  },
];

function buildHref(
  clientId: string,
  projectId: string,
  option: Option,
): string {
  const base = `/admin/clients/${clientId}/projects/${projectId}/pages/new`;
  if (option.kind === "structure") {
    // Le template `market_research` retourne sur cet écran via la garde
    // côté server. On lève la garde avec un param `?mode=create`.
    return `${base}?template=market_research&mode=create`;
  }
  if (option.kind === "blank") {
    return `${base}?template=blank`;
  }
  if (option.kind === "import-docx") {
    return `${base}?template=market_research&mode=import-docx`;
  }
  if (option.kind === "import-md") {
    return `${base}?template=market_research&mode=import-md`;
  }
  if (option.kind === "import-html") {
    return `${base}?template=market_research&mode=import-html`;
  }
  return "#";
}

export function MarketResearchPicker({
  clientId,
  projectId,
  projectName,
}: {
  clientId: string;
  projectId: string;
  projectName: string;
}) {
  return (
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
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

      {/* Header mobile */}
      <header className="flex items-center justify-between md:hidden">
        <Link
          href={`/admin/clients/${clientId}/projects/${projectId}/pages/new`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors duration-300 hover:text-cyan-100"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-10 group-hover:bg-cyan-200" />
          Changer de blueprint
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Étude de marché
        </span>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-12 pt-20">
        {/* Intro */}
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            Nouveau parchemin
            <span className="mx-3 text-cyan-200/20">·</span>
            <span className="text-cyan-200/85">
              Mission : {projectName}
            </span>
            <span className="mx-3 text-cyan-200/20">·</span>
            <span className="text-cyan-200/85">Étude de marché</span>
          </p>

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
          >
            Comment{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              démarrer
            </span>{" "}
            ?
          </h1>

          <p className="max-w-xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            Cinq voies pour forger une étude de marché : structure
            pré-remplie, parchemin vierge, ou import d&apos;un document
            existant.
          </p>
        </div>

        {/* Grille des options */}
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-cyan-200/[0.1] md:grid-cols-2">
          {OPTIONS.map((opt) => {
            const isDisabled = opt.status === "phase-2";
            const href = buildHref(clientId, projectId, opt);
            return (
              <li key={opt.id}>
                <OptionCard
                  option={opt}
                  href={href}
                  disabled={isDisabled}
                />
              </li>
            );
          })}
        </ul>

        {/* Cancel + retour picker */}
        <div className="flex items-center gap-6 pt-4">
          <Link
            href={`/admin/clients/${clientId}/projects/${projectId}/pages/new`}
            className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors hover:text-cyan-100"
          >
            ← Choisir un autre blueprint
          </Link>
          <Link
            href={`/admin/clients/${clientId}/projects/${projectId}`}
            className="text-[11px] uppercase tracking-[0.32em] text-white/35 transition-colors hover:text-white/70"
          >
            Annuler
          </Link>
        </div>
      </section>
    </div>
  );
}

function OptionCard({
  option,
  href,
  disabled,
}: {
  option: Option;
  href: string;
  disabled: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan-200/45">
          {option.num} / {String(OPTIONS.length).padStart(2, "0")}
        </span>
        {disabled && (
          <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/[0.06] px-2 py-0.5 text-[9px] uppercase tracking-[0.32em] text-amber-200/85">
            À venir
          </span>
        )}
      </div>

      <h2
        className={
          "font-sans font-extralight leading-[0.95] tracking-[-0.03em] " +
          (disabled
            ? "text-[#F5F5F7]/55"
            : "text-[#F5F5F7] transition-colors duration-500 group-hover:text-cyan-100")
        }
        style={{ fontSize: "clamp(1.5rem, 2.6vw, 2.25rem)" }}
      >
        {option.label}
      </h2>

      <p
        className={
          "font-serif text-sm italic md:text-base " +
          (disabled
            ? "text-white/40"
            : "text-white/65 transition-colors duration-500 group-hover:text-white/85")
        }
      >
        {option.tagline}
      </p>

      <p
        className={
          "text-[11px] leading-relaxed " +
          (disabled ? "text-white/30" : "text-white/55")
        }
      >
        {option.description}
      </p>

      <span
        className={
          "mt-auto inline-flex items-center gap-3 pt-4 text-[10px] uppercase tracking-[0.32em] " +
          (disabled
            ? "text-white/25"
            : "text-cyan-200/55 transition-colors duration-500 group-hover:text-cyan-100")
        }
      >
        <span
          className={
            "inline-block h-px " +
            (disabled
              ? "w-4 bg-current"
              : "w-4 bg-current transition-all duration-500 ease-out group-hover:w-12")
          }
        />
        <span>{disabled ? "Phase 2 à venir" : "Choisir"}</span>
      </span>
    </>
  );

  const className =
    "group relative flex h-full flex-col gap-6 bg-black p-7 md:p-9 " +
    (disabled
      ? "cursor-not-allowed opacity-70"
      : "transition-colors duration-500 ease-out hover:bg-cyan-200/[0.04]");

  if (disabled) {
    return (
      <div
        className={className}
        role="button"
        aria-disabled
        tabIndex={-1}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
