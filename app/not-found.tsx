import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden">
      {/* Star field + scanlines — l'hyperespace est immense, on s'y perd */}
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="sw-scanlines pointer-events-none absolute inset-0 opacity-55"
      />
      {/* Deux sabres verticaux qui encadrent — comme un portail mais incomplet */}
      <div
        aria-hidden
        className="sw-lightsaber-bar pointer-events-none absolute bottom-28 left-6 top-28 hidden w-[2px] rounded-full opacity-40 md:block"
      />
      <div
        aria-hidden
        className="sw-lightsaber-bar pointer-events-none absolute bottom-28 right-6 top-28 hidden w-[2px] rounded-full opacity-40 md:block"
      />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-6 md:px-12">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors duration-300 hover:text-cyan-100"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-10 group-hover:bg-cyan-200" />
          Retour Speetch
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          404
        </span>
      </header>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <p className="mb-6 text-[11px] uppercase tracking-[0.4em] text-cyan-200/55">
          Hyperespace
        </p>
        <h1
          className="select-none font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(3rem, 12vw, 9rem)" }}
        >
          Route{" "}
          <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
            perdue
          </span>
        </h1>
        <p className="mt-10 max-w-md text-balance font-serif text-base italic text-white/55 md:text-lg">
          Cette destination, la Force ne la connaît pas. Dans
          l&apos;hyperespace, ton parchemin t&apos;a égaré. Reviens au temple,
          jeune Padawan.
        </p>
      </div>

      <footer className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-6 py-6 text-[11px] uppercase tracking-[0.28em] text-white/40 md:px-12">
        <span>Temple Jedi · An 2026</span>
        <span className="text-cyan-200/55">Speetch — Conseil Jedi</span>
      </footer>
    </div>
  );
}
