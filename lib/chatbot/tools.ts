/**
 * Outils Anthropic mis à disposition de l'assistant Speetch.
 *
 * V1 : un seul outil — `propose_image_change`. Claude ne mute pas la BDD
 * directement : il génère une « proposition » que le front affiche sous
 * forme de carte d'aperçu (vieille image → nouvelle image), puis l'admin
 * clique sur « Appliquer » pour valider via `/api/admin/assistant/apply`.
 *
 * L'outil côté serveur ne fait que **valider** la proposition : il vérifie
 * que la page appartient bien au client courant (slug extrait du pathname),
 * que la section ciblée est de type image/gallery/video, et que l'URL
 * d'arrivée existe dans la médiathèque du client. Il renvoie ensuite un
 * payload d'aperçu qui sera diffusé en SSE au front.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/server";
import { isValidSlug } from "@/lib/slug";
import type { Json, PageContent } from "@/types/database";

/**
 * Outil raw_html : ajoute une entrée dans `content.meta.image_overrides`
 * (clé = src originale, valeur = nouvelle URL médiathèque).
 */
export const PROPOSE_IMAGE_OVERRIDE_TOOL: Anthropic.Tool = {
  name: "propose_image_override",
  description: [
    "Propose à l'admin un swap d'image sur une page « raw_html » du client courant — ajoute (ou remplace) une entrée dans le map `image_overrides` de la page.",
    "L'admin verra une carte d'aperçu (image actuelle → image proposée) avec un bouton « Appliquer ».",
    "Utilise UNIQUEMENT des URLs présentes dans la médiathèque du snapshot — n'invente jamais.",
  ].join(" "),
  input_schema: {
    type: "object",
    required: ["page_id", "original_src", "new_media_url", "reason"],
    properties: {
      page_id: {
        type: "string",
        description: "UUID de la page raw_html ciblée.",
      },
      original_src: {
        type: "string",
        description:
          "Valeur exacte de l'attribut `src` ORIGINAL de l'image (clé dans `image_overrides`). L'admin vient de cliquer dessus, la valeur t'est fournie en contexte.",
      },
      new_media_url: {
        type: "string",
        description:
          "URL publique de la médiathèque à utiliser comme override.",
      },
      reason: {
        type: "string",
        description: "Phrase courte affichée sur la carte d'aperçu.",
      },
    },
  },
};

/**
 * Outil raw_html : ajoute une entrée dans `content.meta.text_overrides`
 * (clé = texte original trimmed, valeur = texte de remplacement).
 */
export const PROPOSE_TEXT_OVERRIDE_TOOL: Anthropic.Tool = {
  name: "propose_text_override",
  description: [
    "Propose à l'admin une réécriture d'un bloc texte sur une page « raw_html » du client courant — ajoute une entrée dans le map `text_overrides`.",
    "L'admin verra une carte d'aperçu (avant / après) avec un bouton « Appliquer ».",
    "Conserve la langue, le ton, la longueur approximative. Ne JAMAIS réécrire sans intention claire de l'admin.",
  ].join(" "),
  input_schema: {
    type: "object",
    required: ["page_id", "original_text", "new_text", "reason"],
    properties: {
      page_id: { type: "string", description: "UUID de la page raw_html." },
      original_text: {
        type: "string",
        description:
          "Texte original trimmed (clé exacte dans `text_overrides`). Fourni en contexte par l'admin.",
      },
      new_text: {
        type: "string",
        description: "Texte de remplacement proposé.",
      },
      reason: {
        type: "string",
        description: "Phrase courte affichée sur la carte d'aperçu.",
      },
    },
  },
};

