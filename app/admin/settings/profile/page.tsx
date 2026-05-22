import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Identité Jedi",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OwnerProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/settings/profile");
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { data: ownerProfile } = await admin
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("is_owner", true)
    .maybeSingle();

  return (
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
      {/* Star field + scanlines + sabre vertical — cohérent dashboard/forge */}
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
        <Link
          href="/admin/settings"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Forge
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Identité
        </span>
      </header>

      <section className="mx-auto flex max-w-2xl flex-col items-start gap-12 pt-20">
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
            <span className="text-cyan-200/85">Identité Jedi</span>
          </p>

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            Identité{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              Jedi
            </span>
          </h1>

          <p className="max-w-lg font-serif text-base italic text-white/55 md:text-lg">
            Carte du Maître — ce que verront les outils internes qui
            référencent ton compte owner.
          </p>
        </div>

        <ProfileForm
          initialFullName={ownerProfile?.full_name ?? ""}
          initialAvatarUrl={ownerProfile?.avatar_url ?? ""}
          ownerEmail={user.email ?? null}
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
