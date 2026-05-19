/**
 * Conversion HTML → ContextPageContent via Claude API.
 *
 * Pipeline pour les pages de contexte INTERNE par client (briefs, artifacts
 * Claude, etc.). Distinct du helper `templates/_lib/html-conversion` parce
 * que :
 *  - on génère AUSSI un title + summary (Claude propose un nom de note)
 *  - le prompt est orienté "document interne" (pas portfolio)
 *  - le PageContent produit ne contient que des sections "text" (les notes
 *    internes sont quasi exclusivement textuelles)
 *
 * Hors fichier "use server" parce que seul des async functions peuvent être
 * exportées d'un module Server Action.
 */

import Anthropic from "@anthropic-ai/sdk";
import { marked } from "marked";
import mammoth from "mammoth";
import type { PageContent } from "@/types/database";

export const MAX_HTML_SIZE = 2 * 1024 * 1024; // 2 MB
export const MAX_MARKDOWN_SIZE = 2 * 1024 * 1024; // 2 MB
export const MAX_DOCX_SIZE = 8 * 1024 * 1024; // 8 MB (binaire, plus volumineux)
export const MAX_PDF_SIZE = 12 * 1024 * 1024; // 12 MB
export const MAX_XLSX_SIZE = 10 * 1024 * 1024; // 10 MB
export const URL_FETCH_TIMEOUT_MS = 15_000;
export const URL_MAX_BYTES = MAX_HTML_SIZE;

/**
 * Extrait le texte du premier <h1> dans un fragment HTML produit par
 * une conversion (mammoth, marked, etc.). Renvoie null si absent.
 */
export function extractFirstH1Text(html: string): string | null {
  const match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match) return null;
  const text = match[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.length >= 2 ? text : null;
}

/**
 * Convertit un .docx (ArrayBuffer) en HTML autonome stylé Speetch via
 * Mammoth. Retourne aussi le titre extrait du premier H1 si présent.
 *
 * On utilise la conversion par défaut de Mammoth (Word styles standards
 * mappés sur leurs équivalents HTML : Heading 1 → h1, Heading 2 → h2,
 * Normal → p, etc.). Les images embarquées sont inlinées en data: par
 * Mammoth — pas de réécriture nécessaire.
 */
