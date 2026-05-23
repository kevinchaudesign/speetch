import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button, StatusBadge } from "@/lib/ds";
import { formatEuro } from "@/lib/credits/pricing";
import {
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_TONE,
  isQuoteStatus,
} from "@/lib/credits/types";
import { CreditsSubnav } from "../_components/credits-subnav";

export const metadata: Metadata = {
  title: "Devis",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type QuoteRow = {
  id: string;
  number: string;
  status: string;
  issued_at: string;
  valid_until: string | null;
  client_name: string;
  client_company: string | null;
  total_ttc: number;
};

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function QuotesListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/credits/devis");

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("credit_quotes" as never)
    .select(
      "id, number, status, issued_at, valid_until, client_name, client_company, total_ttc",
    )
    .order("issued_at", { ascending: false })
    .returns<QuoteRow[]>();

  const quotes = data ?? [];

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
          Devis
        </span>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-12 pt-24 md:pt-20">
        <div className="flex flex-col gap-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            <Link href="/admin" className="transition-colors hover:text-cyan-100">
              Conseil Jedi
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <Link href="/admin/credits" className="transition-colors hover:text-cyan-100">
              Crédits
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/85">Devis</span>
          </p>

          <CreditsSubnav />

          <div className="flex flex-wrap items-end justify-between gap-6">
            <h1
              className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
            >
              Les{" "}
              <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
                Devis
              </span>
            </h1>
            <Button href="/admin/credits/devis/new" variant="return">
              Émettre un devis
            </Button>
          </div>
        </div>

        {quotes.length === 0 ? (
          <EmptyState />
        ) : (
          <QuotesTable rows={quotes} />
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative flex flex-col items-start gap-8 pt-16">
      <div aria-hidden className="sw-hologram-line absolute inset-x-0 top-0" />
      <p className="max-w-md text-balance font-serif text-base italic text-white/55 md:text-lg">
        Aucun devis émis pour le moment. Le premier établira la trame
        de la flotte commerciale.
      </p>
      <Button href="/admin/credits/devis/new" variant="large">
        Émettre le premier devis
      </Button>
    </div>
  );
}

function QuotesTable({ rows }: { rows: QuoteRow[] }) {
  return (
    <div className="overflow-hidden border border-cyan-200/15 bg-cyan-200/[0.015]">
      <div className="hidden grid-cols-[1.2fr_2fr_1fr_1fr_auto] items-center gap-4 border-b border-cyan-200/15 px-5 py-4 text-[10px] uppercase tracking-[0.32em] text-cyan-200/55 md:grid">
        <span>Numéro</span>
        <span>Client</span>
        <span>Statut</span>
        <span className="text-right">Total TTC</span>
        <span className="text-right">Émission</span>
      </div>
      <ul className="divide-y divide-cyan-200/10">
        {rows.map((q) => {
          const status = isQuoteStatus(q.status) ? q.status : "draft";
          return (
            <li key={q.id}>
              <Link
                href={`/admin/credits/devis/${q.id}`}
                className="group grid grid-cols-1 gap-2 px-5 py-5 transition-colors hover:bg-cyan-200/[0.04] md:grid-cols-[1.2fr_2fr_1fr_1fr_auto] md:items-center md:gap-4 md:py-4"
              >
                <span className="font-mono text-sm text-cyan-100/85">
                  {q.number}
                </span>
                <span className="font-sans text-base font-light text-[#F5F5F7] transition-colors group-hover:text-cyan-100">
                  {q.client_name}
                  {q.client_company && (
                    <span className="ml-2 text-white/45">· {q.client_company}</span>
                  )}
                </span>
                <span>
                  <StatusBadge tone={QUOTE_STATUS_TONE[status]}>
                    {QUOTE_STATUS_LABEL[status]}
                  </StatusBadge>
                </span>
                <span className="text-right font-mono text-sm text-[#F5F5F7]">
                  {formatEuro(Number(q.total_ttc))}
                </span>
                <span className="text-right font-mono text-[11px] text-white/35">
                  {DATE.format(new Date(q.issued_at))}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
