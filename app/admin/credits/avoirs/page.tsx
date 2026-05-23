import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { formatEuro } from "@/lib/credits/pricing";
import { CreditsSubnav } from "../_components/credits-subnav";

export const metadata: Metadata = {
  title: "Avoirs",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type CreditNoteListRow = {
  id: string;
  number: string;
  issued_at: string;
  reason: string;
  total_ttc: number;
  invoice_id: string;
  invoice: { number: string; client_name: string } | null;
};

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function CreditNotesListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/credits/avoirs");

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("credit_notes" as never)
    .select(
      "id, number, issued_at, reason, total_ttc, invoice_id, invoice:credit_invoices(number, client_name)",
    )
    .order("issued_at", { ascending: false })
    .returns<CreditNoteListRow[]>();

  const rows = data ?? [];

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
          href="/admin"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 hover:text-cyan-100"
        >
          ← Conseil
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Avoirs
        </span>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-12 pt-24 md:pt-20">
        <div className="flex flex-col gap-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            <Link href="/admin" className="transition-colors hover:text-cyan-100">
              Conseil Jedi
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <Link
              href="/admin/credits"
              className="transition-colors hover:text-cyan-100"
            >
              Crédits
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/85">Avoirs</span>
          </p>

          <CreditsSubnav />

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
          >
            Les{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              Avoirs
            </span>
          </h1>

          <p className="max-w-2xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            Notes de crédit émises pour neutraliser ou corriger une
            facture. Numérotation séquentielle AV-AAAA-NNNN, créées
            depuis une facture émise (jamais sur un brouillon).
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="relative flex flex-col items-start gap-8 pt-16">
            <div aria-hidden className="sw-hologram-line absolute inset-x-0 top-0" />
            <p className="max-w-md text-balance font-serif text-base italic text-white/55 md:text-lg">
              Aucun avoir émis. Pour en émettre un, ouvre une facture et
              utilise « Émettre un avoir » dans la barre d&apos;actions.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden border border-cyan-200/15 bg-cyan-200/[0.015]">
            <div className="hidden grid-cols-[1.2fr_1.2fr_2fr_1fr_1fr] items-center gap-4 border-b border-cyan-200/15 px-5 py-4 text-[10px] uppercase tracking-[0.32em] text-cyan-200/55 md:grid">
              <span>Numéro</span>
              <span>Facture liée</span>
              <span>Motif</span>
              <span className="text-right">Montant TTC</span>
              <span className="text-right">Émission</span>
            </div>
            <ul className="divide-y divide-cyan-200/10">
              {rows.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/credits/avoirs/${c.id}`}
                    className="group grid grid-cols-1 gap-2 px-5 py-5 transition-colors hover:bg-cyan-200/[0.04] md:grid-cols-[1.2fr_1.2fr_2fr_1fr_1fr] md:items-center md:gap-4 md:py-4"
                  >
                    <span className="font-mono text-sm text-cyan-100/85">
                      {c.number}
                    </span>
                    <span className="font-mono text-xs text-white/65">
                      {c.invoice?.number ?? "—"}
                      {c.invoice?.client_name && (
                        <span className="ml-2 text-white/45">
                          · {c.invoice.client_name}
                        </span>
                      )}
                    </span>
                    <span className="truncate font-serif text-sm italic text-white/70">
                      {c.reason}
                    </span>
                    <span className="text-right font-mono text-sm text-red-300/85">
                      − {formatEuro(Number(c.total_ttc))}
                    </span>
                    <span className="text-right font-mono text-[11px] text-white/35">
                      {DATE.format(new Date(c.issued_at))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
