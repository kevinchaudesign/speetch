import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button, Eyebrow, Hairline } from "@/lib/ds";
import { loadBrevoSettingsMeta } from "@/lib/brevo-config";
import { loadEmitterSettings, isEmitterReady } from "@/lib/credits/emitter";

export const metadata: Metadata = {
  title: "Forge",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SettingsHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/settings");
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const [
    { count: templateCount },
    { data: ownerProfile },
    { data: emailAccount },
    brevoMeta,
    emitter,
  ] = await Promise.all([
    admin
      .from("page_templates")
      .select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id, full_name, avatar_url, chatbot_system_prompt")
      .eq("is_owner", true)
      .maybeSingle(),
    admin
      .from("email_accounts" as never)
      .select("email")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<{ email: string }>(),
    loadBrevoSettingsMeta(),
    loadEmitterSettings(),
  ]);
  const emitterReady = isEmitterReady(emitter);

  const hasCustomChatbotPrompt =
    typeof ownerProfile?.chatbot_system_prompt === "string" &&
    ownerProfile.chatbot_system_prompt.trim().length > 0;

  const cards = [
    {
      href: "/admin/settings/profile",
      label: "Identité Jedi",
      hint: ownerProfile?.full_name
        ? ownerProfile.full_name
        : "Configure ton nom de Maître",
      summary: "Nom de Maître, avatar, signature owner.",
    },
    {
      href: "/admin/settings/chatbot",
      label: "Voix de Yoda",
      hint: hasCustomChatbotPrompt
        ? "Instructions personnalisées"
        : "Default Conseil Jedi",
      summary:
        "Réécris les system instructions du chatbot — pivote la personnalité, le ton, le vocabulaire. La voix de la Force, tu la modèles.",
    },
    {
      href: "/admin/settings/email",
      label: "Boîte email",
      hint: emailAccount?.email ?? "Non configuré",
      summary:
        "Connecte ta boîte contact@speetch.com (Infomaniak) pour recevoir et envoyer des emails depuis le Conseil. IMAP + SMTP, mot de passe chiffré AES-256.",
    },
    {
      href: "/admin/settings/brevo",
      label: "Émetteur Brevo",
      hint:
        brevoMeta && brevoMeta.hasApiKey && brevoMeta.senderEmail
          ? brevoMeta.senderEmail
          : "Non configuré",
      summary:
        "Pont vers api.brevo.com pour expédier les Transmissions aux Padawans. Clé API chiffrée AES-256-GCM, sender par défaut configurable.",
    },
    {
      href: "/admin/settings/emitter",
      label: "Émetteur Crédits",
      hint: emitterReady
        ? (emitter?.legal_name ?? "Configuré")
        : "Non configuré",
      summary:
        "Identité légale de l'agence : raison sociale, SIREN, n° TVA, adresse, IBAN, mentions obligatoires, préfixes de numérotation. Prêt pour la réforme facturation électronique.",
    },
    {
      href: "/admin/settings/facturation-electronique",
      label: "Facturation électronique",
      hint: emitter?.pdp_provider ?? "PDP à choisir",
      summary:
        "Réforme française 09/2026 : où Speetch en est, calendrier, comment choisir un PDP (Chorus Pro vs PDP privé), ce qui marche déjà et ce qui reste à brancher.",
    },
    {
      href: "/admin/settings/design-system",
      label: "Codex",
      hint: "Grammaire visuelle Speetch",
      summary:
        "Palette holocron, typographies, easings de la Force — référence visuelle pour les espaces clients.",
    },
    {
      href: "/admin/templates",
      label: "Blueprints",
      hint:
        templateCount && templateCount > 0
          ? `${templateCount} blueprint${templateCount > 1 ? "s" : ""} HTML`
          : "Aucun blueprint forgé",
      summary:
        "Forger les blueprints de pages (HTML brut, conversion via la Force — Claude API).",
    },
  ];

  return (
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
      {/* Star field + scanlines hologramme + sabre vertical à gauche */}
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
        <Button href="/admin" variant="return">
          Conseil
        </Button>
        <Eyebrow intensity="muted" tracking="sm" className="text-cyan-200/55">
          Forge
        </Eyebrow>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col gap-12 pt-20">
        <div className="flex flex-col gap-6">
          <Eyebrow tracking="lg" as="p" className="text-cyan-200/65">
            <Link
              href="/admin"
              className="transition-colors hover:text-cyan-100"
            >
              Conseil Jedi
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/85">Forge</span>
          </Eyebrow>

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
          >
            La{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              Forge
            </span>
          </h1>

          <p className="max-w-xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            Où le Maître affûte ses outils : identité Jedi, Codex visuel,
            blueprints de pages — les fondations de ton Conseil.
          </p>
        </div>

        {/* Grille des sous-rubriques — bordure cyan subtile, hover hologramme */}
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-cyan-200/[0.1] md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="group relative flex h-full flex-col gap-6 bg-black p-7 transition-colors duration-500 ease-out hover:bg-cyan-200/[0.04] md:p-9"
              >
                <Eyebrow
                  tracking="lg"
                  className="text-[10px] text-cyan-200/40 transition-colors duration-500 group-hover:text-cyan-200/75"
                >
                  Console
                </Eyebrow>

                <h2
                  className="font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-[#F5F5F7] transition-colors duration-500 group-hover:text-cyan-100"
                  style={{ fontSize: "clamp(1.5rem, 2.6vw, 2.25rem)" }}
                >
                  {card.label}
                </h2>

                <Eyebrow tracking="sm" className="text-cyan-200/70">
                  {card.hint}
                </Eyebrow>

                <p className="font-serif text-sm italic text-white/55 transition-colors duration-500 group-hover:text-white/80 md:text-base">
                  {card.summary}
                </p>

                <span className="mt-auto inline-flex items-center gap-3 pt-4 text-[10px] uppercase tracking-[0.32em] text-white/40 transition-colors duration-500 group-hover:text-cyan-100">
                  <Hairline width="sm" hover="xl" />
                  <span>Engager</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center pt-4">
          <Button href="/admin" variant="ghost">
            ← Conseil
          </Button>
        </div>
      </section>
    </div>
  );
}
