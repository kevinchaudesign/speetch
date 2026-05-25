/**
 * Coloration syntaxique des blocs `type: "code"` via shiki.
 *
 * Rendu côté serveur : la page publique (`app/clients/[…]/page.tsx`) pré-rend
 * chaque section code en HTML coloré, et passe une map `sectionId → html` aux
 * views client. Coût client : 0 pour la coloration (juste le bouton Copier).
 *
 * Pour ajouter un langage : ajouter à `CODE_LANGUAGES` ET vérifier que shiki
 * le supporte (https://shiki.style/languages).
 */
import {
  createHighlighter,
  type BundledLanguage,
  type Highlighter,
} from "shiki";

const SHIKI_LANGUAGES = [
  "html",
  "css",
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "json",
  "bash",
  "shell",
  "markdown",
  "python",
  "sql",
] as const satisfies readonly BundledLanguage[];

/** Langages exposés à l'admin (inclut "text" qui désactive la coloration). */
export const CODE_LANGUAGES = ["text", ...SHIKI_LANGUAGES] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const CODE_LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  text: "Texte brut",
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  typescript: "TypeScript",
  jsx: "JSX",
  tsx: "TSX",
  json: "JSON",
  bash: "Bash",
  shell: "Shell",
  markdown: "Markdown",
  python: "Python",
  sql: "SQL",
};

const DARK_THEME = "vesper";
const LIGHT_THEME = "min-light";

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [DARK_THEME, LIGHT_THEME],
      langs: [...SHIKI_LANGUAGES],
    });
  }
  return highlighterPromise;
}

export function isCodeLanguage(value: string | undefined): value is CodeLanguage {
  if (!value) return false;
  return (CODE_LANGUAGES as readonly string[]).includes(value);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
}

function fallbackHtml(code: string): string {
  return `<pre class="shiki" style="background-color:transparent"><code>${escapeHtml(code)}</code></pre>`;
}

export async function highlightCode(
  code: string,
  lang: string | undefined,
  variant: "dark" | "light" = "dark",
): Promise<string> {
  if (!code) return fallbackHtml("");
  const language = isCodeLanguage(lang) ? lang : "text";
  if (language === "text") return fallbackHtml(code);
  const theme = variant === "dark" ? DARK_THEME : LIGHT_THEME;
  try {
    const h = await getHighlighter();
    return h.codeToHtml(code, { lang: language, theme });
  } catch (err) {
    console.error("[highlightCode] failed:", err);
    return fallbackHtml(code);
  }
}
