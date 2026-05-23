import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button, StatusBadge } from "@/lib/ds";
import { loadEmitterSettings, isEmitterReady } from "@/lib/credits/emitter";
import { formatEuro } from "@/lib/credits/pricing";
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_TONE,
  isInvoiceStatus,
  isQuoteStatus,
} from "@/lib/credits/types";
import { CreditsSubnav } from "./_components/credits-subnav";

export const metadata: Metadata = {
  title: "Crédits",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type QuoteRow = {
  id: string;
  number: string;
  client_name: string;
  status: string;
  total_ttc: number;
  issued_at: string;
};

type InvoiceRow = {
  id: string;
  number: string;
  client_name: string;
  status: string;
  total_ttc: number;
  paid_amount: number;
  due_at: string | null;
  issued_at: string;
};

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

export default async function CreditsOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/credits");

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const [{ data: quotes }, { data: invoices }, emitter] = await Promise.all([
    admin
      .from("credit_quotes" as never)
      .select("id, number, client_name, status, total_ttc, issued_at")
      .order("issued_at", { ascending: false })
      .returns<QuoteRow[]>(),
    admin
      .from("credit_invoices" as never)
      .select(
        "id, number, client_name, status, total_ttc, paid_amount, due_at, issued_at",
      )
      .order("issued_at", { ascending: false })
      .returns<InvoiceRow[]>(),
    loadEmitterSettings(),
  ]);

  const quoteList = quotes ?? [];
  const invoiceList = invoices ?? [];
  const ready = isEmitterReady(emitter);

  // KPI calculs
  const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
  const ytd = invoiceList.filter(
    (i) => Date.parse(i.issued_at) >= yearStart && i.status !== "canceled",
  );
  const collectedYTD = ytd
    .filter((i) => i.status === "paid" || i.status === "partial")
    .reduce((s, i) => s + Number(i.paid_amount), 0);
  const billedYTD = ytd.reduce((s, i) => s + Number(i.total_ttc), 0);
  const pending = invoiceList
    .filter((i) => i.status === "sent" || i.status === "partial")
    .reduce(
      (s, i) => s + Math.max(0, Number(i.total_ttc) - Number(i.paid_amount)),
      0,
    );
  const overdue = invoiceList
    .filter((i) => {
      if (i.status !== "overdue" && i.status !== "sent" && i.status !== "partial")
        return false;
      if (!i.due_at) return false;
      return Date.parse(i.due_at) < Date.now() && Number(i.paid_amount) < Number(i.total_ttc);
    })
    .reduce(
      (s, i) => s + Math.max(0, Number(i.total_ttc) - Number(i.paid_amount)),
      0,
    );

  const draftQuotes = quoteList.filter((q) => q.status === "draft").length;
  const sentQuotes = quoteList.filter((q) => q.status === "sent").length;
  const acceptedNotInvoiced = quoteList.filter((q) => q.status === "accepted").length;

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
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 hover:text-cyan-100"
        >
          ← Conseil
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Crédits
        </span>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-12 pt-24 md:pt-20">
        <div className="flex flex-col gap-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            Conseil Jedi
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/85">Crédits</span>
          </p>

          <CreditsSubnav />

          <div className="flex flex-wrap items-end justify-between gap-6">
            <h1
              className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
            >
              Les{" "}
              <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
                Crédits Galactiques
              </span>
            </h1>
          </div>

          <p className="max-w-2xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            Flux financier de l&apos;agence — devis émis, factures
            scellées, encaissements. Numérotation séquentielle conforme,
            structure préparée pour la réforme française de facturation
            électronique.
          </p>

          {!ready && (
            <div className="flex flex-col gap-3 border-l-2 border-amber-300/60 bg-amber-300/[0.04] px-5 py-4 text-sm text-amber-100/85">
              <p className="text-[10px] uppercase tracking-[0.32em] text-amber-200/80">
                Émetteur Crédits non configuré
              </p>
              <p className="font-serif italic">
                Avant d&apos;émettre, configure ta carte d&apos;identité légale dans{" "}
                <Link
                  href="/admin/settings/emitter"
                  className="not-italic text-cyan-200 underline-offset-4 hover:underline"
                >
                  Forge → Émetteur Crédits
                </Link>
                .
              </p>
            </div>
          )}
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Tile
            label="Encaissé YTD"
            value={formatEuro(collectedYTD)}
            sub={`sur ${formatEuro(billedYTD)} facturés`}
            tone="emerald"
          />
          <Tile
            label="En attente"
            value={formatEuro(pending)}
            sub="factures émises non encaissées"
            tone="cyan"
          />
          <Tile
            label="En retard"
            value={formatEuro(overdue)}
            sub="échéance dépassée"
            tone="rose"
          />
          <Tile
            label="Devis en cours"
            value={String(sentQuotes + acceptedNotInvoiced)}
            sub={`${sentQuotes} envoyés · ${acceptedNotInvoiced} acceptés · ${draftQuotes} brouillons`}
            tone="amber"
          />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-4">
          <Button href="/admin/credits/devis/new" variant="primary">
            Émettre un devis
          </Button>
          <Button href="/admin/credits/factures/new" variant="primary">
            Émettre une facture
          </Button>
        </div>

        {/* Recent quotes + invoices side by side */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentPanel
            title="Derniers devis"
            href="/admin/credits/devis"
            rows={quoteList.slice(0, 5).map((q) => {
              const st = isQuoteStatus(q.status) ? q.status : "draft";
              return {
                id: q.id,
                href: `/admin/credits/devis/${q.id}`,
                number: q.number,
                client: q.client_name,
                total: Number(q.total_ttc),
                statusLabel: QUOTE_STATUS_LABEL[st],
                statusTone: QUOTE_STATUS_TONE[st],
                issuedAt: q.issued_at,
              };
            })}
          />
          <RecentPanel
            title="Dernières factures"
            href="/admin/credits/factures"
            rows={invoiceList.slice(0, 5).map((i) => {
              const st = isInvoiceStatus(i.status) ? i.status : "draft";
              return {
                id: i.id,
                href: `/admin/credits/factures/${i.id}`,
                number: i.number,
                client: i.client_name,
                total: Number(i.total_ttc),
                statusLabel: INVOICE_STATUS_LABEL[st],
                statusTone: INVOICE_STATUS_TONE[st],
                issuedAt: i.issued_at,
              };
            })}
          />
        </div>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "cyan" | "amber" | "emerald" | "rose";
}) {
  const color =
    tone === "emerald"
      ? "text-emerald-300/95"
      : tone === "rose"
        ? "text-red-300/90"
        : tone === "amber"
          ? "text-amber-200/95"
          : "text-cyan-200/95";
  return (
    <div className="relative border border-cyan-200/15 bg-cyan-200/[0.018] px-5 py-5">
      <span
        aria-hidden
        className="absolute left-0 top-0 h-2 w-2 border-l border-t border-cyan-200/55"
      />
      <span
        aria-hidden
        className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-cyan-200/55"
      />
      <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/65">
        {label}
      </span>
      <p
        className={`mt-3 font-sans text-3xl font-extralight leading-none ${color}`}
        style={{ textShadow: "0 0 14px currentColor" }}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-2 font-serif text-[12px] italic text-white/45">
          {sub}
        </p>
      )}
    </div>
  );
}