export const PROPOSE_IMAGE_CHANGE_TOOL: Anthropic.Tool = {
  name: "propose_image_change",
  description: [
    "Propose à l'admin un swap d'image sur une page « document » (sections JSON) du client courant.",
    "L'admin verra une carte d'aperçu (image actuelle → image proposée) avec un bouton « Appliquer ».",
    "N'utilise CETTE FONCTION que pour des sections de type image, gallery ou video.",
    "Toutes les valeurs (page_id, section_id, new_media_url) doivent venir du snapshot client fourni en system prompt.",
    "Ne JAMAIS inventer d'URL : utilise UNIQUEMENT des URLs présentes dans la médiathèque du snapshot.",
    "Tu peux appeler l'outil plusieurs fois en parallèle pour grouper des swaps cohérents (ex: une gallery complète).",
  ].join(" "),
  input_schema: {
    type: "object",
    required: ["page_id", "section_id", "new_media_url", "reason"],
    properties: {
      page_id: {
        type: "string",
        description: "UUID exact de la page à modifier (cf. snapshot).",
      },
      section_id: {
        type: "string",
        description:
          "ID de la section ciblée dans la page (cf. snapshot, champ `section_id`).",
      },
      media_index: {
        type: "integer",
        minimum: 0,
        description:
          "Index dans section.media[] (0 par défaut, utile pour les galleries).",
      },
      new_media_url: {
        type: "string",
        description:
          "URL publique de la médiathèque qui remplacera l'image actuelle. Doit exister dans le snapshot.",
      },
      reason: {
        type: "string",
        description:
          "Phrase courte (1 phrase) qui sera affichée à l'admin sur la carte d'aperçu, pour justifier la proposition.",
      },
    },
  },
};

export type ProposeImageChangeInput = {
  page_id: string;
  section_id: string;
  media_index?: number;
  new_media_url: string;
  reason: string;
};

export type ProposeImageOverrideInput = {
  page_id: string;
  original_src: string;
  new_media_url: string;
  reason: string;
};

export type ProposeTextOverrideInput = {
  page_id: string;
  original_text: string;
  new_text: string;
  reason: string;
};

export type ImageChangeProposal = {
  kind: "image-section";
  proposal_id: string;
  client_slug: string;
  page_id: string;
  section_id: string;
  media_index: number;
  page_name: string;
  page_slug: string;
  project_name: string;
  project_slug: string;
  section_title: string;
  section_type: "image" | "video" | "gallery";
  old_url: string;
  new_url: string;
  old_caption: string | null;
  new_filename: string | null;
  reason: string;
};

export type ImageOverrideProposal = {
  kind: "image-override";
  proposal_id: string;
  client_slug: string;
  page_id: string;
  page_name: string;
  page_slug: string;
  project_name: string;
  project_slug: string;
  original_src: string;
  new_url: string;
  new_filename: string | null;
  reason: string;
};

export type TextOverrideProposal = {
  kind: "text-override";
  proposal_id: string;
  client_slug: string;
  page_id: string;
  page_name: string;
  page_slug: string;
  project_name: string;
  project_slug: string;
  original_text: string;
  new_text: string;
  reason: string;
};

export type AnyProposal =
  | ImageChangeProposal
  | ImageOverrideProposal
  | TextOverrideProposal;

export type ToolExecution =
  | {
      ok: true;
      proposal: AnyProposal;
      tool_result_text: string;
    }
  | {
      ok: false;
      error: string;
      tool_result_text: string;
    };

type ProjectRowLite = {
  id: string;
  name: string;
  slug: string;
  profile_id: string;
};
type ProfileRowLite = {
  id: string;
  slug: string | null;
};
type PageRowLite = {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  content: Json;
};
type MediaRowLite = {
  id: string;
  profile_id: string;
  storage_path: string;
  filename: string;
};

const MEDIA_BUCKET = "page-media";

/**
 * Exécute (= valide) une proposition de changement d'image proposée par Claude.
 * Ne mute RIEN — renvoie juste l'objet d'aperçu pour la carte d'UI.
 */
