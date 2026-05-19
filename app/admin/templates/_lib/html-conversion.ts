/**
 * Conversion HTML → PageContent via Claude API.
 *
 * Helper partagé entre la création (`new/actions.ts`) et l'édition
 * (`[id]/actions.ts`) d'un template. Hors fichier "use server" parce que
 * les exports d'un Server Actions module doivent être des async functions.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { PageContent } from "@/types/database";

export const MAX_HTML_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * System prompt envoyé à Claude pour convertir une page HTML en PageContent.
 * Marqué cache_control: ephemeral côté appel (prefix matching de l'API).
 */
const SYSTEM_PROMPT = `Tu convertis une page HTML brute en JSON "PageContent" pour Speetch, un espace client d'agence créative.

Sortie attendue : un OBJET JSON strictement conforme au schéma fourni dans output_config (pas de markdown, pas de préambule, juste le JSON).

Schéma sémantique :
{
  "intro": string,             // 1-2 phrases d'accroche, ton éditorial
  "sections": Array<Section>
}

Où Section est l'un de :
- { "type": "text",    "title": string, "body": string }
- { "type": "image",   "title": string, "media": Array<{ "url": string, "caption"?: string }> }
- { "type": "video",   "title": string, "media": Array<{ "url": string, "caption"?: string }> }
- { "type": "embed",   "title": string, "embedUrl": string }
- { "type": "gallery", "title": string, "media": Array<{ "url": string, "caption"?: string }> }

Règles d'extraction :

1. intro : extrais ou synthétise depuis <title>, <h1>, ou le premier paragraphe lead. Texte plat, sans HTML. 1-2 phrases max.

2. Mapping HTML → sections :
   - Une <h2>/<h3> suivie de <p>(s) → section "text" (title = heading, body = paragraphes joints par "\\n\\n").
   - <img> isolée (pas dans une grille) → section "image" avec media[0].url = src.
   - <video> → section "video" avec media[0].url = src (ou première <source>).
   - <iframe> YouTube / Vimeo / Figma / Spotify / SoundCloud → section "embed" avec embedUrl = src.
   - 2+ <img> dans le même conteneur (figure, div galerie, grille) → section "gallery", avec un entry par image.

3. Captions :
   - <figcaption> si présent
   - Sinon <img alt> si non-vide et descriptif
   - Sinon petit <em>/<small> immédiatement après l'image
   - Sinon omet le champ caption

4. URLs :
   - Garde absolues (https://…) telles quelles.
   - Pour les URLs relatives ou data:, mets l'URL placeholder "https://placeholder.speetch.com/à-remplacer" pour signaler à l'admin qu'il doit la mettre à jour.

5. Filtre — IGNORE complètement :
   - <nav>, <header>, <footer>, breadcrumbs
   - bannières cookies, pop-ups newsletter, "À propos" génériques
   - widgets sociaux, scripts, ad blocks
   - menus, liens de navigation

6. Préserve la LANGUE du HTML source (FR → FR, EN → EN).

7. Si une section serait vide (titre seul sans contenu, ou body vide), OMETS-la entièrement.

8. Ordonne les sections dans l'ordre d'apparition dans le HTML.

9. Si l'HTML est minuscule ou inutilisable, renvoie une page avec intro courte et sections vide [] — ne hallucine pas de contenu.`;

const PAGE_CONTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["intro", "sections"],
  properties: {
    intro: { type: "string" },
    sections: {
      type: "array",
      items: {
        anyOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "title", "body"],
            properties: {
              type: { const: "text" },
              title: { type: "string" },
              body: { type: "string" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "title", "media"],
            properties: {
              type: { const: "image" },
              title: { type: "string" },
              media: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["url"],
                  properties: {
                    url: { type: "string" },
                    caption: { type: "string" },
                  },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "title", "media"],
            properties: {
              type: { const: "video" },
              title: { type: "string" },
              media: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["url"],
                  properties: {
                    url: { type: "string" },
                    caption: { type: "string" },
                  },
                },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "title", "embedUrl"],
            properties: {
              type: { const: "embed" },
              title: { type: "string" },
              embedUrl: { type: "string" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "title", "media"],
            properties: {
              type: { const: "gallery" },
              title: { type: "string" },
              media: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["url"],
                  properties: {
                    url: { type: "string" },
                    caption: { type: "string" },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
} as const;

type AiSection =
  | { type: "text"; title: string; body: string }
  | { type: "image"; title: string; media: Array<{ url: string; caption?: string }> }
  | { type: "video"; title: string; media: Array<{ url: string; caption?: string }> }
  | { type: "embed"; title: string; embedUrl: string }
  | { type: "gallery"; title: string; media: Array<{ url: string; caption?: string }> };

type AiPageContent = {
  intro: string;
  sections: AiSection[];
};

function validateAiContent(value: unknown): AiPageContent | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.intro !== "string") return null;
  if (!Array.isArray(v.sections)) return null;
  return v as AiPageContent;
}

function aiSectionToPageSection(
  section: AiSection,
  generateId: () => string,
): NonNullable<PageContent["sections"]>[number] {
  const id = generateId();
  switch (section.type) {
    case "text":
      return { id, type: "text", title: section.title, body: section.body };
    case "image":
      return { id, type: "image", title: section.title, media: section.media };
    case "video":
      return { id, type: "video", title: section.title, media: section.media };
    case "embed":
      return {
        id,
        type: "embed",
        title: section.title,
        embedUrl: section.embedUrl,
      };
    case "gallery":
      return {
        id,
        type: "gallery",
        title: section.title,
        media: section.media,
      };
  }
}

export type ConversionResult =
  | { ok: true; content: PageContent }
  | { ok: false; error: string };

/**
 * Convertit un HTML en PageContent éditorial (intro + sections) via Claude.
 * Renvoie un PageContent avec meta.style = "document" et des IDs de section
 * en placeholder __SECTION_N__ (remplacés à l'instanciation par instantiateTemplate).
 */
export async function convertHtmlToPageContent(
  html: string,
): Promise<ConversionResult> {
  const anthropic = new Anthropic();

  let aiPayload: AiPageContent;
  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 16000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Voici la page HTML à convertir :\n\n${html}`,
            },
          ],
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: PAGE_CONTENT_SCHEMA,
        },
      },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { ok: false, error: "Réponse Claude vide ou non textuelle." };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      console.error("[convertHtmlToPageContent] JSON.parse failed on:", textBlock.text);
      return { ok: false, error: "La réponse Claude n'est pas un JSON valide." };
    }

    const validated = validateAiContent(parsed);
    if (!validated) {
      return { ok: false, error: "Structure JSON Claude inattendue." };
    }
    aiPayload = validated;
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error("[convertHtmlToPageContent] Anthropic API error:", err.status, err.message);
      return {
        ok: false,
        error: `Erreur API Claude (${err.status}) : ${err.message}`,
      };
    }
    console.error("[convertHtmlToPageContent] unexpected error:", err);
    return { ok: false, error: "Erreur inattendue lors de l'appel Claude API." };
  }

  const content: PageContent = {
    intro: aiPayload.intro,
    sections: aiPayload.sections.map((s, i) =>
      aiSectionToPageSection(s, () => `__SECTION_${i + 1}__`),
    ),
    meta: {
      style: "document",
    },
  };

  return { ok: true, content };
}

/**
 * Construit un PageContent en mode "reproduction fidèle" : pas de Claude,
 * juste le HTML brut stocké dans meta.raw_html.
 */
export function buildRawHtmlContent(html: string): PageContent {
  return {
    intro: "",
    sections: [],
    meta: {
      style: "raw_html",
      raw_html: html,
    },
  };
}
