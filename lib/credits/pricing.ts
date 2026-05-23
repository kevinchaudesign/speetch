/**
 * Helpers de calcul de prix pour devis / factures.
 *
 * Tous les calculs sont en number (euros, 2 décimales). On arrondit à
 * la 2e décimale à chaque étape pour rester cohérent avec ce qui sera
 * stocké en BDD (NUMERIC(12,2)) et avec ce que le client verra sur la
 * pièce imprimée.
 *
 * Si vat_exempt = true, on force vat_rate = 0 sur toutes les lignes
 * au moment du calcul (mais on ne mute pas l'input — le caller décide
 * comment normaliser).
 */

import type { CreditLine } from "./types";

export type Totals = {
  subtotal_ht: number;
  tax_total: number;
  total_ttc: number;
  /** Sous-total par taux de TVA — utile pour le pied de facture. */
  tax_breakdown: Array<{ rate: number; base_ht: number; tax: number }>;
};

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function lineTotal(line: CreditLine): {
  total_ht: number;
  tax: number;
  total_ttc: number;
} {
  const total_ht = r2(line.quantity * line.unit_price_ht);
  const tax = r2(total_ht * (line.vat_rate / 100));
  const total_ttc = r2(total_ht + tax);
  return { total_ht, tax, total_ttc };
}

export function computeTotals(
  lines: CreditLine[],
  opts: { vatExempt: boolean },
): Totals {
  let subtotal_ht = 0;
  let tax_total = 0;

  const byRate = new Map<number, { base_ht: number; tax: number }>();

  for (const raw of lines) {
    const effective: CreditLine = {
      ...raw,
      vat_rate: opts.vatExempt ? 0 : raw.vat_rate,
    };
    const { total_ht, tax } = lineTotal(effective);
    subtotal_ht += total_ht;
    tax_total += tax;
    const k = effective.vat_rate;
    const prev = byRate.get(k) ?? { base_ht: 0, tax: 0 };
    byRate.set(k, {
      base_ht: prev.base_ht + total_ht,
      tax: prev.tax + tax,
    });
  }

  const subtotal_r = r2(subtotal_ht);
  const tax_r = r2(tax_total);
  const ttc_r = r2(subtotal_r + tax_r);

  const breakdown = Array.from(byRate.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([rate, agg]) => ({
      rate,
      base_ht: r2(agg.base_ht),
      tax: r2(agg.tax),
    }));

  return {
    subtotal_ht: subtotal_r,
    tax_total: tax_r,
    total_ttc: ttc_r,
    tax_breakdown: breakdown,
  };
}

const EURO = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEuro(n: number): string {
  return EURO.format(n);
}

/**
 * Parse une ligne posée en formulaire (chaînes / chaînes vides) en
 * `CreditLine` valide. Renvoie null si la ligne est totalement vide
 * (à filtrer côté caller).
 */
export function parseLine(input: Record<string, unknown>): CreditLine | null {
  const description = String(input.description ?? "").trim();
  const qtyStr = String(input.quantity ?? "").replace(",", ".").trim();
  const priceStr = String(input.unit_price_ht ?? "").replace(",", ".").trim();
  const rateStr = String(input.vat_rate ?? "").replace(",", ".").trim();

  const quantity = qtyStr ? Number(qtyStr) : 0;
  const unit_price_ht = priceStr ? Number(priceStr) : 0;
  const vat_rate = rateStr ? Number(rateStr) : 0;

  // Ligne totalement vide → on l'ignore
  if (!description && quantity === 0 && unit_price_ht === 0) return null;

  return {
    description,
    quantity: Number.isFinite(quantity) ? quantity : 0,
    unit_price_ht: Number.isFinite(unit_price_ht) ? unit_price_ht : 0,
    vat_rate: Number.isFinite(vat_rate) ? vat_rate : 0,
  };
}
