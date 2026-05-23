import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button } from "@/lib/ds";
import { formatEuro } from "@/lib/credits/pricing";
import type { CreditNoteRow } from "@/lib/credits/types";

export const metadata: Metadata = {
  title: "Avoir",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

type CreditNoteJoined = CreditNoteRow & {
  invoice: {
    id: string;
    number: string;
    client_name: string;
    total_ttc: number;
  } | null;
};

export default async function CreditNoteDetailPage({
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
  if (!user) redirect(`/login?redirect=/admin/credits/avoirs/${id}`);

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { data: note } = await admin
    .from("credit_notes" as never)
    .select(
      "*, invoice:credit_invoices(id, number, client_name, total_ttc)",
    )
    .eq("id", id)
    .maybeSingle<CreditNoteJoined>();

  if (!note) notFound();

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
          href="/admin/credits/avoirs"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 hover:text-cyan-100"
        >
          ← Avoirs
        </Link>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-start gap-10 pt-20 md:pt-12">
        <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
          <Link href="/admin/credits" className="transition-colors hover:text-cyan-100">
            Crédits
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <Link
            href="/admin/credits/avoirs"
            className="transition-colors hover:text-cyan-100"
          >
            Avoirs
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <span className="text-cyan-200/85 font-mono">{note.number}</span>
        </p>

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.32em] text-red-300/85">
              Avoir émis
            </span>
            <h1
              className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              <span className="font-mono text-cyan-100/85">{note.number}</span>
            </h1>
            <p className="font-serif text-base italic text-white/65">
              − {formatEuro(Number(note.total_ttc))} TTC, émis le{" "}
              {DATE.format(new Date(note.issued_at))}
            </p>
          </div>
          <Button
            href={`/admin/credits/print/credit_note/${note.id}`}
            target="_blank"
            variant="primary"
          >
            Aperçu imprimable ↗
          </Button>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 border-y border-cyan-200/15 py-6">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/65">
              Facture liée
            </span>
            {note.invoice ? (
              <Link
                href={`/admin/credits/factures/${note.invoice.id}`}
                className="font-mono text-base text-[#F5F5F7] hover:text-cyan-100"
              >
                {note.invoice.number}
                <span className="ml-3 font-serif text-sm italic text-white/55">
                  — {note.invoice.client_name} ·{" "}
                  {formatEuro(Number(note.invoice.total_ttc))}
                </span>
              </Link>
            ) : (
              <span className="text-white/45">Facture supprimée.</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/65">
              Motif
            </span>
            <p className="whitespace-pre-wrap font-serif text-base italic text-white/85">
              {note.reason}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-px overflow-hidden border border-cyan-200/15 bg-cyan-200/[0.02]">
            <Stat label="Sous-total HT" value={formatEuro(Number(note.subtotal_ht))} />
            <Stat label="TVA" value={formatEuro(Number(note.tax_total))} />
            <Stat
              label="Total TTC"
              value={formatEuro(Number(note.total_ttc))}
              tone="rose"
            />
          </div>

          {note.notes && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/65">
                Notes
              </span>
              <p className="whitespace-pre-wrap font-sans text-sm text-white/85">
                {note.notes}
              </p>
            </div>
          )}
        </div>

        <p className="font-serif text-[11px] italic text-white/40">
          Un avoir ne peut pas être supprimé une fois émis (exigence légale).
          Pour annuler un avoir, il faut émettre une nouvelle facture.
        </p>

        <Link
          href="/admin/credits/avoirs"
          className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 hover:text-cyan-100"
        >
          ← Retour aux avoirs
        </Link>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "rose";
}) {
  const color = tone === "rose" ? "text-red-300/95" : "text-[#F5F5F7]";
  return (
    <div className="flex flex-col items-center gap-2 bg-black/40 px-4 py-5">
      <span className="text-[9px] uppercase tracking-[0.32em] text-white/45">
        {label}
      </span>
      <span className={`font-mono text-lg ${color}`}>{value}</span>
    </div>
  );
}
