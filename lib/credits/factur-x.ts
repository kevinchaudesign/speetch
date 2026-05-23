/**
 * Génération du XML Factur-X (profil BASIC, conforme EN 16931).
 *
 * Standard : CII (Cross-Industry Invoice UN/CEFACT), version 1.0.
 * Profile  : urn:factur-x.eu:1p0:basic — inclut les lignes (vs MINIMUM
 *            qui ne porte que l'en-tête). Suffisant pour Chorus Pro et
 *            la grande majorité des PDP français.
 *
 * Ce module produit UNIQUEMENT le XML. Le wrapper PDF/A-3 avec XML
 * embarqué (Factur-X complet) viendra dans une 2e phase si on choisit
 * d'installer puppeteer ou pdf-lib. Le XML seul reste recevable par
 * les PDP qui acceptent les formats CII purs.
 *
 * Le XML est strictement validé côté schéma par les PDP — pour rester
 * conforme on respecte l'ordre des éléments et la cardinalité du
 * profil BASIC.
 */

import type { EmitterSettingsRow, InvoiceRow } from "./types";

/* ─── Helpers ─────────────────────────────────────────────────────── */

/** Échappe les caractères XML dans un texte. */
function xml(s: string | null | undefined): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Date ISO yyyy-mm-dd → format CII "102" : AAAAMMJJ. */
function dateToCii(iso: string): string {
  const d = iso.slice(0, 10).replace(/-/g, "");
  if (!/^\d{8}$/.test(d)) {
    throw new Error(`Date invalide pour Factur-X : ${iso}`);
  }
  return d;
}

