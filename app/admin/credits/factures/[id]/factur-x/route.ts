/**
 * GET /admin/credits/factures/[id]/factur-x
 *
 * Renvoie le XML Factur-X BASIC de la facture en téléchargement. Garde
 * owner. Le PDP utilisateur consomme ce XML directement (Chorus Pro,
 * Pennylane…), ou tu l'attaches à l'email Brevo (cf. send-credit-dialog).
 */

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/owner";
import { loadEmitterSettings } from "@/lib/credits/emitter";
import { buildFacturXXml, facturXFilename } from "@/lib/credits/factur-x";
import type { InvoiceRow } from "@/lib/credits/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const owner = await requireOwner(supabase);
  if (!owner.ok) {
    return NextResponse.json(
      {
        error:
          owner.reason === "no_session"
            ? "Non authentifié"
            : "Accès réservé au propriétaire",
      },
      { status: owner.reason === "no_session" ? 401 : 403 },
    );
  }

  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const [emitter, { data: invoice }] = await Promise.all([
    loadEmitterSettings(),
    admin
      .from("credit_invoices" as never)
      .select("*")
      .eq("id", id)
      .maybeSingle<InvoiceRow>(),
  ]);

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
  if (!emitter) {
    return NextResponse.json(
      { error: "Émetteur non configuré" },
      { status: 409 },
    );
  }

  try {
    const xml = buildFacturXXml(invoice, emitter);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${facturXFilename(invoice.number)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur de génération.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
