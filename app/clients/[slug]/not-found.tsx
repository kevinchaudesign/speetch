import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden">
      {/* Star field + scanlines + sabre — l'hyperespace est perdu */}
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="sw-scanlines pointer-events-none absolute inset-0 opacity-55"
      />
      {/* Sabre central qui "vacille" — un seul, au centre, comme un signal perdu */}
      <div
        aria-hidden
        className="sw-lightsaber-bar pointer-events-none absolute bottom-28 left-1/2 top-28 hidden w-[2px] -translate-x-1/2 rounded-full opacity-50 md:block"
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
          Holocron{" "}
          <span className="sw-hologram-text font-serif italic font-normal">
            fantôme
          </span>
        </h1>
        <p className="mt-10 max-w-md text-balance font-serif text-base italic text-white/55 md:text-lg">
          La Force ne perçoit pas cet holocron. Il flotte dans l&apos;hyperespace,
          n&apos;est plus scellé, ou ton lien pointe une mauvaise destination.
        </p>
      </div>

      <footer className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-6 py-6 text-[11px] uppercase tracking-[0.28em] text-white/40 md:px-12">
        <span>Temple Jedi · An 2026</span>
        <span className="text-cyan-200/55">Speetch</span>
      </footer>
    </div>
  );
}
