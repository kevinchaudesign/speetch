import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/owner";
import { buildSystemPrompt } from "@/lib/chatbot/system-prompt";
import { loadClientContextSnapshot } from "@/lib/chatbot/client-context";
import {
  PROPOSE_IMAGE_CHANGE_TOOL,
  PROPOSE_IMAGE_OVERRIDE_TOOL,
  PROPOSE_TEXT_OVERRIDE_TOOL,
  executeProposeImageChange,
  executeProposeImageOverride,
  executeProposeTextOverride,
  type ProposeImageChangeInput,
  type ProposeImageOverrideInput,
  type ProposeTextOverrideInput,
} from "@/lib/chatbot/tools";
import { isValidSlug } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 40;
const MAX_TEXT_LENGTH = 8000;
const MAX_TOOL_TURNS = 4;

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

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const body = payload as {
    messages?: unknown;
    pathname?: unknown;
  };

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "messages requis" },
      { status: 400 },
    );
  }
  if (body.messages.length > MAX_MESSAGES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_MESSAGES} messages.` },
      { status: 400 },
    );
  }
  const incoming: IncomingMessage[] = [];
  for (const m of body.messages) {
    if (!isValidMessage(m)) {
      return NextResponse.json(
        { error: "Format de message invalide" },
        { status: 400 },
      );
    }
    incoming.push({ role: m.role, content: m.content });
  }

  const pathname =
    typeof body.pathname === "string" && body.pathname.length < 500
      ? body.pathname
      : "/admin";

  // Détecte le contexte client à partir du pathname.
  let clientSlug: string | null = null;
  const clientMatch = pathname.match(/^\/clients\/([^/]+)(?:\/.*)?$/);
  if (clientMatch && isValidSlug(clientMatch[1])) {
    clientSlug = clientMatch[1];
  }

  let clientSnapshot: string | null = null;
  if (clientSlug) {
    try {
      clientSnapshot = await loadClientContextSnapshot(clientSlug);
    } catch (err) {
      console.error("[assistant] client snapshot error:", err);
    }
  }

  // Custom system prompt défini par le Maître depuis `/admin/settings/chatbot`.
  // Si non-null, remplace `DEFAULT_PRODUCT_BRIEF` dans le préfixe cacheable.
  let customBrief: string | null = null;
  try {
    const admin = createAdminClient();
    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("chatbot_system_prompt")
      .eq("is_owner", true)
      .maybeSingle();
    customBrief = ownerProfile?.chatbot_system_prompt ?? null;
  } catch (err) {
    console.error("[assistant] custom brief fetch error:", err);
  }

  const { cacheable, contextual, clientSnapshot: snapshot } = buildSystemPrompt(
    {
      pathname,
      email: owner.email || "session inconnue",
      clientSnapshot,
      customBrief,
    },
  );

  const anthropic = new Anthropic();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        const systemBlocks: Anthropic.TextBlockParam[] = [
          {
            type: "text",
            text: cacheable,
            cache_control: { type: "ephemeral" },
          },
        ];
        if (snapshot) {
          systemBlocks.push({
            type: "text",
            text: snapshot,
            cache_control: { type: "ephemeral" },
          });
        }
        systemBlocks.push({
          type: "text",
          text: contextual,
        });

        // Outils dispo uniquement en mode contexte client.
        const tools: Anthropic.Tool[] = clientSlug
          ? [
              PROPOSE_IMAGE_CHANGE_TOOL,
              PROPOSE_IMAGE_OVERRIDE_TOOL,
              PROPOSE_TEXT_OVERRIDE_TOOL,
            ]
          : [];

        // Historique côté Anthropic. Démarre avec les messages utilisateurs
        // bruts (chacun en string content), s'enrichit de blocs structurés
        // après chaque tour avec tool_use / tool_result.
        const messages: Anthropic.MessageParam[] = incoming.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        for (let turn = 0; turn < MAX_TOOL_TURNS; turn += 1) {
          const claudeStream = await anthropic.messages.stream({
            model: "claude-opus-4-7",
            max_tokens: 2000,
            system: systemBlocks,
            messages,
            tools: tools.length > 0 ? tools : undefined,
          });

          for await (const event of claudeStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              send("delta", { text: event.delta.text });
            }
          }

          const final = await claudeStream.finalMessage();

          if (final.stop_reason !== "tool_use") {
            // Réponse complète, fin du multi-turn.
            break;
          }

          // Exécute chaque tool_use, émet un preview, prépare le tool_result.
          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const tu of toolUses) {
            if (!clientSlug) {
              toolResults.push({
                type: "tool_result",
                tool_use_id: tu.id,
                content: JSON.stringify({
                  ok: false,
                  error: "Outil non disponible hors mode contexte client.",
                }),
                is_error: true,
              });
              continue;
            }
            let exec;
            switch (tu.name) {
              case "propose_image_change":
                exec = await executeProposeImageChange(
                  tu.input as ProposeImageChangeInput,
                  { clientSlug },
                );
                break;
              case "propose_image_override":
                exec = await executeProposeImageOverride(
                  tu.input as ProposeImageOverrideInput,
                  { clientSlug },
                );
                break;
              case "propose_text_override":
                exec = await executeProposeTextOverride(
                  tu.input as ProposeTextOverrideInput,
                  { clientSlug },
                );
                break;
              default:
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: tu.id,
                  content: JSON.stringify({
                    ok: false,
                    error: `Outil inconnu : ${tu.name}`,
                  }),
                  is_error: true,
                });
                continue;
            }
            if (exec.ok) {
              send("preview", exec.proposal);
            }
            toolResults.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: exec.tool_result_text,
              is_error: !exec.ok,
            });
          }

          // Insère l'échange tool_use / tool_result dans l'historique pour le
          // prochain tour Claude.
          messages.push({ role: "assistant", content: final.content });
          messages.push({ role: "user", content: toolResults });

          // Sépare visuellement les bulles assistant successives.
          send("split", {});
        }

        send("done", {});
        controller.close();
      } catch (err) {
        const message =
          err instanceof Anthropic.APIError
            ? `Erreur API Claude (${err.status}) : ${err.message}`
            : err instanceof Error
              ? err.message
              : "Erreur inconnue";
        console.error("[assistant] stream error:", err);
        send("error", { message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
