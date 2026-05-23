import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DROID_ACCENT_CSS, DROIDS, type Droid } from "@/lib/droids";
import { DroidIcon } from "./_components/droid-icons";

export const metadata: Metadata = {
  title: "Droïdes",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DroidsHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/droids");

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

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

      <header className="flex items-center justify-between md:hidden">
        <Link
          href="/admin"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Conseil
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Hangar
        </span>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-12 pt-24 md:pt-20">
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            Conseil Jedi
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/85">Hangar des Droïdes</span>
          </p>

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
          >
            Le{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              Hangar
            </span>
          </h1>

          <p className="max-w-2xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            Une équipe de droïdes spécialisés. Chacun a sa voix, sa
            mission, son domaine. Ouvre une transmission, donne ta
            requête — le droïde répond dans son ton.
          </p>
        </div>

        {/* Grille des droïdes */}
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-cyan-200/[0.1] md:grid-cols-2 lg:grid-cols-3">
          {DROIDS.map((d) => (
            <li key={d.codename}>
              <DroidCard droid={d} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function DroidCard({ droid }: { droid: Droid }) {
  const accent = DROID_ACCENT_CSS[droid.accent];
  return (
    <Link
      href={`/admin/droids/${droid.codename}`}
      className="group relative flex h-full flex-col gap-6 bg-black p-7 transition-colors duration-500 ease-out hover:bg-cyan-200/[0.03] md:p-9"
      style={{
        // Halo subtil dans la couleur du droïde au hover
        // (via inline style pour échapper à la limite des classes dynamiques Tailwind)
        boxShadow: `inset 0 0 0 1px transparent`,
      }}
    >
      {/* Brackets HUD coin haut droit (signal d'instrument) */}
      <span
        aria-hidden
        className="absolute right-0 top-0 h-2 w-2 border-r border-t border-cyan-200/40"
      />
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-cyan-200/40"
      />

      <div className="flex items-start justify-between gap-4">
        {/* Icône droïde */}
        <div
          className="relative flex h-16 w-16 shrink-0 items-center justify-center"
          style={{ color: accent.hex }}
        >
          <div
            aria-hidden
            className="absolute inset-0 rounded-full opacity-30 blur-xl transition-opacity duration-500 group-hover:opacity-60"
            style={{ background: accent.glow }}
          />
          <DroidIcon
            codename={droid.codename}
            size={56}
            className="relative drop-shadow-[0_0_8px_currentColor]"
          />
        </div>

        {/* Status indicator */}
        <div className="flex flex-col items-end gap-1">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span
              className="absolute inset-0 animate-ping-soft rounded-full"
              style={{ background: accent.hex }}
            />
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full"
              style={{ background: accent.hex }}
            />
          </span>
          <span className="text-[9px] uppercase tracking-[0.32em] text-white/40">
            En ligne
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p
          className="font-mono text-[10px] uppercase tracking-[0.32em]"
          style={{ color: accent.hex }}
        >
          {droid.role}
        </p>
        <h2
          className="font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-[#F5F5F7] transition-colors duration-500"
          style={{
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
          }}
        >
          {droid.displayName}
        </h2>
        <p className="font-serif text-sm italic text-white/60 md:text-base">
          {droid.tagline}
        </p>
      </div>

      <p className="text-[12px] leading-relaxed text-white/55">
        {droid.description}
      </p>

      <span
        className="mt-auto inline-flex items-center gap-3 pt-4 text-[10px] uppercase tracking-[0.32em] transition-colors duration-500"
        style={{ color: accent.hex }}
      >
        <span
          className="inline-block h-px w-4 transition-all duration-500 ease-out group-hover:w-12"
          style={{ background: "currentColor" }}
        />
        Ouvrir la transmission
      </span>
    </Link>
  );
}
