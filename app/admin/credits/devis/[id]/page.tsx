import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button, StatusBadge } from "@/lib/ds";
import { loadEmitterSettings } from "@/lib/credits/emitter";
import { formatEuro } from "@/lib/credits/pricing";
import {
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_TONE,
  isQuoteStatus,
  type QuoteRow,
} from "@/lib/credits/types";
import { QuoteForm } from "../_components/quote-form";
import { QuoteActionsBar } from "./quote-actions-bar";

export const metadata: Metadata = {
  title: "Devis",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function QuoteDetailPage({
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
  if (!user) redirect(`/login?redirect=/admin/credits/devis/${id}`);

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const [{ data: quote }, { data: holocrons }, emitter] = await Promise.all([
    admin
      .from("credit_quotes" as never)
      .select("*")
      .eq("id", id)
      .maybeSingle<QuoteRow>(),
    admin
      .from("profiles")
      .select("id, full_name, client_email")
      .eq("is_owner", false)
      .order("full_name", { ascending: true }),
    loadEmitterSettings(),
  ]);

  if (!quote) notFound();

  const status = isQuoteStatus(quote.status) ? quote.status : "draft";

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
          href="/admin/credits/devis"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 hover:text-cyan-100"
        >
          ← Devis
        </Link>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-start gap-10 pt-20 md:pt-12">
        <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
          <Link href="/admin/credits" className="transition-colors hover:text-cyan-100">
            Crédits
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <Link
            href="/admin/credits/devis"
            className="transition-colors hover:text-cyan-100"
          >
            Devis
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <span className="text-cyan-200/85 font-mono">{quote.number}</span>
        </p>

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex flex-col gap-3">
            <StatusBadge tone={QUOTE_STATUS_TONE[status]}>
              {QUOTE_STATUS_LABEL[status]}
            </StatusBadge>
            <h1
              className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              <span className="font-mono text-cyan-100/85">{quote.number}</span>
            </h1>
            <p className="font-serif text-base italic text-white/65">
              {quote.client_name}
              {quote.client_company && (
                <span className="ml-2 text-white/40">· {quote.client_company}</span>
              )}
              {" — "}
              <span className="text-cyan-200/85 font-mono not-italic">
                {formatEuro(Number(quote.total_ttc))}
              </span>
            </p>
          </div>
          <Button
            href={`/admin/credits/print/quote/${quote.id}`}
            target="_blank"
            variant="primary"
          >
            Aperçu imprimable ↗
          </Button>
        </div>

        <QuoteActionsBar
          quoteId={quote.id}
          quoteNumber={quote.number}
          clientName={quote.client_name}
          clientEmail={quote.client_email ?? ""}
          status={status}
        />

        <QuoteForm
          mode="edit"
          initial={quote}
          holocrons={
            holocrons?.map((h) => ({
              id: h.id,
              full_name: h.full_name ?? "Sans nom",
              client_email: h.client_email ?? null,
            })) ?? []
          }
          defaultPaymentTerms={
            emitter?.default_payment_terms ?? "30 jours fin de mois"
          }
          vatExempt={emitter?.vat_exempt ?? true}
        />

        <Link
          href="/admin/credits/devis"
          className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 hover:text-cyan-100"
        >
          ← Retour aux devis
        </Link>
      </section>
    </div>
  );
}