export async function executeProposeImageChange(
  input: ProposeImageChangeInput,
  ctx: { clientSlug: string },
): Promise<ToolExecution> {
  const fail = (error: string): ToolExecution => ({
    ok: false,
    error,
    tool_result_text: JSON.stringify({ ok: false, error }),
  });

  if (!isValidSlug(ctx.clientSlug)) {
    return fail("Slug client courant invalide.");
  }
  if (!input.page_id || typeof input.page_id !== "string") {
    return fail("page_id manquant ou invalide.");
  }
  if (!input.section_id || typeof input.section_id !== "string") {
    return fail("section_id manquant ou invalide.");
  }
  if (!input.new_media_url || typeof input.new_media_url !== "string") {
    return fail("new_media_url manquante.");
  }
  if (!input.reason || typeof input.reason !== "string") {
    return fail("reason manquante.");
  }
  const mediaIndex =
    typeof input.media_index === "number" && Number.isInteger(input.media_index)
      ? input.media_index
      : 0;

  const supabase = createAdminClient();

  // 1. Profil du client courant
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, slug")
    .eq("slug", ctx.clientSlug)
    .eq("is_owner", false)
    .maybeSingle<ProfileRowLite>();
  if (!profileRow) {
    return fail("Client courant introuvable.");
  }

  // 2. La page existe et appartient à un projet du client
  const { data: pageRow } = await supabase
    .from("pages")
    .select("id, project_id, name, slug, content")
    .eq("id", input.page_id)
    .maybeSingle<PageRowLite>();
  if (!pageRow) {
    return fail(`Page ${input.page_id} introuvable.`);
  }

  const { data: projectRow } = await supabase
    .from("projects")
    .select("id, name, slug, profile_id")
    .eq("id", pageRow.project_id)
    .maybeSingle<ProjectRowLite>();
  if (!projectRow) {
    return fail("Projet parent introuvable.");
  }
  if (projectRow.profile_id !== profileRow.id) {
    return fail(
      "Cette page n'appartient pas au client courant — action refusée.",
    );
  }

  // 3. La section ciblée est de type image/gallery/video
  const content = pageRow.content as PageContent | null;
  if (!content || !Array.isArray(content.sections)) {
    return fail("Le contenu de la page n'a pas de sections.");
  }
  const section = content.sections.find((s) => s.id === input.section_id);
  if (!section) {
    return fail(
      `Section ${input.section_id} absente de la page ${pageRow.name}.`,
    );
  }
  if (
    section.type !== "image" &&
    section.type !== "gallery" &&
    section.type !== "video"
  ) {
    return fail(
      `Section ${input.section_id} est de type \`${section.type}\` — pas remplaçable par cet outil.`,
    );
  }
  const media = Array.isArray(section.media) ? section.media : [];
  if (mediaIndex < 0 || mediaIndex >= media.length) {
    return fail(
      `media_index ${mediaIndex} hors borne (la section contient ${media.length} entrée(s)).`,
    );
  }
  const target = media[mediaIndex];
  const oldUrl = target?.url ?? "";

  // 4. new_media_url doit appartenir à la médiathèque du client
  const { data: mediaRows } = await supabase
    .from("client_media" as never)
    .select("id, profile_id, storage_path, filename")
    .eq("profile_id", profileRow.id);
  const candidates = (mediaRows ?? []) as unknown as MediaRowLite[];
  const matched = candidates.find((m) => {
    const { data } = supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(m.storage_path);
    return data?.publicUrl === input.new_media_url;
  });
  if (!matched) {
    return fail(
      "L'URL fournie n'est pas dans la médiathèque de ce client — action refusée.",
    );
  }

  // 5. Construit la proposition
  const proposal: ImageChangeProposal = {
    kind: "image-section",
    proposal_id: crypto.randomUUID(),
    client_slug: ctx.clientSlug,
    page_id: pageRow.id,
    section_id: section.id,
    media_index: mediaIndex,
    page_name: pageRow.name,
    page_slug: pageRow.slug,
    project_name: projectRow.name,
    project_slug: projectRow.slug,
    section_title: section.title ?? "(sans titre)",
    section_type: section.type,
    old_url: oldUrl,
    new_url: input.new_media_url,
    old_caption: target?.caption ?? null,
    new_filename: matched.filename,
    reason: input.reason,
  };

  return {
    ok: true,
    proposal,
    tool_result_text: JSON.stringify({
      ok: true,
      proposal_id: proposal.proposal_id,
      page_name: proposal.page_name,
      section_title: proposal.section_title,
      new_filename: matched.filename,
      preview_card_displayed: true,
    }),
  };
}

/**
 * Helper partagé : récupère profil + page + projet du client courant,
 * vérifie que la page appartient bien à ce client, et vérifie le style
 * « raw_html » si demandé.
 */
async function loadPageInClientScope(
  pageId: string,
  clientSlug: string,
  requireRawHtml: boolean,
): Promise<
  | {
      ok: true;
      profile: ProfileRowLite;
      project: ProjectRowLite;
      page: PageRowLite;
    }
  | { ok: false; error: string }
