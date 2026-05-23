"use client";

/**
 * <PublicPrintButton> — toolbar discrète sur la vue publique. Le
 * destinataire clique "Imprimer / PDF" → son navigateur fait le rendu
 * (pas besoin de Puppeteer côté serveur).
 */
export function PublicPrintButton() {
  return (
    <div className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-3 rounded-full border border-cyan-300/40 bg-black/85 px-5 py-2.5 text-[11px] uppercase tracking-[0.32em] text-cyan-100 backdrop-blur transition-colors hover:border-cyan-200/80 hover:bg-cyan-200/[0.06]"
        style={{ boxShadow: "0 8px 28px -12px rgba(0,0,0,0.6)" }}
      >
        Enregistrer en PDF
        <span className="inline-block h-px w-5 bg-current" />
      </button>
    </div>
  );
}
