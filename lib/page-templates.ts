/**
 * Catalog des templates de page proposés à la création.
 *
 * Pour ajouter/retirer un template code : éditer cette const.
 * - `id` est stocké dans `pages.template_id` (snake_case stable côté code,
 *   UUID côté DB)
 * - `label` / `tagline` / `description` sont affichés à l'admin
 * - `defaultContent` est le contenu pré-rempli copié dans `pages.content`
 *   au moment de la création. Les IDs de sections (`__SECTION_N__`) sont
 *   remplacés par des uuids frais via `instantiateTemplate()`.
 *
 * Les templates en BDD (`page_templates`) coexistent avec ces presets code :
 * voir `lib/page-templates-db.ts` pour le chargement combiné.
 *
 * ⚠ Ne renomme JAMAIS un `id` déjà utilisé : ça orphelinerait les pages
 * existantes. Préfère désactiver (retirer de la liste) plutôt que renommer.
 */
import type { PageContent } from "@/types/database";

export type PageTemplate = {
  id: string;
  label: string;
  tagline: string;
  description?: string;
  defaultContent: PageContent;
  source: "code" | "db" | "raw_html_virtual";
  projectType?: string | null;
};

/**
 * Sentinelle pour la tuile "Reproduction fidèle" du picker : ce n'est pas un
 * vrai template stocké, c'est juste un marqueur qui déclenche un flow
 * d'upload HTML direct (cf. createRawHtmlPage).
 */
export const RAW_HTML_VIRTUAL_TEMPLATE_ID = "_raw_html";

/**
 * Sentinelle pour les pages détachées de leur template d'origine. La page
 * garde son contenu intact, mais perd toute référence vers un preset ou un
 * template BDD. Utilisée par l'action `detachPage`.
 */
export const CUSTOM_TEMPLATE_ID = "_custom";

/** Vrai si la page n'est rattachée à aucun template (raw direct OU détachée). */
export function isStandaloneTemplateId(value: string): boolean {
  return value === RAW_HTML_VIRTUAL_TEMPLATE_ID || value === CUSTOM_TEMPLATE_ID;
}

export const RAW_HTML_VIRTUAL_TEMPLATE: PageTemplate = {
  id: RAW_HTML_VIRTUAL_TEMPLATE_ID,
  label: "Reproduction fidèle",
  tagline: "Uploade un HTML, la page le rendra à l'identique",
  description:
    "Pas de conversion. Le HTML est stocké tel quel et affiché dans un iframe sandbox sur la page publique. Idéal pour reproduire un document avec sa mise en page d'origine (tables, callouts, signatures…).",
  source: "raw_html_virtual",
  projectType: null,
  defaultContent: { intro: "", sections: [] },
};

export const PAGE_TEMPLATES: readonly PageTemplate[] = [
  {
    id: "blank",
    label: "Page blanche",
    tagline: "Démarre sans aucune section pré-remplie",
    source: "code",
    projectType: null,
    defaultContent: {
      intro: "",
      sections: [],
    },
  },
  {
    id: "presentation",
    label: "Présentation",
    tagline: "Intro + deux blocs de texte pour cadrer le projet",
    description: "Idéal pour partager un brief, une intention ou un contexte.",
    source: "code",
    projectType: null,
    defaultContent: {
      intro: "Une introduction courte pour donner le ton de la page.",
      sections: [
        {
          id: "__SECTION_1__",
          type: "text",
          title: "Contexte",
          body: "Quelques mots sur le pourquoi de ce projet et les attentes.",
        },
        {
          id: "__SECTION_2__",
          type: "text",
          title: "Approche",
          body: "La façon dont nous allons aborder le sujet, étape par étape.",
        },
      ],
    },
  },
  {
    id: "moodboard",
    label: "Moodboard",
    tagline: "Galerie d'images pour partager une direction visuelle",
    source: "code",
    projectType: null,
    defaultContent: {
      intro: "Inspirations et références visuelles.",
      sections: [
        {
          id: "__SECTION_1__",
          type: "gallery",
          title: "Direction visuelle",
          media: [],
        },
      ],
    },
  },
  {
    id: "deliverable",
    label: "Livrable",
    tagline: "Une intro, un texte et une galerie pour présenter un rendu",
    source: "code",
    projectType: null,
    defaultContent: {
      intro: "Le livrable final, prêt à être consulté.",
      sections: [
        {
          id: "__SECTION_1__",
          type: "text",
          title: "Description",
          body: "Quelques mots sur la version livrée et les choix retenus.",
        },
        {
          id: "__SECTION_2__",
          type: "gallery",
          title: "Galerie",
          media: [],
        },
      ],
    },
  },
  {
    id: "deliverables_review",
    label: "Livrables (validation)",
    tagline: "Galerie de livrables avec retours et statut par item",
    description:
      "Idéal pour présenter un set de visuels (campagne ads, formats variés, etc.) à un client. Chaque livrable affiche son média, son format, et le client peut commenter + changer le statut (approuvé / modif demandée). Les livrables ne sont PAS stockés dans le content de la page mais dans la table client_page_deliverables.",
    source: "code",
    projectType: null,
    defaultContent: {
      intro:
        "Présentation des livrables. Pour chaque visuel : laisse un retour ou valide.",
      sections: [],
      meta: {
        style: "deliverables",
      },
    },
  },
  {
    id: "process",
    label: "Process",
    tagline: "Trois étapes numérotées pour décrire une démarche",
    source: "code",
    projectType: null,
    defaultContent: {
      intro: "Notre démarche, étape par étape.",
      sections: [
        {
          id: "__SECTION_1__",
          type: "text",
          title: "01 · Découverte",
          body: "Cadrage du besoin, analyse de l'existant.",
        },
        {
          id: "__SECTION_2__",
          type: "text",
          title: "02 · Conception",
          body: "Exploration créative, itérations, choix de direction.",
        },
        {
          id: "__SECTION_3__",
          type: "text",
          title: "03 · Livraison",
          body: "Finalisation, livrables et accompagnement.",
        },
      ],
    },
  },
];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCodeTemplateId(value: string): boolean {
  return PAGE_TEMPLATES.some((t) => t.id === value);
}

export function isDbTemplateId(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function isValidTemplateId(value: string): boolean {
  return isCodeTemplateId(value) || isDbTemplateId(value);
}

export function getPageTemplate(
  id: string | null | undefined,
): PageTemplate | null {
  if (!id) return null;
  return PAGE_TEMPLATES.find((t) => t.id === id) ?? null;
}

/**
 * Clone le `defaultContent` d'un template en remplaçant les IDs de sections
 * placeholder par des identifiants frais (générés par l'appelant). Renvoie
 * un nouvel objet, safe à stocker en JSONB.
 *
 * Le générateur d'IDs est injecté pour garder ce module browser-safe — le
 * Server Action passe `randomUUID` de `node:crypto`.
 */
export function instantiateTemplate(
  template: PageTemplate,
  generateId: () => string,
): PageContent {
  return {
    intro: template.defaultContent.intro,
    sections: (template.defaultContent.sections ?? []).map((section) => ({
      ...section,
      id: generateId(),
      media: section.media ? section.media.map((m) => ({ ...m })) : undefined,
    })),
    meta: template.defaultContent.meta
      ? { ...template.defaultContent.meta }
      : undefined,
  };
}
