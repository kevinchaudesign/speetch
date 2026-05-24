/**
 * Route publique du chatbot de mise en relation Speetch.
 *
 * POST /api/contact { messages: [{role,content}] }
 * → { reply: string }
 *
 * Pas d'auth : visiteur anonyme. Garde-fous :
 *  - Max 40 messages par session
 *  - Max 4000 chars par message
 *  - Max 800 tokens de réponse (concierge concis)
 *  - Pas de stockage côté serveur (stateless)
 *
 * Si ANTHROPIC_API_KEY manquante, renvoie un message d'erreur clair
 * sans crasher la route — le chat continue de s'afficher côté UI.
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import {
  CONTACT_BOT_MODEL,
  CONTACT_BOT_PERSONA,
} from "@/lib/contact-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 40;
const MAX_TEXT_LENGTH = 4000;
const MAX_TOKENS = 800;

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

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Le concierge est temporairement indisponible. Écris-nous directement à hello@speetch.com.",
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

  if (messages[0].role !== "user") {
    return NextResponse.json(
      { error: "La conversation doit commencer par un message visiteur." },
      { status: 400 },
    );
  }

  const anthropic = new Anthropic();

  try {
    const res = await anthropic.messages.create({
      model: CONTACT_BOT_MODEL,
      max_tokens: MAX_TOKENS,
      // Persona + catalogue exhaustif des 80 skills ≈ 3500 tokens.
      // On le passe en bloc structuré avec cache_control ephemeral
      // (TTL 5min) pour éviter que chaque visiteur paie l'intégralité
      // à chaque tour — un seul utilisateur fait plusieurs requêtes
      // dans la même session.
      system: [
        {
          type: "text",
          text: CONTACT_BOT_PERSONA,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({
      reply: text || "(silence) — réessaie ou écris à hello@speetch.com.",
    });
  } catch (err) {
    console.error("[contact-bot] anthropic error:", err);
    const msg =
      err instanceof Anthropic.APIError
        ? `Le concierge a du mal à répondre (${err.status}). Écris-nous à hello@speetch.com.`
        : err instanceof Error
          ? err.message
          : "Le concierge est silencieux. Écris-nous à hello@speetch.com.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
