import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadBrevoSettingsMeta } from "@/lib/brevo-config";
import { isEncryptionKeyConfigured } from "@/lib/email/crypto";
import { BrevoSettingsForm } from "./brevo-form";

export const metadata: Metadata = {
  title: "Brevo · Forge",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function BrevoSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/settings/brevo");

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const settings = await loadBrevoSettingsMeta();
  const keyConfigured = isEncryptionKeyConfigured();

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
          href="/admin/settings"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Forge
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Brevo
        </span>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-start gap-12 pt-20">
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
            <span className="text-cyan-200/85">Brevo</span>
          </p>

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            Émetteur{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              Brevo
            </span>
          </h1>

          <p className="max-w-2xl font-serif text-base italic text-white/55 md:text-lg">
            Pont vers <code className="not-italic text-cyan-100">api.brevo.com</code>{" "}
            pour expédier les <Link href="/admin/crm/transmissions" className="not-italic text-cyan-100 underline-offset-4 hover:underline">Transmissions</Link>{" "}
            aux Padawans. La clé API est chiffrée AES-256-GCM avant
            stockage.
          </p>

          {!keyConfigured && (
            <div className="rounded-md border border-amber-300/30 bg-amber-300/[0.05] px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.32em] text-amber-200/85">
                Clé de chiffrement manquante
              </p>
              <p className="mt-2 font-serif text-sm italic text-white/65">
                Avant de stocker la clé Brevo, ajoute{" "}
                <code className="not-italic text-amber-200">
                  SPEETCH_EMAIL_ENCRYPTION_KEY
                </code>{" "}
                à ton <code className="not-italic text-amber-200">.env.local</code> (32 bytes hex, 64 caractères) :
              </p>
              <pre className="mt-3 overflow-x-auto rounded-md border border-amber-300/15 bg-black/60 p-3 font-mono text-[12px] text-amber-100/85">
                {"node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""}
              </pre>
            </div>
          )}
        </div>

        <BrevoSettingsForm
          initialSettings={settings}
          keyConfigured={keyConfigured}
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
