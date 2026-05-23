/**
 * Types partagés du domaine Crédits (devis / factures / avoirs).
 *
 * Garde aussi les labels FR et les "tones" du DS pour les badges. La
 * source de vérité des status vit ici — n'importe quelle page admin
 * qui affiche un status doit passer par ces helpers (pas de chaîne en
 * dur dans les vues).
 */

export type CreditLine = {
  description: string;
  /** Quantité (peut être décimale : 0.5 jour, 2.5 h). */
  quantity: number;
  /** Prix unitaire HT en euros. */
  unit_price_ht: number;
  /** Taux de TVA en % (0, 5.5, 10, 20). 0 si vat_exempt. */
  vat_rate: number;
};

export const VAT_RATES = [0, 5.5, 10, 20] as const;
export type VatRate = (typeof VAT_RATES)[number];

/* ─── DEVIS ───────────────────────────────────────────────────────── */

export const QUOTE_STATUS_VALUES = [
  "draft",
  "sent",
  "accepted",
  "refused",
  "expired",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUS_VALUES)[number];

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  refused: "Refusé",
  expired: "Expiré",
};

export const QUOTE_STATUS_TONE: Record<
  QuoteStatus,
  "info" | "neutral" | "warning" | "success" | "danger"
> = {
  draft: "neutral",
  sent: "info",
  accepted: "success",
  refused: "danger",
  expired: "warning",
};

export function isQuoteStatus(v: string): v is QuoteStatus {
  return (QUOTE_STATUS_VALUES as readonly string[]).includes(v);
}

/* ─── FACTURES ────────────────────────────────────────────────────── */

export const INVOICE_STATUS_VALUES = [
  "draft",
  "sent",
  "paid",
  "partial",
  "overdue",
  "canceled",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUS_VALUES)[number];

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  sent: "Émise",
  paid: "Encaissée",
  partial: "Partiel",
  overdue: "En retard",
  canceled: "Annulée",
};

export const INVOICE_STATUS_TONE: Record<
  InvoiceStatus,
  "info" | "neutral" | "warning" | "success" | "danger"
> = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  partial: "warning",
  overdue: "danger",
  canceled: "neutral",
};

export function isInvoiceStatus(v: string): v is InvoiceStatus {
  return (INVOICE_STATUS_VALUES as readonly string[]).includes(v);
}

/* ─── Réforme facturation électronique ────────────────────────────── */

export const OPERATION_TYPE_VALUES = [
  "B2B",
  "B2C",
  "B2G",
  "export",
  "intra_eu",
] as const;
export type OperationType = (typeof OPERATION_TYPE_VALUES)[number];

export const OPERATION_TYPE_LABEL: Record<OperationType, string> = {
  B2B: "B2B (entreprise)",
  B2C: "B2C (particulier)",
  B2G: "B2G (administration)",
  export: "Export hors UE",
  intra_eu: "Intra-UE",
};

export const OPERATION_NATURE_VALUES = ["goods", "services", "mixed"] as const;
export type OperationNature = (typeof OPERATION_NATURE_VALUES)[number];

export const OPERATION_NATURE_LABEL: Record<OperationNature, string> = {
  goods: "Livraison de biens",
  services: "Prestation de services",
  mixed: "Mixte",
};

export const PAYMENT_METHOD_VALUES = [
  "transfer",
  "card",
  "check",
  "cash",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  transfer: "Virement",
  card: "Carte",
  check: "Chèque",
  cash: "Espèces",
  other: "Autre",
};

/* ─── Rows BDD ────────────────────────────────────────────────────── */

export type QuoteRow = {
  id: string;
  number: string;
  profile_id: string | null;
  status: string;
  issued_at: string;
  valid_until: string | null;
  client_name: string;
  client_company: string | null;
  client_address: string | null;
  client_postal_code: string | null;
  client_city: string | null;
  client_country: string | null;
  client_siren: string | null;
  client_vat_number: string | null;
  client_email: string | null;
  lines: CreditLine[];
  subtotal_ht: number;
  tax_total: number;
  total_ttc: number;
  vat_exempt: boolean;
  vat_exempt_mention: string | null;
  payment_terms: string | null;
  notes: string | null;
  intro: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  refused_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceRow = {
  id: string;
  number: string;
  quote_id: string | null;
  profile_id: string | null;
  status: string;
  issued_at: string;
  due_at: string | null;
  client_name: string;
  client_company: string | null;
  client_address: string | null;
  client_postal_code: string | null;
  client_city: string | null;
  client_country: string | null;
  client_siren: string | null;
  client_vat_number: string | null;
  client_email: string | null;
  lines: CreditLine[];
  subtotal_ht: number;
  tax_total: number;
  total_ttc: number;
  vat_exempt: boolean;
  vat_exempt_mention: string | null;
  payment_terms: string | null;
  payment_method: string | null;
  paid_amount: number;
  paid_at: string | null;
  notes: string | null;
  intro: string | null;
  sent_at: string | null;
  lifecycle_status: string | null;
  operation_type: string | null;
  operation_nature: string | null;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
};

export type EmitterSettingsRow = {
  id: string;
  legal_name: string | null;
  legal_form: string | null;
  siren: string | null;
  siret: string | null;
  vat_number: string | null;
  vat_exempt: boolean;
  vat_exempt_mention: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  iban: string | null;
  bic: string | null;
  bank_name: string | null;
  default_payment_terms: string | null;
  late_payment_rate: string | null;
  recovery_indemnity: number | null;
  legal_mentions: string | null;
  pdp_provider: string | null;
  pdp_id: string | null;
  quote_prefix: string | null;
  invoice_prefix: string | null;
  credit_note_prefix: string | null;
  logo_url: string | null;
  updated_at: string;
};