export async function convertDocxToHtml(
  buffer: ArrayBuffer,
  fallbackTitle: string,
): Promise<{ html: string; extractedTitle: string | null }> {
  // Mammoth en Node n'accepte que { path } ou { buffer: Node Buffer }
  // (les types TS proposent aussi arrayBuffer mais c'est strictement
  // côté navigateur). On convertit donc en Buffer côté serveur.
  const nodeBuffer = Buffer.from(buffer);
  const result = await mammoth.convertToHtml({ buffer: nodeBuffer });
  const body = result.value;
  const extractedTitle = extractFirstH1Text(body);
  const finalTitle = extractedTitle ?? fallbackTitle;

  const safeTitle = finalTitle
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${safeTitle}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    max-width: 720px;
    margin: 0 auto;
    padding: 5rem 1.75rem 6rem;
    color: #1a1a1a;
    line-height: 1.7;
    background: #fafaf7;
    font-size: 16px;
  }
  h1, h2, h3, h4, h5, h6 {
    font-weight: 200;
    letter-spacing: -0.01em;
    line-height: 1.2;
    margin: 2.5rem 0 1rem;
    color: #111;
  }
  h1 {
    font-size: clamp(2rem, 5vw, 3rem);
    letter-spacing: -0.02em;
    margin-top: 0;
    margin-bottom: 1.5rem;
  }
  h2 { font-size: 1.75rem; }
  h3 { font-size: 1.4rem; }
  h4 { font-size: 1.15rem; font-weight: 400; }
  h5, h6 { font-size: 1rem; font-weight: 500; }
  p { margin: 0 0 1rem; }
  a { color: #1a1a1a; text-decoration: underline; text-underline-offset: 3px; }
  a:hover { color: #555; }
  strong { font-weight: 600; }
  em { font-style: italic; font-family: ui-serif, Georgia, serif; }
  ul, ol { margin: 0 0 1rem; padding-left: 1.5rem; }
  li { margin: 0.25rem 0; }
  ul ul, ol ol, ul ol, ol ul { margin: 0.25rem 0; }
  blockquote {
    margin: 1.5rem 0;
    padding: 0.5rem 0 0.5rem 1.25rem;
    border-left: 2px solid #ccc;
    color: #555;
    font-style: italic;
    font-family: ui-serif, Georgia, serif;
  }
  hr { border: 0; border-top: 1px solid #ddd; margin: 2.5rem 0; }
  img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1.5rem 0;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.5rem 0;
    font-size: 0.95rem;
  }
  th, td {
    border: 1px solid #ddd;
    padding: 0.5rem 0.75rem;
    text-align: left;
    vertical-align: top;
  }
  th { font-weight: 500; background: rgba(0,0,0,0.025); }
</style>
</head>
<body>
${body}
</body>
</html>`;

  return { html, extractedTitle };
}

/**
 * Extrait le premier titre H1 d'un texte markdown (`# Mon titre`).
 * Renvoie null si absent ou trop court.
 */
export function extractMarkdownTitle(md: string): string | null {
  const match = md.match(/^[ \t]*#[ \t]+(.+?)\s*$/m);
  if (!match) return null;
  const title = match[1]
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return title.length >= 2 ? title : null;
}

/**
 * Convertit un texte Markdown en document HTML autonome stylé Speetch.
 *
 * Le résultat est destiné à être rendu dans l'iframe sandbox du viewer
 * raw_html — pas besoin de sanitization (admin-only + sandbox). Le titre
 * fourni est injecté dans <title> et utilisé comme fallback si le markdown
 * n'a pas de H1.
 */
export function convertMarkdownToHtml(md: string, title: string): string {
  const body = marked.parse(md, {
    gfm: true,
    breaks: false,
    async: false,
  }) as string;

  const safeTitle = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${safeTitle}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    max-width: 720px;
    margin: 0 auto;
    padding: 5rem 1.75rem 6rem;
    color: #1a1a1a;
    line-height: 1.7;
    background: #fafaf7;
    font-size: 16px;
  }
  h1, h2, h3, h4, h5, h6 {
    font-weight: 200;
    letter-spacing: -0.01em;
    line-height: 1.2;
    margin: 2.5rem 0 1rem;
    color: #111;
  }
  h1 {
    font-size: clamp(2rem, 5vw, 3rem);
    letter-spacing: -0.02em;
    margin-top: 0;
    margin-bottom: 1.5rem;
  }
  h2 { font-size: 1.75rem; }
  h3 { font-size: 1.4rem; }
  h4 { font-size: 1.15rem; font-weight: 400; }
  h5, h6 { font-size: 1rem; font-weight: 500; }
  p { margin: 0 0 1rem; }
  a { color: #1a1a1a; text-decoration: underline; text-underline-offset: 3px; }
  a:hover { color: #555; }
  ul, ol { margin: 0 0 1rem; padding-left: 1.5rem; }
  li { margin: 0.25rem 0; }
  ul ul, ol ol, ul ol, ol ul { margin: 0.25rem 0; }
  blockquote {
    margin: 1.5rem 0;
    padding: 0.5rem 0 0.5rem 1.25rem;
    border-left: 2px solid #ccc;
    color: #555;
    font-style: italic;
    font-family: ui-serif, Georgia, serif;
  }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.9em;
    background: rgba(0, 0, 0, 0.06);
    padding: 0.1em 0.35em;
    border-radius: 4px;
  }
  pre {
    background: #1a1a1a;
    color: #f5f5f0;
    padding: 1rem 1.25rem;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 0.85rem;
    line-height: 1.55;
    margin: 1.5rem 0;
  }
  pre code {
    background: transparent;
    padding: 0;
    color: inherit;
    font-size: inherit;
  }
  hr { border: 0; border-top: 1px solid #ddd; margin: 2.5rem 0; }
  img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1.5rem 0;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.5rem 0;
    font-size: 0.95rem;
  }
  th, td {
    border-bottom: 1px solid #ddd;
    padding: 0.5rem 0.75rem;
    text-align: left;
    vertical-align: top;
  }
  th { font-weight: 500; background: rgba(0,0,0,0.025); }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

const SYSTEM_PROMPT = `Tu convertis une page HTML (artifact Claude, page web, brief interne, etc.) en JSON pour Speetch — agence créative à Paris.

Le résultat sert de **note de contexte interne** pour l'admin (jamais montrée aux clients). Objectif : un document propre, lisible rapidement, qui synthétise les infos utiles pour qu'une IA assistante comprenne le projet du client.

Sortie attendue : un OBJET JSON strictement conforme au schéma fourni (pas de markdown, pas de préambule, juste le JSON).

Schéma sémantique :
{
  "title": string,             // 3-8 mots, titre éditorial de la note
  "summary": string,           // 1-2 phrases, résumé du contenu pour scan rapide
  "intro": string,             // 2-3 phrases d'introduction posant le contexte
  "sections": Array<{ "type": "text", "title": string, "body": string }>
}

Règles d'extraction :

1. title : court, descriptif, éditorial. Ex : "Brief de marque — refonte Maison Lemaire", "Recherche concurrence agences créatives Paris", "Conversation Claude — positionnement Speetch".

2. summary : factuel et utile pour un humain qui veut décider s'il ouvre la note. 1-2 phrases max.

3. intro : pose le contexte (origine du document, sujet général, à quoi ça sert). 2-3 phrases. Ton éditorial mais factuel.

4. sections : découpe en sections THÉMATIQUES (pas en chapitres HTML). Chaque section a :
   - title : un titre court (3-7 mots) qui résume la section
   - body : le contenu de la section en texte plat avec sauts de ligne "\\n\\n" entre paragraphes. Préserve :
     • Les listes : transforme en lignes "• item" séparées par \\n
     • Les emphases importantes : entoure de « guillemets français » pour les citations
     • Les chiffres / données chiffrées : garde tels quels
     • Les noms propres, marques, dates : préserve fidèlement

5. IGNORE complètement (ne crée pas de section pour) :
   - Métadonnées HTML (head, scripts, styles)
   - Navigation, footer, breadcrumbs, cookies
   - Boilerplate / contenu non-substantiel
   - Images, vidéos, embeds (cette feature ne gère que du texte)

6. Si le HTML est très long, regroupe par THÈME plutôt que de tout détailler.

7. Préserve la LANGUE du HTML source (FR → FR, EN → EN).

8. Si une section serait vide ou redondante, OMETS-la.

9. Si l'HTML est minuscule ou inutilisable, renvoie title/summary/intro courts et sections vide [] — ne hallucine pas de contenu.

10. Reformule pour la lisibilité : tu peux condenser, fusionner, réorganiser. C'est une note de synthèse, pas une transcription.`;

const CONTEXT_CONTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "intro", "sections"],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    intro: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "body"],
        properties: {
          type: { const: "text" },
          title: { type: "string" },
          body: { type: "string" },
        },
      },
    },
  },
} as const;