type RecentRow = {
  id: string;
  href: string;
  number: string;
  client: string;
  total: number;
  statusLabel: string;
  statusTone: "info" | "neutral" | "warning" | "success" | "danger";
  issuedAt: string;
};

function RecentPanel({
  title,
  href,
  rows,
}: {
  title: string;
  href: string;
  rows: RecentRow[];
}) {
  return (
    <div className="relative border border-cyan-200/15 bg-cyan-200/[0.018] px-5 py-5">
      <span
        aria-hidden
        className="absolute left-0 top-0 h-2 w-2 border-l border-t border-cyan-200/55"
      />
      <span
        aria-hidden
        className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-cyan-200/55"
      />
      <div className="mb-4 flex items-center justify-between border-b border-cyan-200/15 pb-3">
        <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/75">
          {title}
        </span>
        <Link
          href={href}
          className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/55 hover:text-cyan-100"
        >
          Voir tout →
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="font-serif text-sm italic text-white/45">Aucun.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={r.href}
                className="group flex items-center justify-between gap-3 border-b border-cyan-200/10 py-2 last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-mono text-[11px] text-cyan-200/65">
                    {r.number} · {DATE.format(new Date(r.issuedAt))}
                  </span>
                  <span className="truncate text-sm text-[#F5F5F7] group-hover:text-cyan-100">
                    {r.client}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="font-mono text-sm text-[#F5F5F7]">
                    {formatEuro(r.total)}
                  </span>
                  <StatusBadge tone={r.statusTone}>{r.statusLabel}</StatusBadge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
