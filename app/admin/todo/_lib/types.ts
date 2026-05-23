/**
 * Types locaux pour l'app Tâches Jedi (tables todo_lists, todo_notes).
 * Les tables ne sont pas encore dans types/database.ts régénéré — on les
 * tape ici et on utilise `as never` côté queries supabase.
 */

export type TodoListRow = {
  id: string;
  profile_id: string;
  name: string;
  color: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type TodoNoteRow = {
  id: string;
  profile_id: string;
  list_id: string | null;
  content: string;
  is_pinned: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

/** Type UI pour la liste affichée (avec count). */
export type TodoListItem = {
  id: string;
  name: string;
  color: string | null;
  count: number;
};

/** Type UI pour les notes affichées dans la colonne centrale. */
export type TodoNoteItem = {
  id: string;
  list_id: string | null;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Strip le HTML pour extraire le texte brut (utilisé pour titre + preview
 * dans la NotesPanel). Supporte aussi le plain text (passthrough).
 *
 * Implémentation simple sans DOMParser pour fonctionner côté server et
 * client. Convertit <br>, <p>, <li>, <h*> en \n pour préserver les sauts
 * de ligne sémantiques.
 */
function stripHtml(content: string): string {
  if (!content) return "";
  // Si c'est du plain text sans tags HTML, retourne tel quel
  if (!/<[a-z][^>]*>/i.test(content)) return content;
  return content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|li|h[1-6]|ul|ol)[^>]*>/gi, "\n")
    .replace(/<input[^>]*type=["']checkbox["'][^>]*>/gi, "☐ ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Extrait le titre (première ligne non-vide) + le preview (lignes 2-3)
 * d'une note. Comportement Notes iOS. Strip d'abord les tags HTML pour
 * supporter le contenu Tiptap.
 */
export function splitNoteContent(content: string): {
  title: string;
  preview: string;
} {
  const text = stripHtml(content);
  const lines = text.split("\n");
  let title = "";
  let titleIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length > 0) {
      title = trimmed;
      titleIdx = i;
      break;
    }
  }
  // Preview : prochaines lignes non-vides après le titre, max 2 lignes
  let preview = "";
  if (titleIdx >= 0) {
    const rest = lines.slice(titleIdx + 1).filter((l) => l.trim().length > 0);
    preview = rest.slice(0, 2).join(" · ").trim();
  }
  return { title, preview };
}