/** Montant numérique → string à 2 décimales (point décimal). */
function amount(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/** Quantité numérique → string à 4 décimales max (point décimal). */
function quantity(n: number): string {
  return (Math.round(n * 10000) / 10000).toString();
}

/**
 * Code catégorie TVA UNTDID 5305 :
 *  - S = Standard rate
 *  - Z = Zero rated
 *  - E = Exempt (franchise en base)
 *  - AE = VAT Reverse Charge (autoliquidation, B2B intra-UE)
 *  - K = VAT exempt for EEA intra-community supply
 *  - G = Free export item (export hors UE)
 */
function vatCategoryCode(
  vatExempt: boolean,
  vatRate: number,
  operationType: string | null,
): "S" | "Z" | "E" | "AE" | "K" | "G" {
  if (vatExempt) return "E";
  if (vatRate === 0) {
    if (operationType === "intra_eu") return "K";
    if (operationType === "export") return "G";
    if (operationType === "B2B") return "AE";
    return "Z";
  }
  return "S";
}

/** Motif d'exemption TVA (BT-121 du standard EN 16931). */
function vatExemptionReason(
  cat: ReturnType<typeof vatCategoryCode>,
  customMention: string | null,
): { code: string | null; text: string | null } {
  switch (cat) {
    case "E":
      return {
        code: "VATEX-EU-FR-FRANCHISE",
        text: customMention ?? "TVA non applicable, art. 293 B du CGI",
      };
    case "AE":
      return { code: "VATEX-EU-AE", text: "Autoliquidation par le preneur" };
    case "K":
      return { code: "VATEX-EU-IC", text: "Livraison intracommunautaire" };
    case "G":
      return { code: "VATEX-EU-G", text: "Exportation hors UE" };
    default:
      return { code: null, text: null };
  }
}

/* ─── Generator ──────────────────────────────────────────────────── */

/**
 * Construit le XML Factur-X BASIC pour une facture. Renvoie une chaîne
 * UTF-8 prête à être servie en download ou attachée à un email.
 *
 * Le n° de facture, la date, le SIREN émetteur, le SIREN destinataire
 * (si B2B), les montants ventilés par taux TVA et les lignes sont
 * obligatoires. Tout le reste est optionnel mais recommandé.
 */
export function buildFacturXXml(
  invoice: InvoiceRow,
  emitter: EmitterSettingsRow,
): string {
  // Validations préalables
  if (!emitter.legal_name) {
    throw new Error("Émetteur sans raison sociale — impossible de générer Factur-X.");
  }
  if (!emitter.siren) {
    throw new Error("SIREN émetteur manquant — exigé par Factur-X.");
  }
  if (!invoice.lines || invoice.lines.length === 0) {
    throw new Error("Facture sans lignes — au moins 1 ligne requise.");
  }

  const opType = invoice.operation_type ?? "B2B";
  const ventilation = computeVentilation(invoice);

  // Lignes (IncludedSupplyChainTradeLineItem)
  const lineItems = invoice.lines
    .map((l, idx) => {
      const lineTotal = Math.round(l.quantity * l.unit_price_ht * 100) / 100;
      const cat = vatCategoryCode(
        invoice.vat_exempt,
        invoice.vat_exempt ? 0 : l.vat_rate,
        opType,
      );
      const rate = invoice.vat_exempt ? 0 : l.vat_rate;
      return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${idx + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${xml(l.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${amount(l.unit_price_ht)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${quantity(l.quantity)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${cat}</ram:CategoryCode>
          <ram:RateApplicablePercent>${amount(rate)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${amount(lineTotal)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
    })
    .join("");

  // Ventilation TVA par taux (ApplicableTradeTax au niveau settlement)
  const taxBreakdown = ventilation
    .map((v) => {
      const exemption = vatExemptionReason(
        v.cat,
        invoice.vat_exempt_mention ?? null,
      );
      const exemptionTags = exemption.code
        ? `
        <ram:ExemptionReason>${xml(exemption.text ?? "")}</ram:ExemptionReason>
        <ram:ExemptionReasonCode>${xml(exemption.code)}</ram:ExemptionReasonCode>`
        : "";
      return `
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${amount(v.taxAmount)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>${exemptionTags}
        <ram:BasisAmount>${amount(v.baseAmount)}</ram:BasisAmount>
        <ram:CategoryCode>${v.cat}</ram:CategoryCode>
        <ram:RateApplicablePercent>${amount(v.rate)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`;
    })
    .join("");

  // Coordonnées bancaires (mode virement)
  const paymentMeans = emitter.iban
    ? `
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${xml(emitter.iban)}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
        ${
          emitter.bic
            ? `<ram:PayeeSpecifiedCreditorFinancialInstitution>
          <ram:BICID>${xml(emitter.bic)}</ram:BICID>
        </ram:PayeeSpecifiedCreditorFinancialInstitution>`
            : ""
        }
      </ram:SpecifiedTradeSettlementPaymentMeans>`
    : "";

  // Échéance de paiement
  const paymentTerms = invoice.due_at
    ? `
      <ram:SpecifiedTradePaymentTerms>
        ${invoice.payment_terms ? `<ram:Description>${xml(invoice.payment_terms)}</ram:Description>` : ""}
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${dateToCii(invoice.due_at)}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>`
    : "";

  // Adresse émetteur
  const sellerAddress = `
        <ram:PostalTradeAddress>
          ${emitter.postal_code ? `<ram:PostcodeCode>${xml(emitter.postal_code)}</ram:PostcodeCode>` : ""}
          ${emitter.address_line1 ? `<ram:LineOne>${xml(emitter.address_line1)}</ram:LineOne>` : ""}
          ${emitter.address_line2 ? `<ram:LineTwo>${xml(emitter.address_line2)}</ram:LineTwo>` : ""}
          ${emitter.city ? `<ram:CityName>${xml(emitter.city)}</ram:CityName>` : ""}
          <ram:CountryID>${countryCode(emitter.country)}</ram:CountryID>
        </ram:PostalTradeAddress>`;

  // Adresse acheteur
  const buyerAddress = `
        <ram:PostalTradeAddress>
          ${invoice.client_postal_code ? `<ram:PostcodeCode>${xml(invoice.client_postal_code)}</ram:PostcodeCode>` : ""}
          ${invoice.client_address ? `<ram:LineOne>${xml(invoice.client_address)}</ram:LineOne>` : ""}
          ${invoice.client_city ? `<ram:CityName>${xml(invoice.client_city)}</ram:CityName>` : ""}
          <ram:CountryID>${countryCode(invoice.client_country)}</ram:CountryID>
        </ram:PostalTradeAddress>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${xml(invoice.number)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${dateToCii(invoice.issued_at)}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>${lineItems}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${xml(emitter.legal_name)}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${xml(emitter.siren)}</ram:ID>
        </ram:SpecifiedLegalOrganization>${sellerAddress}
        ${
          emitter.vat_number && !emitter.vat_exempt
            ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${xml(emitter.vat_number)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
            : ""
        }
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${xml(invoice.client_company || invoice.client_name)}</ram:Name>
        ${
          invoice.client_siren
            ? `<ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${xml(invoice.client_siren)}</ram:ID>
        </ram:SpecifiedLegalOrganization>`
            : ""
        }${buyerAddress}
        ${
          invoice.client_vat_number
            ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${xml(invoice.client_vat_number)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
            : ""
        }
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${dateToCii(invoice.issued_at)}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>${paymentMeans}${taxBreakdown}${paymentTerms}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${amount(Number(invoice.subtotal_ht))}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${amount(Number(invoice.subtotal_ht))}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${amount(Number(invoice.tax_total))}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${amount(Number(invoice.total_ttc))}</ram:GrandTotalAmount>
        <ram:TotalPrepaidAmount>${amount(Number(invoice.paid_amount))}</ram:TotalPrepaidAmount>
        <ram:DuePayableAmount>${amount(Math.max(0, Number(invoice.total_ttc) - Number(invoice.paid_amount)))}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}

type Ventilation = Array<{
  rate: number;
  baseAmount: number;
  taxAmount: number;
  cat: "S" | "Z" | "E" | "AE" | "K" | "G";
}>;

function computeVentilation(invoice: InvoiceRow): Ventilation {
  const map = new Map<
    number,
    {
      baseAmount: number;
      taxAmount: number;
      cat: "S" | "Z" | "E" | "AE" | "K" | "G";
    }
  >();
  for (const l of invoice.lines) {
    const rate = invoice.vat_exempt ? 0 : l.vat_rate;
    const base = Math.round(l.quantity * l.unit_price_ht * 100) / 100;
    const tax = Math.round(base * (rate / 100) * 100) / 100;
    const cat = vatCategoryCode(
      invoice.vat_exempt,
      rate,
      invoice.operation_type ?? "B2B",
    );
    const prev = map.get(rate) ?? { baseAmount: 0, taxAmount: 0, cat };
    map.set(rate, {
      baseAmount: prev.baseAmount + base,
      taxAmount: prev.taxAmount + tax,
      cat,
    });
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([rate, v]) => ({
      rate,
      baseAmount: v.baseAmount,
      taxAmount: v.taxAmount,
      cat: v.cat,
    }));
}

/** Codes ISO 3166-1 alpha-2 pour les pays courants. */
function countryCode(country: string | null | undefined): string {
  if (!country) return "FR";
  const c = country.trim().toLowerCase();
  if (c === "france" || c === "fr") return "FR";
  if (c === "belgique" || c === "belgium" || c === "be") return "BE";
  if (c === "luxembourg" || c === "lu") return "LU";
  if (c === "suisse" || c === "switzerland" || c === "ch") return "CH";
  if (c === "allemagne" || c === "germany" || c === "de") return "DE";
  if (c === "italie" || c === "italy" || c === "it") return "IT";
  if (c === "espagne" || c === "spain" || c === "es") return "ES";
  if (c === "royaume-uni" || c === "uk" || c === "united kingdom" || c === "gb") return "GB";
  if (c === "états-unis" || c === "united states" || c === "us" || c === "usa") return "US";
  if (c === "canada" || c === "ca") return "CA";
  // Fallback : on prend les 2 premières lettres en majuscules
  return country.trim().slice(0, 2).toUpperCase();
}

/** Nom de fichier suggéré pour le XML (cohérent avec l'usage Factur-X). */
export function facturXFilename(invoiceNumber: string): string {
  // Spec : "factur-x.xml" si embarqué dans le PDF, libre si standalone.
  // On préfixe avec le n° pour faciliter le tri côté client.
  return `${invoiceNumber}-factur-x.xml`;
}