type AiContextSection = { type: "text"; title: string; body: string };

type AiContextPayload = {
  title: string;
  summary: string;
  intro: string;
  sections: AiContextSection[];
};

function validateAiPayload(value: unknown): AiContextPayload | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.title !== "string") return null;
  if (typeof v.summary !== "string") return null;
  if (typeof v.intro !== "string") return null;
  if (!Array.isArray(v.sections)) return null;
  return v as AiContextPayload;
}

export type ContextConversionResult =
  | {
      ok: true;
      title: string;
      summary: string;
      content: PageContent;
    }
  | { ok: false; error: string };

/**
 * Appelle Claude pour transformer un HTML en note de contexte structurée.
 */
export async function convertHtmlToContext(
  html: string,
): Promise<ContextConversionResult> {
  const anthropic = new Anthropic();

  let aiPayload: AiContextPayload;
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
              text: `Voici le HTML à convertir en note de contexte interne :\n\n${html}`,
            },
          ],
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: CONTEXT_CONTENT_SCHEMA,
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
      console.error("[convertHtmlToContext] JSON.parse failed:", textBlock.text);
      return { ok: false, error: "La réponse Claude n'est pas un JSON valide." };
    }

    const validated = validateAiPayload(parsed);
    if (!validated) {
      return { ok: false, error: "Structure JSON Claude inattendue." };
    }
    aiPayload = validated;
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error(
        "[convertHtmlToContext] Anthropic API error:",
        err.status,
        err.message,
      );
      return {
        ok: false,
        error: `Erreur API Claude (${err.status}) : ${err.message}`,
      };
    }
    console.error("[convertHtmlToContext] unexpected error:", err);
    return { ok: false, error: "Erreur inattendue lors de l'appel Claude API." };
  }

  const content: PageContent = {
    intro: aiPayload.intro,
    sections: aiPayload.sections.map((s, i) => ({
      id: `__SECTION_${i + 1}__`,
      type: "text" as const,
      title: s.title,
      body: s.body,
    })),
    meta: {
      style: "document",
    },
  };

  return {
    ok: true,
    title: aiPayload.title,
    summary: aiPayload.summary,
    content,
  };
}

export type FetchHtmlResult =
  | { ok: true; html: string }
  | { ok: false; error: string };

