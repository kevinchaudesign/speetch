import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DROID_ACCENT_CSS, getDroid } from "@/lib/droids";
import { DroidIcon } from "../_components/droid-icons";
import { DroidChat } from "./droid-chat";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codename: string }>;
}): Promise<Metadata> {
  const { codename } = await params;
  const droid = getDroid(codename);
  if (!droid) return { title: "Droïde inconnu", robots: { index: false, follow: false } };
  return {
    title: `${droid.displayName} · ${droid.role}`,
    robots: { index: false, follow: false },
  };
}

export const dynamic = "force-dynamic";

export default async function DroidChatPage({
  params,
}: {
  params: Promise<{ codename: string }>;
}) {
  const { codename } = await params;
  const droid = getDroid(codename);
  if (!droid) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/admin/droids/${codename}`);

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const accent = DROID_ACCENT_CSS[droid.accent];

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

      {/* Halo de fond aux couleurs du droïde */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: accent.glow }}
      />

      <header className="flex items-center justify-between md:hidden">
        <Link
          href="/admin/droids"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Hangar
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          {droid.displayName}
        </span>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col gap-10 pt-20 md:pt-12">
        <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
          <Link
            href="/admin"
            className="transition-colors hover:text-cyan-100"
          >
            Conseil Jedi
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <Link
            href="/admin/droids"
            className="transition-colors hover:text-cyan-100"
          >
            Hangar
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <span className="text-cyan-200/85">{droid.displayName}</span>
        </p>

        {/* En-tête droïde — icône + ID + status */}
        <div className="relative flex flex-col items-start gap-6 border border-cyan-200/15 bg-cyan-200/[0.018] px-6 py-7 md:flex-row md:items-center md:gap-8 md:px-8 md:py-8">
          {/* Brackets HUD */}
          <span
            aria-hidden
            className="absolute left-0 top-0 h-2 w-2 border-l border-t"
            style={{ borderColor: accent.hex }}
          />
          <span
            aria-hidden
            className="absolute right-0 top-0 h-2 w-2 border-r border-t"
            style={{ borderColor: accent.hex }}
          />
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-2 w-2 border-b border-l"
            style={{ borderColor: accent.hex }}
          />
          <span
            aria-hidden
            className="absolute bottom-0 right-0 h-2 w-2 border-b border-r"
            style={{ borderColor: accent.hex }}
          />

          <div
            className="relative flex h-20 w-20 shrink-0 items-center justify-center"
            style={{ color: accent.hex }}
          >
            <div
              aria-hidden
              className="absolute inset-0 rounded-full opacity-40 blur-2xl"
              style={{ background: accent.glow }}
            />
            <DroidIcon
              codename={droid.codename}
              size={72}
              className="relative drop-shadow-[0_0_12px_currentColor]"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.32em]"
              style={{ color: accent.hex }}
            >
              {droid.role}
            </p>
            <h1
              className="font-sans font-extralight leading-[0.85] tracking-[-0.04em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}
            >
              {droid.displayName}
            </h1>
            <p className="font-serif text-sm italic text-white/65 md:text-base">
              {droid.tagline}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="relative inline-flex h-2 w-2">
              <span
                className="absolute inset-0 animate-ping-soft rounded-full"
                style={{ background: accent.hex }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: accent.hex }}
              />
            </span>
            <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
              Liaison stable
            </span>
          </div>
        </div>

        {/* Interface chat */}
        <DroidChat
          codename={droid.codename}
          displayName={droid.displayName}
          role={droid.role}
          starters={droid.starters}
          accentHex={accent.hex}
          accentGlow={accent.glow}
        />

        <Link
          href="/admin/droids"
          className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors hover:text-cyan-100"
        >
          ← Retour Hangar
        </Link>
      </section>
    </div>
  );
}
