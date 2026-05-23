import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { loadEmitterSettings } from "@/lib/credits/emitter";
import { computeTotals, formatEuro } from "@/lib/credits/pricing";
import {
  OPERATION_NATURE_LABEL,
  OPERATION_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  type InvoiceRow,
  type QuoteRow,
} from "@/lib/credits/types";
import { verifyCreditToken } from "@/lib/credits/public-token";
import { PublicPrintButton } from "./public-print-button";

export const metadata: Metadata = {
  title: "Document",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/**
 * Accès public d'un devis/facture/avoir via lien signé HMAC.
 * Pas de protection par auth admin — le token suffit. Expiration
 * intégrée au token (90 jours par défaut).
 *
 * Si le token est invalide / expiré → page d'erreur dédiée (pas 404
 * pour éviter de faire croire que la pièce n'existe pas — c'est juste
 * le lien qui est mort).
 */
export default async function PublicCreditPage({
  params,
}: {
  params: Promise<{ type: string; id: string; token: string }>;
}) {
  const { type, id, token } = await params;

  if (type !== "quote" && type !== "invoice" && type !== "credit_note") {
    notFound();
  }

  const v = verifyCreditToken(token, type, id);
  if (!v.ok) {
    return <ExpiredLinkScreen reason={v.error} />;
  }

  const admin = createAdminClient();
  const emitter = await loadEmitterSettings();
  if (!emitter) notFound();

  const tableName =
    type === "invoice" ? "credit_invoices" : "credit_quotes";

  if (type === "credit_note") {
    // v1 : on n'expose pas encore les avoirs en public (rare cas d'usage).
    notFound();
  }

  const { data: piece } =
    type === "invoice"
      ? await admin
          .from(tableName as never)
          .select("*")
          .eq("id", id)
          .maybeSingle<InvoiceRow>()
      : await admin
          .from(tableName as never)
          .select("*")
          .eq("id", id)
          .maybeSingle<QuoteRow>();

  if (!piece) notFound();

  const isInvoice = type === "invoice";
  const totals = computeTotals(piece.lines, { vatExempt: piece.vat_exempt });
  const invoice = isInvoice ? (piece as InvoiceRow) : null;
  const remainingDue = invoice
    ? Math.max(0, Number(invoice.total_ttc) - Number(invoice.paid_amount))
    : 0;

  return (
    <>
      <PublicPrintButton />

      <main className="print-doc mx-auto my-8 max-w-[210mm] bg-white p-12 text-[#1a1a1a] shadow-[0_0_60px_-20px_rgba(0,0,0,0.6)] print:my-0 print:max-w-none print:p-12 print:shadow-none">
        <header className="flex items-start justify-between gap-12 border-b border-neutral-300 pb-8">
          <div className="flex flex-col gap-1 text-[11px] leading-snug text-neutral-700">
            <p className="mb-2 font-sans text-xl font-light tracking-tight text-neutral-900">
              {emitter.legal_name}
            </p>
            {emitter.legal_form && <p>{emitter.legal_form}</p>}
            {emitter.address_line1 && <p>{emitter.address_line1}</p>}
            {emitter.address_line2 && <p>{emitter.address_line2}</p>}
            {(emitter.postal_code || emitter.city) && (
              <p>
                {emitter.postal_code} {emitter.city}
                {emitter.country && `, ${emitter.country}`}
              </p>
            )}
            {emitter.siren && <p className="mt-2">SIREN : {emitter.siren}</p>}
            {emitter.siret && <p>SIRET : {emitter.siret}</p>}
            {emitter.vat_number && !emitter.vat_exempt && (
              <p>TVA intra : {emitter.vat_number}</p>
            )}
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.32em] text-neutral-500">
              {isInvoice ? "Facture" : "Devis"}
            </p>
            <p className="mt-1 font-mono text-2xl font-medium text-neutral-900">
              {piece.number}
            </p>
            <p className="mt-3 text-[11px] text-neutral-600">
              Émis le {DATE.format(new Date(piece.issued_at))}
            </p>
            {invoice && invoice.due_at && (
              <p className="text-[11px] text-neutral-600">
                Échéance : {DATE.format(new Date(invoice.due_at))}
              </p>
            )}
            {!invoice && (piece as QuoteRow).valid_until && (
              <p className="text-[11px] text-neutral-600">
                Valide jusqu&apos;au{" "}
                {DATE.format(new Date((piece as QuoteRow).valid_until as string))}
              </p>
            )}
          </div>
        </header>

        <section className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <p className="text-[9px] uppercase tracking-[0.32em] text-neutral-500">
              Destinataire
            </p>
            <p className="mt-2 font-sans text-lg font-light text-neutral-900">
              {piece.client_name}
            </p>
            {piece.client_company && (
              <p className="text-[12px] text-neutral-700">
                {piece.client_company}
              </p>
            )}
            {piece.client_address && (
              <p className="text-[12px] text-neutral-700">
                {piece.client_address}
              </p>
            )}
            {(piece.client_postal_code || piece.client_city) && (
              <p className="text-[12px] text-neutral-700">
                {piece.client_postal_code} {piece.client_city}
                {piece.client_country && `, ${piece.client_country}`}
              </p>
            )}
            {piece.client_siren && (
              <p className="mt-1 text-[11px] text-neutral-600">
                SIREN : {piece.client_siren}
              </p>
            )}
            {piece.client_vat_number && (
              <p className="text-[11px] text-neutral-600">
                TVA intra : {piece.client_vat_number}
              </p>
            )}
            {piece.client_email && (
              <p className="text-[11px] text-neutral-600">{piece.client_email}</p>
            )}
          </div>

          {invoice && (
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-[0.32em] text-neutral-500">
                Cadre opération
              </p>
              {invoice.operation_type && (
                <p className="mt-2 text-[12px] text-neutral-700">
                  {OPERATION_TYPE_LABEL[
                    invoice.operation_type as keyof typeof OPERATION_TYPE_LABEL
                  ] ?? invoice.operation_type}
                </p>
              )}
              {invoice.operation_nature && (
                <p className="text-[12px] text-neutral-700">
                  {OPERATION_NATURE_LABEL[
                    invoice.operation_nature as keyof typeof OPERATION_NATURE_LABEL
                  ] ?? invoice.operation_nature}
                </p>
              )}
              {invoice.delivery_address && (
                <p className="mt-2 text-[11px] text-neutral-600">
                  Livraison : {invoice.delivery_address}
                </p>
              )}
            </div>
          )}
        </section>

        {piece.intro && (
          <p className="mt-8 whitespace-pre-wrap font-serif text-[14px] italic leading-relaxed text-neutral-700">
            {piece.intro}
          </p>
        )}

        <table className="mt-8 w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b-2 border-neutral-800 text-left text-[10px] uppercase tracking-[0.18em] text-neutral-600">
              <th className="py-2 pr-3">Description</th>
              <th className="py-2 pr-3 text-right">Qté</th>
              <th className="py-2 pr-3 text-right">PU HT</th>
              {!piece.vat_exempt && (
                <th className="py-2 pr-3 text-right">TVA</th>
              )}
              <th className="py-2 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {piece.lines.map((l, i) => {
              const total_ht =
                Math.round(l.quantity * l.unit_price_ht * 100) / 100;
              return (
                <tr key={i} className="border-b border-neutral-200 align-top">
                  <td className="py-2.5 pr-3 text-neutral-900">
                    {l.description}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono text-neutral-700">
                    {l.quantity}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono text-neutral-700">
                    {formatEuro(l.unit_price_ht)}
                  </td>
                  {!piece.vat_exempt && (
                    <td className="py-2.5 pr-3 text-right font-mono text-neutral-700">
                      {l.vat_rate} %
                    </td>
                  )}
                  <td className="py-2.5 text-right font-mono text-neutral-900">
                    {formatEuro(total_ht)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-6 ml-auto w-full max-w-xs">
          <Row label="Sous-total HT" value={formatEuro(totals.subtotal_ht)} />
          {!piece.vat_exempt &&
            totals.tax_breakdown.map((b) => (
              <Row
                key={b.rate}
                label={`TVA ${b.rate} % sur ${formatEuro(b.base_ht)}`}
                value={formatEuro(b.tax)}
                muted
              />
            ))}
          {!piece.vat_exempt && (
            <Row label="Total TVA" value={formatEuro(totals.tax_total)} />
          )}
          <div className="mt-2 flex items-baseline justify-between border-t-2 border-neutral-800 pt-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-800">
              Total {piece.vat_exempt ? "" : "TTC"}
            </span>
            <span className="font-mono text-xl text-neutral-900">
              {formatEuro(totals.total_ttc)}
            </span>
          </div>
          {invoice && Number(invoice.paid_amount) > 0 && (
            <>
              <Row
                label="Déjà encaissé"
                value={`- ${formatEuro(Number(invoice.paid_amount))}`}
                muted
              />
              <Row label="Reste dû" value={formatEuro(remainingDue)} />
            </>
          )}
        </div>

        {piece.vat_exempt && piece.vat_exempt_mention && (
          <p className="mt-4 ml-auto w-full max-w-xs text-right text-[10px] italic text-neutral-600">
            {piece.vat_exempt_mention}
          </p>
        )}

        <footer className="mt-12 border-t border-neutral-300 pt-6 text-[10px] leading-relaxed text-neutral-600">
          {piece.payment_terms && (
            <p>
              <strong className="text-neutral-800">
                Conditions de paiement :
              </strong>{" "}
              {piece.payment_terms}
            </p>
          )}
          {invoice && invoice.payment_method && (
            <p>
              <strong className="text-neutral-800">Mode de règlement :</strong>{" "}
              {PAYMENT_METHOD_LABEL[
                invoice.payment_method as keyof typeof PAYMENT_METHOD_LABEL
              ] ?? invoice.payment_method}
            </p>
          )}
          {emitter.late_payment_rate && (
            <p>
              <strong className="text-neutral-800">
                Pénalités de retard :
              </strong>{" "}
              {emitter.late_payment_rate}.{" "}
              {emitter.recovery_indemnity != null && (
                <>
                  Indemnité forfaitaire de recouvrement :{" "}
                  {formatEuro(Number(emitter.recovery_indemnity))}.
                </>
              )}
            </p>
          )}
          {emitter.iban && (
            <p className="mt-2">
              <strong className="text-neutral-800">
                Règlement par virement :
              </strong>{" "}
              IBAN {emitter.iban}
              {emitter.bic && ` · BIC ${emitter.bic}`}
              {emitter.bank_name && ` · ${emitter.bank_name}`}
            </p>
          )}
          {emitter.legal_mentions && (
            <p className="mt-3 whitespace-pre-wrap">{emitter.legal_mentions}</p>
          )}
          {piece.notes && <p className="mt-3 italic">{piece.notes}</p>}
        </footer>
      </main>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { background: white !important; }
        }
        body { background: #2a2a2a; }
      `}</style>
    </>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between text-[11px] ${muted ? "text-neutral-500" : "text-neutral-800"}`}
    >
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function ExpiredLinkScreen({ reason }: { reason: string }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#0a0a0a] px-6 text-center">
      <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/55">
        Lien indisponible
      </p>
      <h1
        className="font-sans font-extralight leading-[0.9] tracking-[-0.04em] text-[#F5F5F7]"
        style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
      >
        Ce document n&apos;est plus accessible.
      </h1>
      <p className="max-w-md text-balance font-serif text-base italic text-white/55">
        {reason}. Demande à l&apos;émetteur de te générer un nouveau lien.
      </p>
    </main>
  );
}
