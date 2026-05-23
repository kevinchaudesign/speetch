import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Eyebrow, StatusBadge } from "@/lib/ds";
import {
  TRANSMISSION_STATUS_LABEL,
  TRANSMISSION_STATUS_TONE,
  isTransmissionStatus,
  type TransmissionRecipient,
  type TransmissionRow,
} from "@/lib/crm-transmissions";
import { DeleteTransmissionButton } from "./delete-transmission-button";

export const metadata: Metadata = {
  title: "Transmission",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DATETIME_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function TransmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/admin/crm/transmissions/${id}`);
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { data: t } = await admin
    .from("crm_transmissions" as never)
    .select(
      "id, subject, body_html, body_text, sender_name, sender_email, reply_to, recipients, recipient_count, delivered_count, failed_count, status, error, created_at, sent_at",
    )
    .eq("id", id)
    .maybeSingle<TransmissionRow>();

  if (!t) notFound();

  const status = isTransmissionStatus(t.status) ? t.status : "pending";
  const when = t.sent_at ?? t.created_at;
  const recipients = Array.isArray(t.recipients) ? t.recipients : [];

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
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-start gap-10 pt-20 md:pt-28">
        <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
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
          <span className="text-cyan-200/85">{t.subject}</span>
        </p>

        <div className="flex flex-col gap-4">
          <StatusBadge tone={TRANSMISSION_STATUS_TONE[status]}>
            {TRANSMISSION_STATUS_LABEL[status]}
          </StatusBadge>

          <h1
            className="font-sans font-extralight leading-[0.95] tracking-[-0.04em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
          >
            {t.subject}
          </h1>

          <p className="font-mono text-[12px] text-white/55">
            {DATETIME_FORMAT.format(new Date(when))}
            <span className="mx-2 text-white/25">·</span>
            {t.sender_name ? `${t.sender_name} ` : ""}
            <span className="text-white/40">&lt;</span>
            {t.sender_email}
            <span className="text-white/40">&gt;</span>
            {t.reply_to && (
              <>
                <span className="mx-2 text-white/25">·</span>
                <span className="text-white/55">reply-to {t.reply_to}</span>
              </>
            )}
          </p>
        </div>

        {/* Stats agrégées */}
        <ul className="grid w-full grid-cols-3 gap-px overflow-hidden rounded-md border border-cyan-200/15 bg-cyan-200/[0.04]">
          <Stat label="Destinataires" value={t.recipient_count} tone="info" />
          <Stat label="Livrés" value={t.delivered_count} tone="success" />
          <Stat label="Échecs" value={t.failed_count} tone="danger" />
        </ul>

        {t.error && (
          <p className="border-l-2 border-red-400/60 bg-red-400/[0.04] py-3 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85">
            {t.error}
          </p>
        )}

        {/* Corps du message */}
        <div className="flex w-full flex-col gap-4">
          <Eyebrow tracking="md" className="text-cyan-200/70">
            Message
          </Eyebrow>
          <div className="rounded-md border border-cyan-200/15 bg-black/30 p-5">
            <pre className="whitespace-pre-wrap break-words font-sans text-[15px] leading-relaxed text-white/85">
              {t.body_text ?? "—"}
            </pre>
          </div>
        </div>

        {/* Liste des destinataires + statut détaillé */}
        <div className="flex w-full flex-col gap-4">
          <Eyebrow tracking="md" className="text-cyan-200/70">
            Destinataires ({recipients.length})
          </Eyebrow>
          <RecipientsTable recipients={recipients} />
        </div>

        <div className="flex w-full items-center justify-between border-t border-cyan-200/15 pt-6">
          <DeleteTransmissionButton
            transmissionId={t.id}
            subject={t.subject}
          />
          <Link
            href="/admin/crm/transmissions"
            className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors hover:text-cyan-100"
          >
            ← Retour Transmissions
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "info" | "success" | "danger";
}) {
  const color =
    tone === "success"
      ? "text-emerald-300/90"
      : tone === "danger"
        ? "text-red-300/90"
        : "text-cyan-200/90";
  return (
    <li className="flex flex-col items-center gap-2 bg-black/40 px-4 py-5">
      <span className="text-[9px] uppercase tracking-[0.32em] text-white/45">
        {label}
      </span>
      <span className={`font-sans text-3xl font-extralight ${color}`}>
        {value}
      </span>
    </li>
  );
}

function RecipientsTable({
  recipients,
}: {
  recipients: TransmissionRecipient[];
}) {
  if (recipients.length === 0) {
    return (
      <p className="border-l-2 border-white/15 pl-4 font-serif text-sm italic text-white/45">
        Aucun destinataire enregistré.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-cyan-200/15">
      <ul className="divide-y divide-cyan-200/10">
        {recipients.map((r, i) => {
          const tone =
            r.status === "delivered"
              ? "success"
              : r.status === "failed"
                ? "danger"
                : "neutral";
          const label =
            r.status === "delivered"
              ? "Livré"
              : r.status === "failed"
                ? "Échec"
                : "En attente";
          return (
            <li
              key={`${r.email}-${i}`}
              className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-[2fr_2fr_1fr] md:items-center md:gap-4"
            >
              <span className="text-sm text-[#F5F5F7]">
                {r.full_name ?? "—"}
              </span>
              <span className="font-mono text-[12px] text-white/65">
                {r.email}
              </span>
              <div className="flex items-center gap-3">
                <StatusBadge tone={tone}>{label}</StatusBadge>
                {r.error && (
                  <span
                    className="truncate text-[10px] text-red-300/75"
                    title={r.error}
                  >
                    {r.error}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