/**
 * Fetch une URL et renvoie son HTML. Aucune restriction de domaine
 * (admin-only). Garde-fous : timeout, content-type, taille.
 */
export async function fetchHtmlFromUrl(url: string): Promise<FetchHtmlResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "URL invalide." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Seuls http:// et https:// sont supportés." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), URL_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SpeetchContextBot/1.0; +https://speetch.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Le serveur a répondu ${response.status} ${response.statusText}.`,
      };
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (
      !contentType.includes("html") &&
      !contentType.includes("xml") &&
      !contentType.includes("text/plain")
    ) {
      return {
        ok: false,
        error: `Type de contenu inattendu : ${contentType || "inconnu"}.`,
      };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      const html = await response.text();
      if (html.length > URL_MAX_BYTES) {
        return { ok: false, error: "Réponse trop volumineuse (max 2 MB)." };
      }
      return { ok: true, html };
    }

    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalSize += value.byteLength;
      if (totalSize > URL_MAX_BYTES) {
        await reader.cancel();
        return { ok: false, error: "Réponse trop volumineuse (max 2 MB)." };
      }
      chunks.push(value);
    }
    const decoder = new TextDecoder("utf-8");
    const html = chunks.map((c) => decoder.decode(c, { stream: true })).join("");
    if (html.trim().length < 20) {
      return { ok: false, error: "HTML récupéré trop court pour être exploité." };
    }
    return { ok: true, html };
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") {
      return { ok: false, error: "Le fetch a expiré (timeout 15 s)." };
    }
    console.error("[fetchHtmlFromUrl] error:", err);
    return {
      ok: false,
      error: `Impossible de récupérer l'URL : ${(err as Error).message ?? "erreur inconnue"}.`,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Convertit un .pdf (ArrayBuffer) en HTML autonome stylé Speetch via
 * pdfjs-dist (build legacy pour Node, pas de worker nécessaire).
 *
 * Stratégie d'extraction :
 *  - une page PDF = une section HTML (séparateur visuel)
 *  - dans une page, les items text sont regroupés en paragraphes en
 *    détectant les sauts de ligne via la position Y (transform[5])
 *  - le titre est repris des métadonnées PDF (info.Title) si présent
 *
 * Le rendu n'est pas WYSIWYG (pas de mise en page absolue) mais le
 * texte est récupéré dans l'ordre de lecture, ce qui suffit pour une
 * note de contexte interne.
 */
export async function convertPdfToHtml(
  buffer: ArrayBuffer,
  fallbackTitle: string,
): Promise<{ html: string; extractedTitle: string | null }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    // Pas de worker côté Node : le build legacy fait tout dans le thread
    // principal. Désactiver explicitement évite un warning.
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const doc = await loadingTask.promise;

  // Titre depuis les métadonnées PDF si disponible
  let metaTitle: string | null = null;
  try {
    const meta = await doc.getMetadata();
    const info = meta.info as { Title?: string };
    if (info?.Title) {
      const trimmed = info.Title.trim();
      if (trimmed.length >= 2) metaTitle = trimmed;
    }
  } catch {
    // métadonnées absentes ou illisibles — on ignore
  }

  const pageBlocks: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // Reconstruit les paragraphes en regardant les sauts de ligne :
    // un saut Y > 4pt entre deux items = nouveau paragraphe.
    const paragraphs: string[] = [];
    let current = "";
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const it = item as { str: string; transform: number[] };
      const y = it.transform[5];
      const str = it.str;
      if (lastY !== null) {
        const dy = Math.abs(y - lastY);
        if (dy > 4) {
          // nouvelle ligne / nouveau paragraphe
          if (current.trim().length > 0) {
            paragraphs.push(current.trim());
          }
          current = "";
        } else if (current.length > 0 && !current.endsWith(" ")) {
          current += " ";
        }
      }
      current += str;
      lastY = y;
    }
    if (current.trim().length > 0) {
      paragraphs.push(current.trim());
    }

    const paragraphsHtml = paragraphs
      .map(
        (p) =>
          `<p>${p
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</p>`,
      )
      .join("\n");

    pageBlocks.push(
      `<section class="pdf-page" data-page="${i}">
  <p class="pdf-page-label">Page ${i} / ${doc.numPages}</p>
  ${paragraphsHtml}
</section>`,
    );
  }

  await doc.destroy();

  // Si aucun titre des métadonnées, essaie de prendre la première ligne
  // non vide du premier paragraphe (souvent c'est le titre du document).
  let extractedTitle: string | null = metaTitle;
  if (!extractedTitle && pageBlocks.length > 0) {
    const firstParaMatch = pageBlocks[0].match(/<p>(?!<)(.+?)<\/p>/);
    if (firstParaMatch) {
      const candidate = firstParaMatch[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
      if (candidate.length >= 2 && candidate.length <= 120) {
        extractedTitle = candidate;
      }
    }
  }

  const finalTitle = extractedTitle ?? fallbackTitle;
  const safeTitle = finalTitle
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${safeTitle}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    max-width: 720px;
    margin: 0 auto;
    padding: 5rem 1.75rem 6rem;
    color: #1a1a1a;
    line-height: 1.7;
    background: #fafaf7;
    font-size: 16px;
  }
  h1 {
    font-weight: 200;
    font-size: clamp(2rem, 5vw, 3rem);
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin: 0 0 2rem;
    color: #111;
  }
  .pdf-page {
    margin: 0 0 3.5rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e5e0d8;
  }
  .pdf-page:last-of-type {
    border-bottom: 0;
    padding-bottom: 0;
  }
  .pdf-page-label {
    margin: 0 0 1.25rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.32em;
    color: #999;
  }
  p { margin: 0 0 1rem; }
  p:last-child { margin-bottom: 0; }
