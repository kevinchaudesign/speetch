import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button, Eyebrow, Hairline } from "@/lib/ds";
import { isStarWarsDay } from "@/lib/sw/star-wars-day";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/* Icône Holocron — petit cube isométrique pour la section Holocrons clients */
function HolocronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3 L4 7 L4 17 L12 21 L20 17 L20 7 Z" />
      <path d="M12 3 L12 12 M12 12 L4 7 M12 12 L20 7 M12 12 L12 21" />
    </svg>
  );
}

/* Icône Console — hexagone avec dots, vibe panneau de commande Jedi */
function ConsoleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="12,3 21,8 21,16 12,21 3,16 3,8" />
      <circle cx="9" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

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

      {/* Centre */}
      <section className="mx-auto flex max-w-4xl flex-col items-start gap-12 pt-24 md:pt-20">
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

        <Eyebrow tracking="lg" className="text-cyan-200/80">
          Conseil Jedi
        </Eyebrow>

        <h1
          className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
        >
          Bienvenue,{" "}
          <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
            Maître {masterName}
          </span>
        </h1>

        <div className="flex flex-col gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55">
          <div className="flex items-center gap-3">
            <span className="sw-cyan-dot block h-1.5 w-1.5 rounded-full bg-cyan-300" />
            <span className="text-cyan-100/85">Transmission stabilisée</span>
          </div>
          <div className="text-white/40">{user.email}</div>
          {!isOwner && (
            <div className="text-amber-300/85">
              Padawan — accès au Conseil restreint
            </div>
          )}
        </div>

        {/* Hairline hologramme entre les sections */}
        <div
          aria-hidden
          className="sw-hologram-line mt-8 w-full"
        />

        {/* ── Holocrons clients ───────────────────────────────────────── */}
        <div className="mt-4 w-full">
          <div className="flex items-center gap-3 text-cyan-200/85">
            <HolocronIcon className="sw-hologram-text" />
            <Eyebrow intensity="strong" className="text-cyan-100/80">
              Holocrons clients
            </Eyebrow>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-12 gap-y-6">
            <Button href="/admin/clients/new" variant="large">
              Forger un nouvel holocron
            </Button>
            <Button href="/admin/clients" variant="primary">
              Archives complètes
            </Button>
          </div>

          <ul className="mt-12 flex flex-col gap-3 text-base text-white/45 md:text-lg">
            <li>· Slug auto-généré à chaque ouverture</li>
            <li>· Sceau scrypt + pepper côté serveur</li>
            <li>· Lien holocron unique à transmettre</li>
          </ul>
        </div>

        <div aria-hidden className="sw-hologram-line w-full" />

        {/* ── Console du Maître ───────────────────────────────────────── */}
        <div className="w-full">
          <div className="flex items-center gap-3 text-cyan-200/85">
            <ConsoleIcon className="sw-hologram-text" />
            <Eyebrow intensity="strong" className="text-cyan-100/80">
              Console du Maître
            </Eyebrow>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-12 gap-y-6">
            <Button href="/admin/settings" variant="large">
              Ouvrir la console
            </Button>
            <Button href="/admin/settings/profile" variant="primary">
              Identité Jedi
            </Button>
            <Button href="/admin/templates" variant="primary">
              Blueprints
            </Button>
          </div>

          <ul className="mt-12 flex flex-col gap-3 text-base text-white/45 md:text-lg">
            <li>· Identité owner (nom de Maître, avatar)</li>
            <li>· Blueprints HTML forgés via la Force (Claude API)</li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="absolute inset-x-0 bottom-0 flex items-end justify-between px-6 py-6 text-[11px] uppercase tracking-[0.28em] text-white/40 md:px-12">
        <span>Temple Jedi · An 2026</span>
        <span className="text-cyan-200/55">Speetch — Conseil Jedi</span>
      </footer>
    </div>
  );
}
