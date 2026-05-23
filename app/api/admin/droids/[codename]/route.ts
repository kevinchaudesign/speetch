/**
 * Route API d'un droïde — POST messages → Claude → réponse texte.
 *
 * Stateless v1 : l'historique est envoyé en intégralité à chaque tour
 * par le client (state React). On garde une limite stricte de messages
 * + de longueur pour borner les coûts et le contexte.
 *
 * Le system prompt est dicté par le droïde (lib/droids.ts) — non
 * éditable côté client (immersion totale dans l'univers SW).
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/owner";
import { getDroid } from "@/lib/droids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 40;
const MAX_TEXT_LENGTH = 8000;
const MAX_TOKENS = 1500;

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

function isValidMessage(m: unknown): m is IncomingMessage {
  if (!m || typeof m !== "object") return false;
  const r = (m as { role?: unknown }).role;
  const c = (m as { content?: unknown }).content;
  return (
    (r === "user" || r === "assistant") &&
    typeof c === "string" &&
    c.length > 0 &&
    c.length <= MAX_TEXT_LENGTH
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ codename: string }> },
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

  const { codename } = await params;
  const droid = getDroid(codename);
  if (!droid) {
    return NextResponse.json({ error: "Droïde inconnu" }, { status: 404 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY manquant dans .env.local — les droïdes ne peuvent pas répondre.",
      },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const body = payload as { messages?: unknown };
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "messages requis" },
      { status: 400 },
    );
  }
  if (body.messages.length > MAX_MESSAGES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_MESSAGES} messages par session.` },
      { status: 400 },
    );
  }

  const messages: IncomingMessage[] = [];
  for (const m of body.messages) {
    if (!isValidMessage(m)) {
      return NextResponse.json(
        { error: "Format de message invalide" },
        { status: 400 },
      );
    }
    messages.push(m);
  }

  // Premier message doit être user (sinon Claude refuse).
  if (messages[0].role !== "user") {
    return NextResponse.json(
      { error: "Première transmission doit venir du Maître." },
      { status: 400 },
    );
  }

  const anthropic = new Anthropic();

  try {
    const res = await anthropic.messages.create({
      model: droid.model,
      max_tokens: MAX_TOKENS,
      system: droid.persona,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    // Concat tous les text blocks (Claude peut splitter).
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({
      reply: text || "(le droïde reste silencieux — réessaie)",
      stop_reason: res.stop_reason,
    });
  } catch (err) {
    console.error(`[droids/${codename}] anthropic error:`, err);
    const msg =
      err instanceof Anthropic.APIError
        ? `Liaison holographique perdue (${err.status}). ${err.message}`
        : err instanceof Error
          ? err.message
          : "Liaison holographique perdue.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
