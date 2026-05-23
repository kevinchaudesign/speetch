"use client";

import { useMemo, useState } from "react";
import { computeTotals, formatEuro, lineTotal } from "@/lib/credits/pricing";
import { VAT_RATES, type CreditLine } from "@/lib/credits/types";

/**
 * <LineItemsEditor> — éditeur des lignes d'un devis/facture. Stateful
 * côté client (UX live des totaux), serialise en JSON dans un champ
 * caché du form parent.
 *
 * Inputs visibles : description, quantité, prix HT, TVA. Total ligne
 * affiché à droite, recalculé live. Totaux pied (HT / TVA / TTC)
 * affichés au-dessous, recalculés live.
 *
 * `vatExempt` désactive la colonne TVA et force le calcul à 0 — la
 * mention "TVA non applicable" sera affichée par le parent.
 */

type Props = {
  /** Champ caché dans le form parent où on serialise le JSON. */
  name?: string;
  initial: CreditLine[];
  vatExempt: boolean;
};

const EMPTY: CreditLine = {
  description: "",
  quantity: 1,
  unit_price_ht: 0,
  vat_rate: 20,
};

export function LineItemsEditor({
  name = "lines_json",
  initial,
  vatExempt,
}: Props) {
  const [lines, setLines] = useState<CreditLine[]>(
    initial.length > 0 ? initial : [{ ...EMPTY }],
  );

  function patch(i: number, p: Partial<CreditLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...p } : l)));
  }

  function add() {
    setLines((prev) => [...prev, { ...EMPTY }]);
  }

  function remove(i: number) {
    setLines((prev) =>
      prev.length === 1 ? [{ ...EMPTY }] : prev.filter((_, idx) => idx !== i),
    );
  }

  const totals = useMemo(
    () => computeTotals(lines, { vatExempt }),
    [lines, vatExempt],
  );

  const json = useMemo(() => JSON.stringify(lines), [lines]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/75">
          Lignes
        </span>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          + Ajouter une ligne
        </button>
      </div>

      {/* Header desktop */}
      <div className="hidden grid-cols-[minmax(0,3fr)_70px_100px_80px_100px_24px] items-center gap-3 text-[9px] uppercase tracking-[0.28em] text-cyan-200/45 md:grid">
        <span>Description</span>
        <span className="text-right">Qté</span>
        <span className="text-right">PU HT</span>
        {!vatExempt ? <span className="text-right">TVA</span> : <span />}
        <span className="text-right">Total HT</span>
        <span />
      </div>

      <ul className="flex flex-col gap-2">
        {lines.map((l, i) => {
          const t = lineTotal({ ...l, vat_rate: vatExempt ? 0 : l.vat_rate });
          return (
            <li
              key={i}
              className="grid grid-cols-1 gap-2 border-b border-cyan-200/10 pb-3 last:border-b-0 md:grid-cols-[minmax(0,3fr)_70px_100px_80px_100px_24px] md:items-center md:gap-3 md:pb-2"
            >
              <input
                type="text"
                value={l.description}
                onChange={(e) => patch(i, { description: e.target.value })}
                placeholder="Direction artistique — phase 1"
                className="w-full border-b border-cyan-200/15 bg-transparent pb-1.5 font-sans text-sm text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/60 focus:outline-none"
              />
              <input
                type="number"
                step="0.01"
                value={Number.isFinite(l.quantity) ? l.quantity : 0}
                onChange={(e) =>
                  patch(i, { quantity: Number(e.target.value) || 0 })
                }
                className="w-full border-b border-cyan-200/15 bg-transparent pb-1.5 text-right font-mono text-sm text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/60 focus:outline-none"
              />
              <input
                type="number"
                step="0.01"
                value={Number.isFinite(l.unit_price_ht) ? l.unit_price_ht : 0}
                onChange={(e) =>
                  patch(i, { unit_price_ht: Number(e.target.value) || 0 })
                }
                className="w-full border-b border-cyan-200/15 bg-transparent pb-1.5 text-right font-mono text-sm text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/60 focus:outline-none"
              />
              {!vatExempt ? (
                <select
                  value={l.vat_rate}
                  onChange={(e) =>
                    patch(i, { vat_rate: Number(e.target.value) })
                  }
                  className="w-full cursor-pointer border-b border-cyan-200/15 bg-transparent pb-1.5 text-right font-mono text-sm text-[#F5F5F7] focus:border-cyan-200/60 focus:outline-none"
                >
                  {VAT_RATES.map((r) => (
                    <option key={r} value={r} className="bg-black text-white">
                      {r} %
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-right font-mono text-xs text-white/35">—</span>
              )}
              <span className="text-right font-mono text-sm text-cyan-100/85">
                {formatEuro(t.total_ht)}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Supprimer la ligne"
                className="ml-auto text-white/30 transition-colors hover:text-red-300"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      {/* Totaux */}
      <div className="ml-auto flex w-full max-w-sm flex-col gap-1.5 border-t border-cyan-200/15 pt-4 text-sm">
        <Row label="Sous-total HT" value={formatEuro(totals.subtotal_ht)} />
        {!vatExempt &&
          totals.tax_breakdown.map((b) => (
            <Row
              key={b.rate}
              label={`TVA ${b.rate} % sur ${formatEuro(b.base_ht)}`}
              value={formatEuro(b.tax)}
              muted
            />
          ))}
        {!vatExempt && (
          <Row label="Total TVA" value={formatEuro(totals.tax_total)} />
        )}
        <div className="mt-2 flex items-baseline justify-between border-t border-cyan-200/30 pt-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/85">
            Total {vatExempt ? "(HT = TTC)" : "TTC"}
          </span>
          <span
            className="font-sans text-2xl font-extralight text-[#F5F5F7]"
            style={{ textShadow: "0 0 12px rgba(125, 211, 252, 0.3)" }}
          >
            {formatEuro(totals.total_ttc)}
          </span>
        </div>
      </div>

      {/* Champ caché serialisé pour le form parent */}
      <input type="hidden" name={name} value={json} />
    </div>
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
      className={`flex items-baseline justify-between ${muted ? "text-white/45" : "text-white/85"}`}
    >
      <span className="text-[11px] uppercase tracking-[0.24em]">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
