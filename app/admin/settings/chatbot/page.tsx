import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { DEFAULT_PRODUCT_BRIEF } from "@/lib/chatbot/system-prompt";
import { ChatbotPromptForm } from "./chatbot-form";

export const metadata: Metadata = {
  title: "Voix de Yoda · Forge",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ChatbotInstructionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/settings/chatbot");
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { data: ownerProfile } = await admin
    .from("profiles")
    .select("id, chatbot_system_prompt")
    .eq("is_owner", true)
    .maybeSingle();

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

      {/* Header mobile */}
      <header className="flex items-center justify-between md:hidden">
        <Link
          href="/admin/settings"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Forge
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Voix de Yoda
        </span>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-start gap-12 pt-20">
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/55">
            <Link
              href="/admin"
              className="transition-colors hover:text-cyan-100"
            >
              Conseil Jedi
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <Link
              href="/admin/settings"
              className="transition-colors hover:text-cyan-100"
            >
              Forge
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/85">Voix de Yoda</span>
          </p>

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            Voix de{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              Yoda
            </span>
          </h1>

          <p className="max-w-2xl font-serif text-base italic text-white/55 md:text-lg">
            Ici, la personnalité du chatbot, tu modèles. Le ton, le
            vocabulaire, la voix — entièrement réécris si tu veux. Speetch est
            un groupe de communication à l&apos;ère de l&apos;IA : le system
            prompt est un asset business, pas une constante. Pivote Yoda vers
            une voix de marque, un assistant business, ce que tu veux.
          </p>
        </div>

        <ChatbotPromptForm
          ownerId={ownerProfile?.id ?? null}
          initialPrompt={ownerProfile?.chatbot_system_prompt ?? null}
          defaultPrompt={DEFAULT_PRODUCT_BRIEF}
        />

        <Link
          href="/admin/settings"
          className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors hover:text-cyan-100"
        >
          ← Retour Forge
        </Link>
      </section>
    </div>
  );
}
