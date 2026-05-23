import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button, Hairline } from "@/lib/ds";
import { isStarWarsDay } from "@/lib/sw/star-wars-day";
import { DashboardCockpit } from "./_components/dashboard";
import { loadCockpitData } from "./_components/dashboard/data";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Double-garde côté serveur (le middleware redirige déjà mais belt-and-suspenders).
  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  const isOwner = ownerEmail
    ? user.email?.toLowerCase() === ownerEmail
    : true;

  // Nom Jedi affiché — priorité au profil owner, fallback sur l'email.
  const admin = createAdminClient();
  const { data: ownerProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("is_owner", true)
    .maybeSingle();
  const masterName =
    ownerProfile?.full_name?.trim() || user.email?.split("@")[0] || "Jedi";

  // Données cockpit — agrégats KPI + funnel + activity feed.
  const cockpit = await loadCockpitData();

  return (
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
      {/* Star field — fond stellaire animé */}
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0 -z-10"
      />

      {/* Scanlines hologramme par-dessus */}
      <div
        aria-hidden
        className="sw-scanlines pointer-events-none absolute inset-0 -z-10 opacity-50"
      />

      {/* Sabre vertical à gauche (desktop) — accent lumière cyan */}
      <div
        aria-hidden
        className="sw-lightsaber-bar pointer-events-none absolute bottom-16 left-2 top-24 hidden w-[2px] rounded-full md:block"
      />

      {/* Header — mobile only (la sidebar prend le relai en desktop) */}
      <header className="flex items-center justify-between md:hidden">
        <Button href="/" variant="return">
          Speetch
        </Button>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
          >
            <span>Déconnexion</span>
            <Hairline />
          </button>
        </form>
      </header>

      <section className="mx-auto flex max-w-7xl flex-col gap-10 pt-24 md:pt-12">
        {/* Easter egg — bannière May the 4th uniquement le 4 mai */}
        {isStarWarsDay() && (
          <div
            className="w-full rounded-md border border-cyan-200/35 bg-cyan-200/[0.06] px-6 py-4 backdrop-blur-sm"
            style={{
              boxShadow:
                "0 0 24px rgba(125, 211, 252, 0.25), inset 0 0 12px rgba(125, 211, 252, 0.04)",
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/85">
              ✦ Star Wars Day ✦
            </p>
            <p
              className="mt-2 font-serif text-xl font-light italic text-[#F5F5F7]"
              style={{
                textShadow: "0 0 12px rgba(125, 211, 252, 0.55)",
              }}
            >
              May the 4th be with you, Maître.
            </p>
          </div>
        )}

        {/* Cockpit header — HUD avec status, identité, horloge système */}
        <CockpitHeader
          masterName={masterName}
          email={user.email ?? ""}
          isOwner={isOwner}
        />

        {/* Le cockpit lui-même — graphiques, KPI, activity feed */}
        <DashboardCockpit data={cockpit} />
      </section>

      {/* Footer */}
      <footer className="mt-12 flex items-end justify-between px-0 py-6 text-[11px] uppercase tracking-[0.28em] text-white/40">
        <span>Temple Jedi · An 2026</span>
        <span className="text-cyan-200/55">Speetch — Conseil Jedi</span>
      </footer>
    </div>
  );
}

/**
 * Bandeau cockpit en haut du dashboard. Style HUD :
 *  - Identité Jedi en gros (titre type "MAÎTRE X · CONSEIL")
 *  - Statut transmission (dot pulsant)
 *  - Email + warning si non-owner
 *  - Coordonnées système (pseudo-télémétrie galactique)
 */
function CockpitHeader({
  masterName,
  email,
  isOwner,
}: {
  masterName: string;
  email: string;
  isOwner: boolean;
}) {
  return (
    <div className="relative flex flex-col gap-6 border border-cyan-200/15 bg-cyan-200/[0.018] px-6 py-7 md:flex-row md:items-center md:justify-between md:px-8 md:py-8">
      {/* Brackets HUD */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-2 w-2 border-l border-t border-cyan-200/55"
      />
      <span
        aria-hidden
        className="absolute right-0 top-0 h-2 w-2 border-r border-t border-cyan-200/55"
      />
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-cyan-200/55"
      />
      <span
        aria-hidden
        className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-cyan-200/55"
      />

      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/65">
          Conseil Jedi · Poste de pilotage
        </span>
        <h1
          className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(1.85rem, 4.5vw, 3.25rem)" }}
        >
          Bienvenue,{" "}
          <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
            Maître {masterName}
          </span>
        </h1>
      </div>

      <div className="flex flex-col gap-2 md:items-end">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-cyan-100/85">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping-soft rounded-full bg-cyan-300" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
          </span>
          <span>Transmission stabilisée</span>
        </div>
        <span className="font-mono text-[11px] text-white/40">{email}</span>
        {!isOwner && (
          <span className="text-[10px] uppercase tracking-[0.32em] text-amber-300/85">
            Padawan · accès restreint
          </span>
        )}
      </div>
    </div>
  );
}
