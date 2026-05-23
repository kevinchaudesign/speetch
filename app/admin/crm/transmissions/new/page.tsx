import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getBrevoDefaultSender, isBrevoConfigured } from "@/lib/brevo";
import {
  PADAWAN_STATUS_LABEL,
  PADAWAN_STATUS_VALUES,
  isPadawanStatus,
} from "@/lib/crm";
import { NewTransmissionForm } from "./new-transmission-form";

export const metadata: Metadata = {
  title: "Émettre une transmission",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PadawanPick = {
  id: string;
  full_name: string;
  company: string | null;
  email: string | null;
  status: string;
};

export default async function NewTransmissionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/crm/transmissions/new");
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  // Si Brevo n'est pas configuré, on renvoie vers la liste qui affichera
  // l'écran d'instruction. Évite un form qui ne mènerait nulle part.
  if (!isBrevoConfigured()) {
    redirect("/admin/crm/transmissions");
  }

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("crm_padawans" as never)
    .select("id, full_name, company, email, status")
    .order("updated_at", { ascending: false })
    .returns<PadawanPick[]>();

  // Seuls les padawans avec email peuvent être destinataires. On les
  // expose tous au form (filtre côté UI par statut), pas seulement les
  // contactables, pour que l'utilisateur voie aussi ceux qui manquent
  // d'email et puisse les compléter d'un coup d'œil ailleurs.
  const padawans = (rows ?? []).map((p) => ({
    ...p,
    statusLabel: isPadawanStatus(p.status)
      ? PADAWAN_STATUS_LABEL[p.status]
      : p.status,
  }));

  const sender = getBrevoDefaultSender();

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
          href="/admin/crm/transmissions"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Transmissions
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Émission
        </span>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-start gap-12 pt-20 md:pt-28">
        <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
          Conseil Jedi
          <span className="mx-3 text-cyan-200/20">→</span>
          <Link
            href="/admin/crm"
            className="transition-colors hover:text-cyan-100"
          >
            Padawans
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <Link
            href="/admin/crm/transmissions"
            className="transition-colors hover:text-cyan-100"
          >
            Transmissions
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <span className="text-cyan-200/85">Émission</span>
        </p>

        <h1
          className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
        >
          Émettre une{" "}
          <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
            transmission
          </span>
        </h1>

        <NewTransmissionForm
          padawans={padawans}
          statusValues={[...PADAWAN_STATUS_VALUES]}
          statusLabels={PADAWAN_STATUS_LABEL}
          senderEmail={sender?.email ?? ""}
          senderName={sender?.name ?? ""}
        />
      </section>
    </div>
  );
}
