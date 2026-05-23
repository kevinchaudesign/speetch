import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button, StatusBadge } from "@/lib/ds";
import { loadEmitterSettings } from "@/lib/credits/emitter";
import { formatEuro } from "@/lib/credits/pricing";
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  isInvoiceStatus,
  type InvoiceRow,
} from "@/lib/credits/types";
import { InvoiceForm } from "../_components/invoice-form";
import { InvoiceActionsBar } from "./invoice-actions-bar";

export const metadata: Metadata = {
  title: "Facture",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InvoiceDetailPage({
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
  if (!user) redirect(`/login?redirect=/admin/credits/factures/${id}`);

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const [{ data: invoice }, { data: holocrons }, emitter] = await Promise.all([
    admin
      .from("credit_invoices" as never)
      .select("*")
      .eq("id", id)
      .maybeSingle<InvoiceRow>(),
    admin
      .from("profiles")
      .select("id, full_name, client_email")
      .eq("is_owner", false)
      .order("full_name", { ascending: true }),
    loadEmitterSettings(),
  ]);

  if (!invoice) notFound();

  const status = isInvoiceStatus(invoice.status) ? invoice.status : "draft";

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
          <span className="text-cyan-200/85 font-mono">{invoice.number}</span>
        </p>

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex flex-col gap-3">
            <StatusBadge tone={INVOICE_STATUS_TONE[status]}>
              {INVOICE_STATUS_LABEL[status]}
            </StatusBadge>
            <h1
              className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              <span className="font-mono text-cyan-100/85">{invoice.number}</span>
            </h1>
            <p className="font-serif text-base italic text-white/65">
              {invoice.client_name}
              {invoice.client_company && (
                <span className="ml-2 text-white/40">· {invoice.client_company}</span>
              )}
              {" — "}
              <span className="text-cyan-200/85 font-mono not-italic">
                {formatEuro(Number(invoice.total_ttc))}
              </span>
              {Number(invoice.paid_amount) > 0 && (
                <>
                  <span className="ml-2 text-emerald-300/85 font-mono not-italic">
                    · {formatEuro(Number(invoice.paid_amount))} encaissés
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Button
              href={`/admin/credits/print/invoice/${invoice.id}`}
              target="_blank"
              variant="primary"
            >
              Aperçu imprimable ↗
            </Button>
            <a
              href={`/admin/credits/factures/${invoice.id}/factur-x`}
              className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-200/70 transition-colors hover:text-cyan-100"
              title="XML CII conforme EN 16931, prêt pour Chorus Pro / PDP"
            >
              Télécharger Factur-X XML
              <span className="inline-block h-px w-4 bg-current transition-all duration-500 ease-out hover:w-10" />
            </a>
          </div>
        </div>

        <InvoiceActionsBar
          invoiceId={invoice.id}
          invoiceNumber={invoice.number}
          clientName={invoice.client_name}
          clientEmail={invoice.client_email ?? ""}
          subtotalHt={Number(invoice.subtotal_ht)}
          taxTotal={Number(invoice.tax_total)}
          totalTtc={Number(invoice.total_ttc)}
          status={status}
        />

        <InvoiceForm
          mode="edit"
          initial={invoice}
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
          href="/admin/credits/factures"
          className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 hover:text-cyan-100"
        >
          ← Retour aux factures
        </Link>
      </section>
    </div>
  );
}