</style>
</head>
<body>
<h1>${safeTitle}</h1>
${pageBlocks.join("\n")}
</body>
</html>`;

  return { html, extractedTitle };
}

/**
 * Convertit un .xlsx (ArrayBuffer) en HTML autonome stylé Speetch via
 * SheetJS. Chaque feuille devient une `<section>` avec son nom en
 * heading et son contenu rendu en `<table>` HTML.
 *
 * Le titre est repris des Properties.Title du workbook si présent.
 */
export async function convertXlsxToHtml(
  buffer: ArrayBuffer,
  fallbackTitle: string,
): Promise<{ html: string; extractedTitle: string | null }> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });

  // Titre depuis les Properties du workbook si présent
  let extractedTitle: string | null = null;
  const props = wb.Props as { Title?: string } | undefined;
  if (props?.Title) {
    const trimmed = props.Title.trim();
    if (trimmed.length >= 2) extractedTitle = trimmed;
  }

  const sheetBlocks: string[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    if (!sheet) continue;
    // sheet_to_html renvoie un document HTML complet — on extrait juste
    // le `<table>...</table>` pour le réinsérer dans notre shell stylé.
    const rawHtml = XLSX.utils.sheet_to_html(sheet, {
      id: `sheet-${name.replace(/[^a-z0-9_-]/gi, "-")}`,
      editable: false,
    });
    const tableMatch = rawHtml.match(/<table[\s\S]*<\/table>/i);
    const tableHtml = tableMatch ? tableMatch[0] : rawHtml;
    const safeName = name
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    sheetBlocks.push(
      `<section class="xlsx-sheet">
  <h2 class="xlsx-sheet-name">${safeName}</h2>
  <div class="xlsx-table-wrap">${tableHtml}</div>
</section>`,
    );
  }

  const finalTitle = extractedTitle ?? fallbackTitle;
  const safeTitle = finalTitle
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${safeTitle}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    max-width: 1080px;
    margin: 0 auto;
    padding: 5rem 1.75rem 6rem;
    color: #1a1a1a;
    line-height: 1.5;
    background: #fafaf7;
    font-size: 14px;
  }
  h1 {
    font-weight: 200;
    font-size: clamp(2rem, 5vw, 3rem);
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin: 0 0 2.5rem;
    color: #111;
  }
  .xlsx-sheet { margin: 0 0 3.5rem; }
  .xlsx-sheet-name {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.32em;
    color: #555;
    margin: 0 0 1rem;
  }
  .xlsx-table-wrap {
    overflow-x: auto;
    border: 1px solid #e5e0d8;
    border-radius: 4px;
    background: #fff;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.85rem;
  }
  td, th {
    border-right: 1px solid #eee;
    border-bottom: 1px solid #eee;
    padding: 0.4rem 0.6rem;
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
    color: #1a1a1a;
  }
  td:last-child, th:last-child { border-right: 0; }
  tr:last-child td { border-bottom: 0; }
  tr:nth-child(even) td { background: #fafaf7; }
  th { background: #f0eee8; font-weight: 500; }
</style>
</head>
<body>
<h1>${safeTitle}</h1>
${sheetBlocks.join("\n")}
</body>
</html>`;

  return { html, extractedTitle };
}
