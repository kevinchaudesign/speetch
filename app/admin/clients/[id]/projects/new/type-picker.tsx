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
    <div className="relative min-h-svh w-full px-6 py-10 md:px-16 md:py-14">
      {/* Header — mobile only */}
      <header className="flex items-center justify-between md:hidden">
        <Button href={`/admin/clients/${clientId}`} variant="return">
          Retour {clientName}
        </Button>
        <Eyebrow tracking="sm" intensity="muted">
          Nouveau projet
        </Eyebrow>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-12 pt-20">
        {/* Intro */}
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
            Nouveau projet
            <span className="mx-3 text-white/20">·</span>
            <Link
              href={`/admin/clients/${clientId}`}
              className="text-white/55 transition-colors hover:text-white"
            >
              Client : {clientName}
            </Link>
          </p>

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
          >
            Quel{" "}
            <span className="font-serif italic font-normal text-white/85">
              type
            </span>{" "}
            de projet ?
          </h1>

          <p className="max-w-xl text-balance font-serif text-base italic text-white/45 md:text-lg">
            Choisis une catégorie pour démarrer. Le formulaire et l&apos;affichage
            public s&apos;adapteront ensuite à ce type.
          </p>
        </div>

        {/* Grille des types */}
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/[0.08] md:grid-cols-2 lg:grid-cols-3">
          {PROJECT_TYPES.map((type, idx) => (
            <li key={type.value}>
              <Link
                href={`/admin/clients/${clientId}/projects/new?type=${type.value}`}
                className="group relative flex h-full flex-col gap-6 bg-black p-7 transition-colors duration-500 ease-out hover:bg-white/[0.03] md:p-9"
              >
                {/* Numéro */}
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/30 transition-colors duration-500 group-hover:text-white/55">
                  {String(idx + 1).padStart(2, "0")}
                  <span className="mx-2 text-white/10">/</span>
                  {String(PROJECT_TYPES.length).padStart(2, "0")}
                </span>

                {/* Nom */}
                <h2
                  className="font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-[#F5F5F7]"
                  style={{ fontSize: "clamp(1.5rem, 2.6vw, 2.25rem)" }}
                >
                  {type.label}
                </h2>

                {/* Tagline */}
                <p className="font-serif text-sm italic text-white/55 transition-colors duration-500 group-hover:text-white/75 md:text-base">
                  {type.tagline}
                </p>

                {/* Indicateur hover */}
                <span className="mt-auto inline-flex items-center gap-3 pt-4 text-[10px] uppercase tracking-[0.32em] text-white/40 transition-colors duration-500 group-hover:text-white">
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
