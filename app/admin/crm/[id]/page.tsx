import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { EditPadawanForm } from "./edit-padawan-form";

export const metadata: Metadata = {
  title: "Padawan",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PadawanDetailPage({
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

  if (!user) {
    redirect(`/login?redirect=/admin/crm/${id}`);
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  type PadawanRow = {
    id: string;
    full_name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    source: string | null;
    status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };

  const admin = createAdminClient();
  const { data: padawan } = await admin
    .from("crm_padawans" as never)
    .select(
      "id, full_name, company, email, phone, source, status, notes, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle<PadawanRow>();

  if (!padawan) notFound();

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
          href="/admin/crm"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Padawans
        </Link>
      </header>

      <section className="mx-auto flex max-w-2xl flex-col items-start gap-12 pt-20 md:pt-28">
        <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
          <Link
            href="/admin"
            className="transition-colors hover:text-cyan-100"
          >
            Conseil Jedi
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <Link
            href="/admin/crm"
            className="transition-colors hover:text-cyan-100"
          >
            Padawans
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <span className="text-cyan-200/85">{padawan.full_name}</span>
        </p>

        <PadawanTitle fullName={padawan.full_name} />

        <EditPadawanForm
          padawan={{
            id: padawan.id,
            full_name: padawan.full_name,
            company: padawan.company ?? "",
            email: padawan.email ?? "",
            phone: padawan.phone ?? "",
            source: padawan.source ?? "",
            status: padawan.status,
            notes: padawan.notes ?? "",
          }}
        />

        <Link
          href="/admin/crm"
          className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors hover:text-cyan-100"
        >
          ← Retour Padawans
        </Link>
      </section>
    </div>
  );
}

/**
 * Titre H1 typographique en deux blocs : prénom en ExtraLight, nom en
 * Fraunces italic cyan-glow. Si une seule partie, on met tout en italic
 * cyan pour ne pas afficher la même chaîne deux fois.
 */
function PadawanTitle({ fullName }: { fullName: string }) {
  const parts = fullName.trim().split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1] : null;
  const head = parts.length > 1 ? parts.slice(0, -1).join(" ") : fullName;
  return (
    <h1
      className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
      style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
    >
      {last ? (
        <>
          {head}{" "}
          <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
            {last}
          </span>
        </>
      ) : (
        <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
          {head}
        </span>
      )}
    </h1>
  );
}
