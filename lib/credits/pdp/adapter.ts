/**
 * Interface PDP (Plateforme de Dématérialisation Partenaire).
 *
 * Toutes les intégrations futures (Chorus Pro, Pennylane, Sellsy, etc.)
 * implémentent cette interface. Permet de switcher de PDP sans changer
 * le code applicatif — seul l'adapter change.
 *
 * Cycle de vie e-invoicing (réforme française 2026+) :
 *  1. submitInvoice(xml)  → PDP dépose la facture, renvoie un PDP ID
 *  2. fetchLifecycle(id)  → suivi des statuts (déposée, refusée,
 *                            mise à disposition, encaissée, etc.)
 *  3. lifecycle webhook   → le PDP nous push les changements (à câbler)
 *
 * v1 (cette version) : aucune intégration active. La structure est
 * prête côté DB (credit_invoices.lifecycle_status) + côté config
 * (credit_emitter_settings.pdp_provider). L'adapter Chorus Pro / Pennylane
 * est ajouté quand l'utilisateur choisit son PDP.
 */

export type PdpSubmitResult =
  | {
      ok: true;
      /** Identifiant remonté par le PDP — utile pour fetchLifecycle. */
      pdpInvoiceId: string;
      /** Statut initial après dépôt (ex: "received", "pending_validation"). */
      lifecycleStatus: string;
    }
  | { ok: false; error: string };

export type PdpLifecycleEvent = {
  /** Timestamp ISO. */
  at: string;
  /** Statut PDP normalisé (ex: "received", "validated", "rejected"). */
  status: string;
  /** Raison brute remontée par le PDP (motif de rejet, etc.). */
  reason?: string;
};

export type PdpAdapter = {
  /** Nom court (clé) du PDP, ex: "chorus-pro", "pennylane". */
  key: string;
  /** Libellé d'affichage. */
  displayName: string;

  /** Dépôt d'une facture (XML Factur-X). */
  submitInvoice(args: {
    xml: string;
    /** Métadonnées utiles pour le routage côté PDP. */
    invoiceNumber: string;
    buyerSiren: string | null;
  }): Promise<PdpSubmitResult>;

  /** Récupération du cycle de vie. */
  fetchLifecycle(pdpInvoiceId: string): Promise<PdpLifecycleEvent[]>;
};

/**
 * Stub par défaut — renvoie une erreur explicite tant qu'aucun PDP
 * n'est branché. Évite les `null` checks partout dans le code.
 */
export const STUB_PDP_ADAPTER: PdpAdapter = {
  key: "none",
  displayName: "Aucun PDP",
  async submitInvoice() {
    return {
      ok: false,
      error:
        "Aucun PDP branché. Va dans Forge → Émetteur Crédits pour le configurer (à venir).",
    };
  },
  async fetchLifecycle() {
    return [];
  },
};

/**
 * Resolve l'adapter à utiliser selon la config emitter. Pour l'instant
 * renvoie toujours STUB_PDP_ADAPTER — quand on ajoutera Chorus Pro on
 * ajoutera un switch sur emitter.pdp_provider.
 */
export function resolvePdpAdapter(
  pdpProvider: string | null | undefined,
): PdpAdapter {
  switch (pdpProvider) {
    // case "chorus-pro": return new ChorusProAdapter(...)
    // case "pennylane":  return new PennylaneAdapter(...)
    default:
      return STUB_PDP_ADAPTER;
  }
}
