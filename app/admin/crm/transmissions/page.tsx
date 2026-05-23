import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button, StatusBadge } from "@/lib/ds";
import { isBrevoSettingsConfigured } from "@/lib/brevo-config";
import {
  TRANSMISSION_STATUS_LABEL,
  TRANSMISSION_STATUS_TONE,
  isTransmissionStatus,
} from "@/lib/crm-transmissions";
import { CrmSubnav } from "../_components/crm-subnav";

export const metadata: Metadata = {
  title: "Transmissions",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type TransmissionListRow = {
  id: string;
  subject: string;
  recipient_count: number;
  delivered_count: number;
  failed_count: number;
  status: string;
  created_at: string;
  sent_at: string | null;
};

const DATETIME_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function TransmissionsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/crm/transmissions");
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_transmissions" as never)
    .select(
      "id, subject, recipient_count, delivered_count, failed_count, status, created_at, sent_at",
    )
    .order("created_at", { ascending: false })
    .returns<TransmissionListRow[]>();

  const transmissions = data ?? [];
  const brevoOk = await isBrevoSettingsConfigured();

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
          Transmissions
        </span>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-12 pt-24 md:pt-20">
        <div className="flex flex-col gap-8">
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
            <span className="text-cyan-200/85">Transmissions</span>
          </p>

          <CrmSubnav />

          <div className="flex flex-wrap items-end justify-between gap-6">
            <h1
              className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
            >
              Les{" "}
              <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
                Transmissions
              </span>
            </h1>

            {brevoOk && (
              <Button
                href="/admin/crm/transmissions/new"
                variant="return"
              >
                Émettre une transmission
              </Button>
            )}
          </div>

          <p className="max-w-2xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            Émissions holographiques (emailings) envoyées aux Padawans via
            Brevo. Chaque transmission garde la trace de ses destinataires
            et du statut de livraison.
          </p>

          {!brevoOk && (
            <div className="flex flex-col gap-3 border-l-2 border-amber-300/60 bg-amber-300/[0.04] px-5 py-4 text-sm text-amber-100/85">
              <p className="text-[10px] uppercase tracking-[0.32em] text-amber-200/80">
                Émetteur Brevo non configuré
              </p>
              <p className="font-serif italic">
                Va dans{" "}
                <Link
                  href="/admin/settings/brevo"
                  className="not-italic text-cyan-200 underline-offset-4 hover:underline"
                >
                  Forge → Émetteur Brevo
                </Link>{" "}
                pour sceller ta clé API et ton sender par défaut.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p
            className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85"
            style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
          >
            Erreur de transmission · {error.message}
          </p>
        )}

        {transmissions.length === 0 ? (
          <EmptyState canSend={brevoOk} />
        ) : (
          <TransmissionsTable transmissions={transmissions} />
        )}
      </section>
    </div>
  );
}

function EmptyState({ canSend }: { canSend: boolean }) {
  return (
    <div className="relative flex flex-col items-start gap-8 pt-16">
      <div
        aria-hidden
        className="sw-hologram-line absolute inset-x-0 top-0"
      />
      <p className="max-w-md text-balance font-serif text-base italic text-white/55 md:text-lg">
        Aucune transmission n&apos;a encore quitté le Temple. La première
        partira dès qu&apos;un message sera adressé à un padawan.
      </p>
      {canSend && (
        <Button href="/admin/crm/transmissions/new" variant="large">
          Émettre la première transmission
        </Button>
      )}
    </div>
  );
}

function TransmissionsTable({
  transmissions,
}: {
  transmissions: TransmissionListRow[];
}) {
  return (
    <div className="overflow-hidden border border-cyan-200/15 bg-cyan-200/[0.015]">
      <div className="hidden grid-cols-[2.5fr_0.7fr_0.9fr_0.9fr_auto] items-center gap-4 border-b border-cyan-200/15 px-5 py-4 text-[10px] uppercase tracking-[0.32em] text-cyan-200/55 md:grid">
        <span>Sujet</span>
        <span>Destinataires</span>
        <span>Livrés</span>
        <span>Statut</span>
        <span className="text-right">Envoi</span>
      </div>

      <ul className="divide-y divide-cyan-200/10">
        {transmissions.map((t) => {
          const status = isTransmissionStatus(t.status) ? t.status : "pending";
          const when = t.sent_at ?? t.created_at;
          return (
            <li key={t.id}>
              <Link
                href={`/admin/crm/transmissions/${t.id}`}
                className="group grid grid-cols-1 gap-3 px-5 py-5 transition-colors hover:bg-cyan-200/[0.04] md:grid-cols-[2.5fr_0.7fr_0.9fr_0.9fr_auto] md:items-center md:gap-4 md:py-4"
              >
                <span className="font-sans text-base font-light text-[#F5F5F7] transition-colors group-hover:text-cyan-100 md:text-lg">
                  {t.subject}
                </span>

                <span className="hidden font-mono text-[12px] text-white/55 md:inline">
                  {t.recipient_count}
                </span>

                <span className="hidden font-mono text-[12px] md:inline">
                  <span className="text-emerald-300/80">
                    {t.delivered_count}
                  </span>
                  {t.failed_count > 0 && (
                    <>
                      <span className="text-white/30"> · </span>
                      <span className="text-red-300/80">
                        {t.failed_count} ✕
                      </span>
                    </>
                  )}
                </span>

                <span>
                  <StatusBadge tone={TRANSMISSION_STATUS_TONE[status]}>
                    {TRANSMISSION_STATUS_LABEL[status]}
                  </StatusBadge>
                </span>

                <span className="text-right font-mono text-[11px] text-white/35">
                  {DATETIME_FORMAT.format(new Date(when))}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