> {
  if (!isValidSlug(clientSlug)) {
    return { ok: false, error: "Slug client courant invalide." };
  }
  const supabase = createAdminClient();
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, slug")
    .eq("slug", clientSlug)
    .eq("is_owner", false)
    .maybeSingle<ProfileRowLite>();
  if (!profileRow) return { ok: false, error: "Client courant introuvable." };

  const { data: pageRow } = await supabase
    .from("pages")
    .select("id, project_id, name, slug, content")
    .eq("id", pageId)
    .maybeSingle<PageRowLite>();
  if (!pageRow) return { ok: false, error: `Page ${pageId} introuvable.` };

  const { data: projectRow } = await supabase
    .from("projects")
    .select("id, name, slug, profile_id")
    .eq("id", pageRow.project_id)
    .maybeSingle<ProjectRowLite>();
  if (!projectRow) return { ok: false, error: "Projet parent introuvable." };
  if (projectRow.profile_id !== profileRow.id) {
    return {
      ok: false,
      error: "Cette page n'appartient pas au client courant — action refusée.",
    };
  }
  if (requireRawHtml) {
    const content = pageRow.content as PageContent | null;
    if (content?.meta?.style !== "raw_html") {
      return {
        ok: false,
        error: `Cette page n'est pas en mode raw_html (style=${content?.meta?.style ?? "default"}).`,
      };
    }
  }
  return { ok: true, profile: profileRow, project: projectRow, page: pageRow };
}

export async function executeProposeImageOverride(
  input: ProposeImageOverrideInput,
  ctx: { clientSlug: string },
): Promise<ToolExecution> {
  const fail = (error: string): ToolExecution => ({
    ok: false,
    error,
    tool_result_text: JSON.stringify({ ok: false, error }),
  });

  if (!input.page_id || !input.original_src || !input.new_media_url || !input.reason) {
    return fail("Champs requis manquants.");
  }

  const scoped = await loadPageInClientScope(
    input.page_id,
    ctx.clientSlug,
    true,
  );
  if (!scoped.ok) return fail(scoped.error);
  const { profile, project, page } = scoped;

  // L'URL d'arrivée doit être dans la médiathèque du client
  const supabase = createAdminClient();
  const { data: mediaRows } = await supabase
    .from("client_media" as never)
    .select("id, profile_id, storage_path, filename")
    .eq("profile_id", profile.id);
  const candidates = (mediaRows ?? []) as unknown as MediaRowLite[];
  const matched = candidates.find((m) => {
    const { data } = supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(m.storage_path);
    return data?.publicUrl === input.new_media_url;
  });
  if (!matched) {
    return fail(
      "L'URL fournie n'est pas dans la médiathèque de ce client — action refusée.",
    );
  }

  const proposal: ImageOverrideProposal = {
    kind: "image-override",
    proposal_id: crypto.randomUUID(),
    client_slug: ctx.clientSlug,
    page_id: page.id,
    page_name: page.name,
    page_slug: page.slug,
    project_name: project.name,
    project_slug: project.slug,
    original_src: input.original_src,
    new_url: input.new_media_url,
    new_filename: matched.filename,
    reason: input.reason,
  };

  return {
    ok: true,
    proposal,
    tool_result_text: JSON.stringify({
      ok: true,
      proposal_id: proposal.proposal_id,
      page_name: page.name,
      new_filename: matched.filename,
      preview_card_displayed: true,
    }),
  };
}

export async function executeProposeTextOverride(
  input: ProposeTextOverrideInput,
  ctx: { clientSlug: string },
): Promise<ToolExecution> {
  const fail = (error: string): ToolExecution => ({
    ok: false,
    error,
    tool_result_text: JSON.stringify({ ok: false, error }),
  });

  if (
    !input.page_id ||
    !input.original_text ||
    !input.new_text ||
    !input.reason
  ) {
    return fail("Champs requis manquants.");
  }
  if (input.new_text === input.original_text) {
    return fail("Le texte de remplacement est identique à l'original.");
  }
  if (input.original_text.length > 2000 || input.new_text.length > 2000) {
    return fail("Texte trop long (>2000 caractères).");
  }

  const scoped = await loadPageInClientScope(
    input.page_id,
    ctx.clientSlug,
    true,
  );
  if (!scoped.ok) return fail(scoped.error);
  const { project, page } = scoped;

  const proposal: TextOverrideProposal = {
    kind: "text-override",
    proposal_id: crypto.randomUUID(),
    client_slug: ctx.clientSlug,
    page_id: page.id,
    page_name: page.name,
    page_slug: page.slug,
    project_name: project.name,
    project_slug: project.slug,
    original_text: input.original_text,
    new_text: input.new_text,
    reason: input.reason,
  };

  return {
    ok: true,
    proposal,
    tool_result_text: JSON.stringify({
      ok: true,
      proposal_id: proposal.proposal_id,
      page_name: page.name,
      preview_card_displayed: true,
    }),
  };
}
