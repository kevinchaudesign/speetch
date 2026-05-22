import Link from "next/link";
import { PROJECT_TYPES } from "@/lib/project-types";
import { Button, Eyebrow, Hairline } from "@/lib/ds";

export function TypePicker({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
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
        <Button href={`/admin/clients/${clientId}`} variant="return">
          Retour {clientName}
        </Button>
        <Eyebrow tracking="sm" className="text-cyan-200/55">
          Nouvelle mission
        </Eyebrow>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-12 pt-20">
        {/* Intro */}
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            Nouvelle mission
            <span className="mx-3 text-cyan-200/20">·</span>
            <Link
              href={`/admin/clients/${clientId}`}
              className="text-cyan-200/85 transition-colors hover:text-cyan-100"
            >
              Holocron : {clientName}
            </Link>
          </p>

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
          >
            Quel{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              type
            </span>{" "}
            de mission ?
          </h1>

          <p className="max-w-xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            Choisis une catégorie pour démarrer. Le formulaire et
            l&apos;affichage public s&apos;adapteront ensuite à ce type.
          </p>
        </div>

        {/* Grille des types */}
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-cyan-200/[0.1] md:grid-cols-2 lg:grid-cols-3">
          {PROJECT_TYPES.map((type, idx) => (
            <li key={type.value}>
              <Link
                href={`/admin/clients/${clientId}/projects/new?type=${type.value}`}
                className="group relative flex h-full flex-col gap-6 bg-black p-7 transition-colors duration-500 ease-out hover:bg-cyan-200/[0.04] md:p-9"
              >
                {/* Numéro */}
                <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/40 transition-colors duration-500 group-hover:text-cyan-200/75">
                  {String(idx + 1).padStart(2, "0")}
                  <span className="mx-2 text-cyan-200/15">/</span>
                  {String(PROJECT_TYPES.length).padStart(2, "0")}
                </span>

                {/* Nom */}
                <h2
                  className="font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-[#F5F5F7] transition-colors duration-500 group-hover:text-cyan-100"
                  style={{ fontSize: "clamp(1.5rem, 2.6vw, 2.25rem)" }}
                >
                  {type.label}
                </h2>

                {/* Tagline */}
                <p className="font-serif text-sm italic text-white/65 transition-colors duration-500 group-hover:text-white/85 md:text-base">
                  {type.tagline}
                </p>

                {/* Indicateur hover */}
                <span className="mt-auto inline-flex items-center gap-3 pt-4 text-[10px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors duration-500 group-hover:text-cyan-100">
                  <Hairline width="sm" hover="md" />
                  <span>Choisir</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Cancel */}
        <div className="flex items-center pt-4">
          <Button href="/admin/clients" variant="ghost">
            ← Annuler
          </Button>
        </div>
      </section>
    </div>
  );
}
