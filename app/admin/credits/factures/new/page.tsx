import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { loadEmitterSettings, isEmitterReady } from "@/lib/credits/emitter";
import type { InvoiceRow, QuoteRow } from "@/lib/credits/types";
import { InvoiceForm } from "../_components/invoice-form";

export const metadata: Metadata = {
  title: "Émettre une facture",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ from_quote?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/credits/factures/new");

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const emitter = await loadEmitterSettings();
  if (!isEmitterReady(emitter)) {
    redirect("/admin/settings/emitter");
  }

  const { from_quote } = await searchParams;
  const fromQuoteId =
    from_quote && UUID_REGEX.test(from_quote) ? from_quote : null;

  const admin = createAdminClient();

  // Récupération du devis source si on clone
  let snapshot: Partial<InvoiceRow> = {};
  if (fromQuoteId) {
    const { data: q } = await admin
      .from("credit_quotes" as never)
      .select("*")
      .eq("id", fromQuoteId)
      .maybeSingle<QuoteRow>();
    if (q) {
      snapshot = {
        profile_id: q.profile_id,
        client_name: q.client_name,
        client_company: q.client_company,
        client_address: q.client_address,
        client_postal_code: q.client_postal_code,
        client_city: q.client_city,
        client_country: q.client_country,
        client_siren: q.client_siren,
        client_vat_number: q.client_vat_number,
        client_email: q.client_email,
        intro: q.intro,
        notes: q.notes,
        payment_terms: q.payment_terms,
        lines: q.lines,
      };
    }
  }

  const { data: holocrons } = await admin
    .from("profiles")
    .select("id, full_name, client_email")
    .eq("is_owner", false)
    .order("full_name", { ascending: true });

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
          href="/admin/credits/factures"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 hover:text-cyan-100"
        >
          ← Factures
        </Link>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-start gap-10 pt-20 md:pt-12">
        <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
          <Link href="/admin/credits" className="transition-colors hover:text-cyan-100">
            Crédits
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <Link
            href="/admin/credits/factures"
            className="transition-colors hover:text-cyan-100"
          >
            Factures
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <span className="text-cyan-200/85">Émission</span>
        </p>

        <h1
          className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
        >
          Émettre une{" "}
          <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
            facture
          </span>
        </h1>

        {fromQuoteId && (
          <p className="border-l-2 border-cyan-300/60 bg-cyan-200/[0.04] px-4 py-3 text-[11px] uppercase tracking-[0.32em] text-cyan-200/85">
            Facture issue d&apos;un devis — pièces pré-remplies, à valider.
          </p>
        )}

        <InvoiceForm
          mode="create"
          fromQuote={
            fromQuoteId ? { quoteId: fromQuoteId, snapshot } : undefined
          }
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
      </section>
    </div>
  );
}
