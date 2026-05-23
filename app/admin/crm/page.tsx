import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button, Eyebrow, StatusBadge } from "@/lib/ds";
import {
  PADAWAN_STATUS_LABEL,
  PADAWAN_STATUS_TONE,
  PADAWAN_STATUS_VALUES,
  PADAWAN_SOURCE_LABEL,
  isPadawanStatus,
  isPadawanSource,
  type PadawanStatus,
} from "@/lib/crm";

export const metadata: Metadata = {
  title: "Padawans",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PadawanRow = {
  id: string;
  full_name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  next_action_at: string | null;
  updated_at: string;
};

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function CrmListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/crm");
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_padawans" as never)
    .select(
      "id, full_name, company, email, phone, source, status, next_action_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .returns<PadawanRow[]>();

  const padawans: PadawanRow[] = data ?? [];

  // Compteurs par statut, dans l'ordre du funnel.
  const counts: Record<PadawanStatus, number> = {
    detected: 0,
    approached: 0,
    qualified: 0,
    won: 0,
    lost: 0,
  };
  for (const p of padawans) {
    if (isPadawanStatus(p.status)) counts[p.status]++;
  }

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

      {/* Header mobile */}
      <header className="flex items-center justify-between md:hidden">
        <Link
          href="/admin"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Conseil
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Padawans
        </span>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-12 pt-24 md:pt-20">
        <div className="flex flex-col gap-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            Conseil Jedi
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/85">Padawans</span>
          </p>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <h1
              className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
            >
              Les{" "}
              <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
                Padawans
              </span>
            </h1>

            <Button href="/admin/crm/new" variant="return">
              Repérer un padawan
            </Button>
          </div>

          <p className="max-w-2xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            Prospects en formation — leads que le Conseil suit jusqu&apos;à
            l&apos;adoubement (transformation en Holocron).
          </p>

          {/* Funnel — répartition par statut */}
          <ul className="flex flex-wrap items-center gap-x-7 gap-y-3 pt-2">
            {PADAWAN_STATUS_VALUES.map((s) => (
              <li key={s} className="inline-flex items-center gap-3">
                <StatusBadge tone={PADAWAN_STATUS_TONE[s]}>
                  {PADAWAN_STATUS_LABEL[s]}
                </StatusBadge>
                <span className="font-mono text-[11px] text-white/55">
                  {counts[s]}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p
            className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85"
            style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
          >
            Erreur de transmission · {error.message}
          </p>
        )}

        {padawans.length === 0 ? (
          <EmptyState />
        ) : (
          <PadawansTable padawans={padawans} />
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative flex flex-col items-start gap-8 pt-16">
      <div
        aria-hidden
        className="sw-hologram-line absolute inset-x-0 top-0"
      />
      <p className="max-w-md text-balance font-serif text-base italic text-white/55 md:text-lg">
        Aucun padawan repéré pour le moment. Les premières recrues
        s&apos;inscriront dès que tu commenceras à les pister.
      </p>
      <Button href="/admin/crm/new" variant="large">
        Repérer le premier padawan
      </Button>
    </div>
  );
}

function PadawansTable({ padawans }: { padawans: PadawanRow[] }) {
  return (
    <div className="overflow-hidden border border-cyan-200/15 bg-cyan-200/[0.015]">
      {/* Header — desktop */}
      <div className="hidden grid-cols-[2fr_1.5fr_1.2fr_1fr_0.8fr_auto] items-center gap-4 border-b border-cyan-200/15 px-5 py-4 text-[10px] uppercase tracking-[0.32em] text-cyan-200/55 md:grid">
        <span>Nom</span>
        <span>Compagnie</span>
        <span>Contact</span>
        <span>Source</span>
        <span>Statut</span>
        <span className="text-right">Mise à jour</span>
      </div>

      <ul className="divide-y divide-cyan-200/10">
        {padawans.map((p) => (
          <li key={p.id}>
            <Link
              href={`/admin/crm/${p.id}`}
              className="group grid grid-cols-1 gap-3 px-5 py-5 transition-colors hover:bg-cyan-200/[0.04] md:grid-cols-[2fr_1.5fr_1.2fr_1fr_0.8fr_auto] md:items-center md:gap-4 md:py-4"
            >
              <div className="flex flex-col gap-1">
                <span className="font-sans text-base font-light text-[#F5F5F7] transition-colors group-hover:text-cyan-100 md:text-lg">
                  {p.full_name}
                </span>
                {/* Mobile : on regroupe compagnie + contact sous le nom */}
                <span className="text-[11px] text-white/45 md:hidden">
                  {[p.company, p.email, p.phone].filter(Boolean).join(" · ") ||
                    "—"}
                </span>
              </div>

              <span className="hidden text-sm text-white/65 md:inline">
                {p.company ?? "—"}
              </span>

              <span className="hidden font-mono text-[12px] text-white/55 md:inline">
                {p.email ?? p.phone ?? "—"}
              </span>

              <span className="hidden text-[11px] uppercase tracking-[0.28em] text-cyan-200/55 md:inline">
                {p.source && isPadawanSource(p.source)
                  ? PADAWAN_SOURCE_LABEL[p.source]
                  : "—"}
              </span>

              <span>
                {isPadawanStatus(p.status) ? (
                  <StatusBadge tone={PADAWAN_STATUS_TONE[p.status]}>
                    {PADAWAN_STATUS_LABEL[p.status]}
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="neutral">{p.status}</StatusBadge>
                )}
              </span>

              <span className="text-right font-mono text-[11px] text-white/35">
                {DATE_FORMAT.format(new Date(p.updated_at))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
