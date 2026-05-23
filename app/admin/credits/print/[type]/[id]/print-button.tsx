"use client";

/**
 * <PrintButton> — toolbar flottante au-dessus du document imprimable.
 * Bouton "Imprimer" (window.print) + lien retour. Masqué via @media
 * print pour ne pas apparaître sur le PDF.
 */
export function PrintButton() {
  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-3 border border-cyan-200/40 bg-black/70 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-cyan-100 backdrop-blur transition-colors hover:border-cyan-200/80 hover:bg-cyan-200/[0.06]"
      >
        Imprimer / PDF
        <span className="inline-block h-px w-5 bg-current" />
      </button>
      <button
        type="button"
        onClick={() => window.close()}
        className="text-[10px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
      >
        Fermer
      </button>
    </div>
  );
}
