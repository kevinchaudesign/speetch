"use client";

/**
 * <AdminAssistant> — assistant flottant FWA-grade des pages admin.
 *
 * Pièces maîtresses du craft :
 * - Orb partagé entre l'avatar fermé (bas-droite) et le médaillon dans le
 *   header du panneau, animé par Framer Motion via `layoutId="speetch-orb"`.
 *   Au clic, l'orbe vole littéralement du coin jusque dans le panneau.
 * - Idle breathing (échelle subtile) + halo rotatif lent.
 * - Panneau en glassmorphism stratifié, hairline animée, grain de film,
 *   noise overlay, easing signature ease-out-expo.
 * - État vide éditorial : greeting serif italique adapté à l'heure, prompts
 *   contextuels à la page courante, clic = soumission immédiate.
 * - Contexte de page = chip animé (AnimatePresence) qui se met à jour sur
 *   chaque changement de pathname.
 * - Streaming SSE token par token avec caret clignotant en fin de réponse.
 * - Markdown léger (marked) côté client, pré-escape de < > & pour bloquer
 *   l'injection HTML.
 * - Auto-scroll intelligent : ne suit que si l'utilisateur est déjà en bas.
 * - Bouton « Envoyer » morphe en « Arrêter » pendant le streaming.
 * - Hairline qui s'étend sur focus de l'input.
 */

import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
} from "framer-motion";
import { marked } from "marked";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import {
  playLightsaberIgnite,
  playLightsaberOff,
} from "@/lib/sw/audio";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

marked.setOptions({ breaks: true, gfm: true });

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

/**
 * Expressions de l'ara kawai — chacune correspond à un état app :
 * - happy   : repos
 * - thinking: Claude réfléchit (pending, pas encore de contenu)
 * - talking : Claude streame une réponse (pending + contenu)
 * - wink    : réponse arrivée, panneau fermé (hasUnread)
 * - focused : utilisateur tape ou a un draft (input focused / non vide)
 * - sparkle : snapshot client temps-réel actif dans le prompt
 * - dizzy   : erreur réseau ou serveur
 */
export type AvatarExpression =
  | "happy"
  | "thinking"
  | "talking"
  | "wink"
  | "focused"
  | "sparkle"
  | "dizzy";

/**
 * Carte d'aperçu d'une action proposée par Claude — trois variantes :
 *  - `image-section` : page « document », swap dans content.sections[i].media[j]
 *  - `image-override` : page « raw_html », ajout dans content.meta.image_overrides
 *  - `text-override`  : page « raw_html », ajout dans content.meta.text_overrides
 */
type CommonProposalFields = {
  proposal_id: string;
  bubble_id: string;
  client_slug: string;
  page_id: string;
  page_name: string;
  page_slug: string;
  project_name: string;
  project_slug: string;
  reason: string;
  status: "pending" | "applying" | "applied" | "error";
  error?: string;
};

export type ImageChangeProposalUI = CommonProposalFields & {
  kind: "image-section";
  section_id: string;
  media_index: number;
  section_title: string;
  section_type: "image" | "video" | "gallery";
  old_url: string;
  new_url: string;
  old_caption: string | null;
  new_filename: string | null;
};

export type ImageOverrideProposalUI = CommonProposalFields & {
  kind: "image-override";
  original_src: string;
  new_url: string;
  new_filename: string | null;
};

export type TextOverrideProposalUI = CommonProposalFields & {
  kind: "text-override";
  original_text: string;
  new_text: string;
};

export type AnyProposalUI =
  | ImageChangeProposalUI
  | ImageOverrideProposalUI
  | TextOverrideProposalUI;

type RouteContext = {
  /** Label court à afficher dans la chip (eyebrow tracking 0.32em). */
  label: string;
  /** Prompts suggérés contextuels — clic = soumission. */
  prompts: string[];
};

const ROUTE_CONTEXTS: Array<{ match: RegExp; build: () => RouteContext }> = [
  {
    match: /^\/admin\/?$/,
    build: () => ({
      label: "Conseil",
      prompts: [
        "Par quoi commencer pour forger un nouvel Holocron ?",
        "Différence entre Mission et lot, quelle est-elle ?",
        "Sceller un Holocron une fois prêt, comment ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/new\/?$/,
    build: () => ({
      label: "Forge holocron",
      prompts: [
        "Quelles infos obligatoires pour forger un Holocron ?",
        "Le slug auto-généré, comment fonctionne-t-il ?",
        "Le code holocron, à quoi sert-il exactement ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/?$/,
    build: () => ({
      label: "Holocrons",
      prompts: [
        "Un Holocron non scellé, comment le retrouver ?",
        "Dupliquer un Holocron existant, possible ?",
        "Le lien d'un Holocron au Padawan, comment le transmettre ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/[^/]+\/projects\/new\/?$/,
    build: () => ({
      label: "Nouvelle mission",
      prompts: [
        "Quel statut choisir au démarrage d'une Mission ?",
        "Le slug de la Mission apparaît-il dans l'URL publique ?",
        "Plusieurs parchemins dans une Mission, on peut ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/[^/]+\/projects\/[^/]+\/pages\/new\/?$/,
    build: () => ({
      label: "Nouveau parchemin",
      prompts: [
        "Quelle voie d'entrée choisir pour ce parchemin ?",
        "Réplique fidèle vs Forge ouverte, quand utiliser quoi ?",
        "Importer un .docx ou un .pdf ici, comment ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/[^/]+\/projects\/[^/]+\/pages\/[^/]+\/?$/,
    build: () => ({
      label: "Affûtage parchemin",
      prompts: [
        "Ajouter une annotation fluo à un passage, comment ?",
        "Attacher une note à ce parchemin, possible ?",
        "Réorganiser les sections, comment faire ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/[^/]+\/projects\/[^/]+\/?$/,
    build: () => ({
      label: "Mission",
      prompts: [
        "Créer un lot pour grouper des parchemins, comment ?",
        "Réorganiser les parchemins d'une Mission, comment ?",
        "Désactiver cette Mission temporairement, possible ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/[^/]+\/context\/new\/?$/,
    build: () => ({
      label: "Nouveau parchemin d'archive",
      prompts: [
        "Quels formats supportés à l'import ?",
        "Le parchemin visible côté Padawan, oui ou non ?",
        "Réutiliser ce contenu dans un parchemin, comment ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/[^/]+\/context\/[^/]+\/?$/,
    build: () => ({
      label: "Affûtage parchemin",
      prompts: [
        "Sceller ce parchemin d'archive, comment ?",
        "Éditer le titre sans casser le lien, possible ?",
        "Effacer ce parchemin, comment ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/[^/]+\/context\/?$/,
    build: () => ({
      label: "Archives",
      prompts: [
        "À quoi servent les Archives côté Padawan ?",
        "Quels formats puis-je confier à la Force ici ?",
        "Comment ordonner les parchemins ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/[^/]+\/design\/?$/,
    build: () => ({
      label: "Charte Holocron",
      prompts: [
        "Changer la couleur d'accent de cet Holocron, comment ?",
        "Prévisualiser le rendu côté Padawan, possible ?",
        "Revenir à la charte par défaut, comment ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/[^/]+\/media\/?$/,
    build: () => ({
      label: "Médiathèque",
      prompts: [
        "Organiser les fichiers en dossiers, comment ?",
        "Quelle taille max pour une image ou vidéo ?",
        "Réutiliser un média dans un parchemin, comment ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/[^/]+\/personas\/?$/,
    build: () => ({
      label: "Audiences",
      prompts: [
        "À quoi servent les Audiences pour cet Holocron ?",
        "Forger une nouvelle Audience, comment ?",
        "Lier une Audience à une Mission, possible ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/[^/]+\/personas\/[^/]+\/?$/,
    build: () => ({
      label: "Affûtage Audience",
      prompts: [
        "Tagger des visuels sur cette Audience, comment ?",
        "Définir la vignette de l'Audience, comment ?",
        "Effacer cette Audience, possible ?",
      ],
    }),
  },
  {
    match: /^\/admin\/clients\/[^/]+\/?$/,
    build: () => ({
      label: "Holocron",
      prompts: [
        "Régénérer le code holocron, comment ?",
        "Sceller cet Holocron pour le rendre public, comment ?",
        "Où se trouve la médiathèque de cet Holocron ?",
      ],
    }),
  },
  {
    match: /^\/admin\/templates\/new\/?$/,
    build: () => ({
      label: "Forge blueprint",
      prompts: [
        "Quel parchemin HTML donne les meilleurs résultats ?",
        "La Force, comment convertit-elle le HTML en sections ?",
        "Modifier les sections par défaut après, possible ?",
      ],
    }),
  },
  {
    match: /^\/admin\/templates\/[^/]+\/?$/,
    build: () => ({
      label: "Affûtage blueprint",
      prompts: [
        "Recharger ce blueprint depuis un nouveau HTML, comment ?",
        "Dupliquer ce blueprint, possible ?",
        "L'utiliser pour forger un parchemin, comment ?",
      ],
    }),
  },
  {
    match: /^\/admin\/templates\/?$/,
    build: () => ({
      label: "Blueprints",
      prompts: [
        "À quoi servent les Blueprints dans le Conseil ?",
        "Partir d'un site existant pour forger un Blueprint, comment ?",
        "Versionner mes Blueprints, possible ?",
      ],
    }),
  },
  {
    match: /^\/admin\/settings\/design-system\/?$/,
    build: () => ({
      label: "Codex",
      prompts: [
        "Quelle est la grammaire typographique du Codex ?",
        "Quand utiliser un Hairline plutôt qu'un Button ?",
        "Ajouter une nouvelle primitive au Codex, comment ?",
      ],
    }),
  },
  {
    match: /^\/admin\/settings\/profile\/?$/,
    build: () => ({
      label: "Identité Jedi",
      prompts: [
        "Changer mon sigil holographique, comment ?",
        "Mon nom de Maître apparaît-il publiquement ?",
        "Changer mon code d'accès au Conseil, comment ?",
      ],
    }),
  },
  {
    match: /^\/admin\/settings\/?$/,
    build: () => ({
      label: "Forge",
      prompts: [
        "Où se trouve le Codex visuel ?",
        "Gérer les Blueprints HTML, comment ?",
        "Affûter mon identité Jedi, comment ?",
      ],
    }),
  },
  /* Pages publiques d'un Holocron — le Maître connecté voit l'assistant avec
     snapshot temps-réel de l'Holocron. */
  {
    match: /^\/clients\/[^/]+\/[^/]+\/[^/]+\/?$/,
    build: () => ({
      label: "Parchemin public",
      prompts: [
        "Résume ce parchemin et son contexte dans la Mission.",
        "Ce parchemin est-il scellé ? À quoi sert-il ?",
        "Annotations fluo ou notes attachées à ce parchemin ?",
      ],
    }),
  },
  {
    match: /^\/clients\/[^/]+\/[^/]+\/?$/,
    build: () => ({
      label: "Mission publique",
      prompts: [
        "Liste les parchemins de cette Mission et leur statut.",
        "Quel est le prochain parchemin à affûter ?",
        "Quels lots structurent cette Mission ?",
      ],
    }),
  },
  {
    match: /^\/clients\/[^/]+\/?$/,
    build: () => ({
      label: "Holocron public",
      prompts: [
        "Fais-moi le point sur cet Holocron.",
        "Quelles Missions ne sont pas encore actives ?",
        "Des parchemins d'archive récents à exploiter ?",
      ],
    }),
  },
  {
    match: /^\/clients\/?$/,
    build: () => ({
      label: "Holocrons publics",
      prompts: [
        "Combien d'Holocrons sont scellés ?",
        "Quel Holocron a le plus de Missions actives ?",
        "À quoi sert cette page côté public ?",
      ],
    }),
  },
];

function isClientContextRoute(pathname: string): boolean {
  return /^\/clients\/[^/]+(?:\/.*)?$/.test(pathname);
}

function getRouteContext(pathname: string): RouteContext {
  for (const { match, build } of ROUTE_CONTEXTS) {
    if (match.test(pathname)) return build();
  }
  return {
    label: "Conseil Jedi",
    prompts: [
      "Comment naviguer dans le Conseil Jedi ?",
      "Forger mon premier Holocron, comment ?",
      "Quels formats peut-on confier à la Force ?",
    ],
  };
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

/**
 * Greeting time-of-day en mode Conseil Jedi — métaphores célestes Star Wars
 * plutôt que les neutres « Bonjour / Bonsoir ».
 */
function greetingForNow(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "L'heure des étoiles";
  if (h < 9) return "Lumière du matin";
  if (h < 12) return "Soleils jumeaux levés";
  if (h < 14) return "Plein midi de Tatooine";
  if (h < 18) return "Après-midi du Temple";
  if (h < 22) return "Les deux soleils descendent";
  return "Nuit de l'hyperespace";
}

function firstNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const head = local.split(/[._-]/)[0] ?? local;
  if (!head) return "";
  return head.charAt(0).toUpperCase() + head.slice(1);
}

/**
 * Transforme une sélection visuelle (image ou texte) en prompt utilisateur
 * concret pour Claude. Le prompt mentionne le `page_id` et le mode
 * (raw_html / document) pour que Claude choisisse le bon outil :
 *  - `propose_image_override` / `propose_text_override` en raw_html
 *  - `propose_image_change` / `propose_text_change` en document
 */
function formatSelectionPrompt(detail: Record<string, unknown>): string | null {
  const kind = detail.kind;
  const pageKind = String(detail.page_kind ?? "");
  const pageId = String(detail.page_id ?? "");
  const pageName = String(detail.page_name ?? "");
  const projectName = String(detail.project_name ?? "");
  if (!kind || !pageId) return null;

  const header = `Sélection depuis la page **${pageName}** (projet ${projectName}, page_id=\`${pageId}\`, mode ${pageKind}).`;

  if (kind === "image") {
    const originalSrc = String(detail.original_src ?? "");
    const currentSrc = String(detail.current_src ?? "");
    const alt = String(detail.alt ?? "");
    return [
      header,
      "",
      "Je viens de cliquer sur **une image** de cette page. Voici ses repères :",
      `- \`original_src\` : ${originalSrc || "(inconnu)"}`,
      `- \`current_src\` affiché : ${currentSrc || "(idem)"}`,
      alt ? `- \`alt\` : ${alt}` : "",
      "",
      "Propose-moi un swap avec un fichier de la **médiathèque** du client. Affiche une carte d'aperçu (avant → après) et un bouton « Appliquer ». N'invente aucune URL.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (kind === "text") {
    const originalText = String(detail.original_text ?? "");
    return [
      header,
      "",
      "Je viens de cliquer sur **un bloc texte** de cette page. Voici son contenu exact (clé de l'override) :",
      "",
      "```",
      originalText,
      "```",
      "",
      "Quelle réécriture proposes-tu ? Affiche un aperçu avec bouton « Appliquer ». Ne change le texte que si je suis explicite sur l'intention — sinon demande-moi.",
    ].join("\n");
  }

  return null;
}

/**
 * Escape <, >, & avant marked.parse → bloque toute injection HTML brute
 * tout en préservant la syntaxe markdown (qui n'utilise pas ces caractères).
 */
function renderMarkdown(content: string): string {
  if (!content) return "";
  const safe = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const out = marked.parse(safe, { async: false });
  return typeof out === "string" ? out : "";
}

export function AdminAssistant({
  email,
  displayName,
}: {
  email: string;
  /** Nom affiché dans le greeting — vient de `profiles.full_name` (Mon profil). */
  displayName?: string | null;
}) {
  const pathname = usePathname();
  const routeContext = useMemo(() => getRouteContext(pathname), [pathname]);
  const isClientContext = useMemo(
    () => isClientContextRoute(pathname),
    [pathname],
  );
  /* Priorité au nom du profil owner ; fallback sur le premier segment de l'email
     (ex. « clubabrazo@… » → « Clubabrazo »). Si Mon profil reste vide, on garde
     l'ancien comportement. */
  const firstName = useMemo(
    () => displayName?.trim() || firstNameFromEmail(email),
    [displayName, email],
  );
  const greeting = useMemo(() => greetingForNow(new Date()), []);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [proposals, setProposals] = useState<AnyProposalUI[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  /** Suit-on l'auto-scroll ? Mis à jour à chaque scroll utilisateur. */
  const followBottomRef = useRef(true);
  /** ID de la bulle assistant courante (peut changer après un `split`). */
  const currentBubbleIdRef = useRef<string | null>(null);
  /** Ref vers `send` pour l'invoquer depuis un effet sans dépendances cycliques. */
  const sendRef = useRef<((text: string) => Promise<void>) | null>(null);
  const panelTitleId = useId();

  // Esc pour fermer (sauf si on tape).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Titre d'onglet dynamique pendant que Yoda médite — le Maître voit que
  // l'IA travaille même si l'onglet est en arrière-plan.
  useEffect(() => {
    if (!pending) return;
    const original = document.title;
    document.title = "⌬ Yoda médite…";
    return () => {
      document.title = original;
    };
  }, [pending]);

  // Ouverture du chatbot via event externe (déclenché depuis AdminTopbar
  // — bouton messagerie en haut à droite). Découple le state local de
  // l'assistant de tout composant qui veut juste l'ouvrir.
  useEffect(() => {
    function handleOpen() {
      setOpen(true);
      playLightsaberIgnite();
    }
    window.addEventListener("speetch:assistant:open", handleOpen);
    return () =>
      window.removeEventListener("speetch:assistant:open", handleOpen);
  }, []);

  // Auto-scroll en bas pendant le streaming, seulement si l'utilisateur n'a
  // pas remonté la conversation à la main.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !followBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pending, open]);

  // Focus à l'ouverture (après la fin du morph).
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 420);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Hauteur dynamique du textarea (auto-grow jusqu'à max-h).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [draft]);

  // Annule la requête au démontage.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Écoute les sélections faites depuis une vue de page (raw_html iframe
  // ou bientôt document/fwa) : ouvre l'assistant et envoie un prompt
  // préformaté qui décrit l'élément sélectionné.
  useEffect(() => {
    function onSelect(e: Event) {
      const detail = (e as CustomEvent<unknown>).detail;
      if (!detail || typeof detail !== "object") return;
      const prompt = formatSelectionPrompt(
        detail as Record<string, unknown>,
      );
      if (!prompt) return;
      setOpen(true);
      // Petite latence pour laisser le panneau apparaître avant le stream.
      window.setTimeout(() => {
        void sendRef.current?.(prompt);
      }, 200);
    }
    window.addEventListener("speetch:assistant-prompt", onSelect);
    return () =>
      window.removeEventListener("speetch:assistant-prompt", onSelect);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    followBottomRef.current = distance < 24;
  }, []);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPending(false);
  }, []);

  const send = useCallback(
    async (rawText: string) => {
      const content = rawText.trim();
      if (!content || pending) return;

      const userMsg: Message = { id: newId(), role: "user", content };
      const firstBubbleId = newId();
      const assistantMsg: Message = {
        id: firstBubbleId,
        role: "assistant",
        content: "",
      };

      followBottomRef.current = true;
      currentBubbleIdRef.current = firstBubbleId;
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setDraft("");
      setError(null);
      setPending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await fetch("/api/admin/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, pathname }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let detail = `HTTP ${res.status}`;
          try {
            const j = (await res.json()) as { error?: string };
            if (j.error) detail = j.error;
          } catch {
            /* noop */
          }
          throw new Error(detail);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const appendDelta = (text: string) => {
          const bubbleId = currentBubbleIdRef.current;
          if (!bubbleId) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === bubbleId ? { ...m, content: m.content + text } : m,
            ),
          );
        };

        const startNewBubble = () => {
          // Après un round tool_use, le serveur émet `split` avant la suite.
          // On crée une nouvelle bulle assistant pour rendre clairement la
          // confirmation post-action.
          const bubbleId = newId();
          currentBubbleIdRef.current = bubbleId;
          setMessages((prev) => [
            ...prev,
            { id: bubbleId, role: "assistant", content: "" },
          ]);
        };

        const handlePreview = (parsed: Record<string, unknown>) => {
          const bubbleId = currentBubbleIdRef.current;
          if (!bubbleId) return;
          const proposalId =
            typeof parsed.proposal_id === "string"
              ? parsed.proposal_id
              : newId();
          const kind = String(parsed.kind ?? "image-section");
          const common = {
            proposal_id: proposalId,
            bubble_id: bubbleId,
            client_slug: String(parsed.client_slug ?? ""),
            page_id: String(parsed.page_id ?? ""),
            page_name: String(parsed.page_name ?? ""),
            page_slug: String(parsed.page_slug ?? ""),
            project_name: String(parsed.project_name ?? ""),
            project_slug: String(parsed.project_slug ?? ""),
            reason: String(parsed.reason ?? ""),
            status: "pending" as const,
          };
          let proposal: AnyProposalUI | null = null;
          if (kind === "image-section") {
            proposal = {
              ...common,
              kind: "image-section",
              section_id: String(parsed.section_id ?? ""),
              media_index:
                typeof parsed.media_index === "number"
                  ? parsed.media_index
                  : 0,
              section_title: String(parsed.section_title ?? ""),
              section_type: ((): "image" | "video" | "gallery" => {
                const t = parsed.section_type;
                if (t === "image" || t === "video" || t === "gallery") return t;
                return "image";
              })(),
              old_url: String(parsed.old_url ?? ""),
              new_url: String(parsed.new_url ?? ""),
              old_caption:
                typeof parsed.old_caption === "string"
                  ? parsed.old_caption
                  : null,
              new_filename:
                typeof parsed.new_filename === "string"
                  ? parsed.new_filename
                  : null,
            };
          } else if (kind === "image-override") {
            proposal = {
              ...common,
              kind: "image-override",
              original_src: String(parsed.original_src ?? ""),
              new_url: String(parsed.new_url ?? ""),
              new_filename:
                typeof parsed.new_filename === "string"
                  ? parsed.new_filename
                  : null,
            };
          } else if (kind === "text-override") {
            proposal = {
              ...common,
              kind: "text-override",
              original_text: String(parsed.original_text ?? ""),
              new_text: String(parsed.new_text ?? ""),
            };
          }
          if (proposal) {
            setProposals((prev) => [...prev, proposal as AnyProposalUI]);
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const raw = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);

            let event = "message";
            let data = "";
            for (const line of raw.split("\n")) {
              if (line.startsWith("event:")) event = line.slice(6).trim();
              else if (line.startsWith("data:")) data += line.slice(5).trim();
            }
            if (!data) continue;

            try {
              const parsed = JSON.parse(data) as Record<string, unknown>;
              if (event === "delta" && typeof parsed.text === "string") {
                appendDelta(parsed.text);
              } else if (event === "preview") {
                handlePreview(parsed);
              } else if (event === "split") {
                startNewBubble();
              } else if (event === "error") {
                throw new Error(
                  typeof parsed.message === "string"
                    ? parsed.message
                    : "Erreur serveur",
                );
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message) {
                throw parseErr;
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        setError(msg);
        const bubbleId = currentBubbleIdRef.current;
        if (bubbleId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === bubbleId && m.content === ""
                ? { ...m, content: `_Échec : ${msg}_` }
                : m,
            ),
          );
        }
      } finally {
        setPending(false);
        abortRef.current = null;
      }
    },
    [messages, pathname, pending],
  );

  // Maintient sendRef à jour pour que les effets externes (CustomEvent
  // « speetch:assistant-prompt ») puissent envoyer un message sans dépendre
  // de la closure du composant.
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void send(draft);
      }
    },
    [draft, send],
  );

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setProposals([]);
    setDraft("");
    setError(null);
    setPending(false);
    followBottomRef.current = true;
    currentBubbleIdRef.current = null;
  }, []);

  const handleApply = useCallback(async (proposal: AnyProposalUI) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.proposal_id === proposal.proposal_id
          ? { ...p, status: "applying", error: undefined }
          : p,
      ),
    );
    try {
      let body: Record<string, unknown>;
      if (proposal.kind === "image-section") {
        body = {
          kind: "image-section",
          client_slug: proposal.client_slug,
          page_id: proposal.page_id,
          section_id: proposal.section_id,
          media_index: proposal.media_index,
          new_media_url: proposal.new_url,
        };
      } else if (proposal.kind === "image-override") {
        body = {
          kind: "image-override",
          client_slug: proposal.client_slug,
          page_id: proposal.page_id,
          original_src: proposal.original_src,
          new_media_url: proposal.new_url,
        };
      } else {
        body = {
          kind: "text-override",
          client_slug: proposal.client_slug,
          page_id: proposal.page_id,
          original_text: proposal.original_text,
          new_text: proposal.new_text,
        };
      }
      const res = await fetch("/api/admin/assistant/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setProposals((prev) =>
        prev.map((p) =>
          p.proposal_id === proposal.proposal_id
            ? { ...p, status: "applied" }
            : p,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setProposals((prev) =>
        prev.map((p) =>
          p.proposal_id === proposal.proposal_id
            ? { ...p, status: "error", error: msg }
            : p,
        ),
      );
    }
  }, []);

  const handleDismissProposal = useCallback((proposalId: string) => {
    setProposals((prev) =>
      prev.filter((p) => p.proposal_id !== proposalId),
    );
  }, []);

  const lastMessage = messages[messages.length - 1];
  const streamingHasContent =
    pending &&
    lastMessage?.role === "assistant" &&
    lastMessage.content.length > 0;

  return (
    <>
      <AnimatePresence initial={false} mode="popLayout">
        {!open && (
          <FloatingOrb
            key="orb-closed"
            pending={pending}
            hasUnread={messages.length > 0 && !pending}
            streamingHasContent={streamingHasContent}
            onOpen={() => {
              playLightsaberIgnite();
              setOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <ChatPanel
            key="panel-open"
            panelTitleId={panelTitleId}
            routeContext={routeContext}
            isClientContext={isClientContext}
            messages={messages}
            proposals={proposals}
            pending={pending}
            error={error}
            streamingHasContent={streamingHasContent}
            draft={draft}
            inputFocused={inputFocused}
            firstName={firstName}
            greeting={greeting}
            scrollRef={scrollRef}
            inputRef={inputRef}
            onClose={() => {
              playLightsaberOff();
              setOpen(false);
            }}
            onReset={handleReset}
            onStop={handleStop}
            onDraftChange={setDraft}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onScroll={handleScroll}
            onSubmit={() => void send(draft)}
            onPromptClick={(p) => void send(p)}
            onApplyProposal={handleApply}
            onDismissProposal={handleDismissProposal}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Orb fermé (avatar flottant bas-droite)                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

function FloatingOrb({
  pending,
  hasUnread,
  streamingHasContent,
  onOpen,
}: {
  pending: boolean;
  hasUnread: boolean;
  streamingHasContent: boolean;
  onOpen: () => void;
}) {
  const expression: AvatarExpression = pending
    ? streamingHasContent
      ? "talking"
      : "thinking"
    : hasUnread
      ? "wink"
      : "happy";
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label="Ouvrir l'assistant Speetch"
      layoutId="speetch-orb"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{
        opacity: 1,
        scale: [1, 1.03, 1],
      }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{
        opacity: { duration: 0.5, ease: EASE_OUT_EXPO },
        scale: {
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
        layout: { duration: 0.55, ease: EASE_OUT_EXPO },
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className="group fixed bottom-5 right-5 z-[60] flex items-center justify-center bg-transparent"
      style={{
        WebkitTapHighlightColor: "transparent",
        filter:
          "drop-shadow(0 8px 16px rgba(0,0,0,0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
      }}
    >
      <YodaAvatar expression={expression} size="xl" />
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Maître Yoda — mascotte image-based (illustrations IA générées)              */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Mascotte Maître Yoda en 7 portraits IA (générés via Higgsfield Soul v2,
 * stockés dans `/public/yoda/{expression}.png` à 256×256 ~110kb chacun).
 *
 * - L'image `happy` a servi de reference d'identité pour les 6 autres
 *   (paramètre `medias[image]` de Soul v2) → cohérence du visage garantie.
 * - Crossfade Framer Motion entre expressions via AnimatePresence.
 * - Crop circulaire (`rounded-full` + `object-cover`) : convention avatar,
 *   masque le fond sombre rectangulaire des PNG.
 * - Tailles rendues : xl=80px (orb flottant), lg=56px (médaillon header),
 *   md=40px (défaut).
 */
function YodaAvatar({
  expression,
  size = "md",
}: {
  expression: AvatarExpression;
  size?: "md" | "lg" | "xl";
}) {
  const px = size === "xl" ? 80 : size === "lg" ? 56 : 40;
  return (
    <div
      className="relative overflow-hidden rounded-full ring-1 ring-white/10"
      style={{ width: px, height: px }}
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.img
          key={expression}
          src={`/yoda/${expression}.png`}
          alt={`Maître Yoda — ${expression}`}
          width={px}
          height={px}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="absolute inset-0 h-full w-full select-none object-cover"
          draggable={false}
        />
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Panneau de chat                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function ChatPanel({
  panelTitleId,
  routeContext,
  isClientContext,
  messages,
  proposals,
  pending,
  error,
  streamingHasContent,
  draft,
  inputFocused,
  firstName,
  greeting,
  scrollRef,
  inputRef,
  onClose,
  onReset,
  onStop,
  onDraftChange,
  onKeyDown,
  onFocus,
  onBlur,
  onScroll,
  onSubmit,
  onPromptClick,
  onApplyProposal,
  onDismissProposal,
}: {
  panelTitleId: string;
  routeContext: RouteContext;
  isClientContext: boolean;
  messages: Message[];
  proposals: AnyProposalUI[];
  pending: boolean;
  error: string | null;
  streamingHasContent: boolean;
  draft: string;
  inputFocused: boolean;
  firstName: string;
  greeting: string;
  scrollRef: React.MutableRefObject<HTMLDivElement | null>;
  inputRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  onClose: () => void;
  onReset: () => void;
  onStop: () => void;
  onDraftChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  onScroll: () => void;
  onSubmit: () => void;
  onPromptClick: (p: string) => void;
  onApplyProposal: (p: AnyProposalUI) => void;
  onDismissProposal: (proposalId: string) => void;
}) {
  const headerExpression: AvatarExpression = error
    ? "dizzy"
    : pending
      ? streamingHasContent
        ? "talking"
        : "thinking"
      : inputFocused || draft.length > 0
        ? "focused"
        : isClientContext
          ? "sparkle"
          : "happy";

  /* ── Drag : panneau flottant déplaçable depuis le header ─────────────────
     - dragControls + dragListener=false : drag déclenché uniquement par
       pointerdown sur le header, pas n'importe où sur le panneau.
     - Position persistée en localStorage entre ouvertures.
     - dragConstraints lié à un wrapper plein-écran → panneau contraint au
       viewport (rubber band léger via dragElastic=0.06). */
  const dragControls = useDragControls();
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("speetch-panel-position");
      if (!stored) return;
      const parsed = JSON.parse(stored) as { x?: unknown; y?: unknown };
      if (typeof parsed.x === "number") dragX.set(parsed.x);
      if (typeof parsed.y === "number") dragY.set(parsed.y);
    } catch {
      /* localStorage indisponible ou JSON corrompu → on garde 0/0 */
    }
  }, [dragX, dragY]);

  const handleDragEnd = useCallback(() => {
    try {
      localStorage.setItem(
        "speetch-panel-position",
        JSON.stringify({ x: dragX.get(), y: dragY.get() }),
      );
    } catch {
      /* noop */
    }
  }, [dragX, dragY]);

  const handleHeaderPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      dragControls.start(e);
    },
    [dragControls],
  );

  /* Double-clic sur le header : reset position → ré-ancre le panneau à
     sa position d'origine (bas-droite). Filet de sécurité si l'utilisateur
     drag hors viewport sur un autre écran. */
  const handleHeaderDoubleClick = useCallback(() => {
    dragX.set(0);
    dragY.set(0);
    try {
      localStorage.removeItem("speetch-panel-position");
    } catch {
      /* noop */
    }
  }, [dragX, dragY]);

  return (
    <>
      {/* Wrapper invisible plein-écran pour borner le drag au viewport */}
      <div
        ref={constraintsRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[55]"
      />
      <motion.div
        role="dialog"
        aria-modal="false"
        aria-labelledby={panelTitleId}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0.06}
        dragConstraints={constraintsRef}
        onDragEnd={handleDragEnd}
        style={{ x: dragX, y: dragY }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
        className={cn(
          "fixed z-[59] flex flex-col overflow-hidden",
          // Mobile : bottom sheet plein-largeur, laisse l'orb visible bas-droite.
          "bottom-24 right-4 left-4 max-h-[min(78vh,660px)]",
          // Desktop : panneau ancré bas-droite (point de départ avant drag).
          "md:bottom-24 md:right-6 md:left-auto md:w-[420px] md:max-h-[min(78vh,640px)]",
          "rounded-2xl border border-white/[0.1]",
          "bg-gradient-to-br from-white/[0.04] via-[#0a0a0a]/95 to-[#0a0a0a]/95",
          "backdrop-blur-2xl",
          "shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95),inset_1px_1px_0_0_rgba(255,255,255,0.06)]",
        )}
      >
      {/* Grain de film */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 grain opacity-[0.05]"
      />
      {/* Halo haut-gauche */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/[0.06] blur-3xl"
      />

      {/* Header — zone de prise pour le drag du panneau (double-clic = reset position) */}
      <header
        onPointerDown={handleHeaderPointerDown}
        onDoubleClick={handleHeaderDoubleClick}
        className="relative flex cursor-grab select-none items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4 active:cursor-grabbing"
        style={{ touchAction: "none" }}
      >
        <div className="flex items-center gap-3">
          {/* Mascotte partagée — vole littéralement depuis l'orb fermé via layoutId */}
          <motion.div
            layoutId="speetch-orb"
            transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
            className="relative flex items-center justify-center"
            style={{
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.35))",
            }}
          >
            <YodaAvatar expression={headerExpression} size="lg" />
          </motion.div>

          <div className="flex flex-col gap-0.5">
            <span
              id={panelTitleId}
              className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/55"
            >
              Maître
            </span>
            <span className="font-serif text-[15px] italic font-light leading-none text-[#F5F5F7]">
              Yoda
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onReset}
              onPointerDown={(e) => e.stopPropagation()}
              className="cursor-pointer text-[10px] uppercase tracking-[0.32em] text-white/35 transition-colors hover:text-white"
            >
              Effacer
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Fermer l'assistant"
            className="cursor-pointer text-[10px] uppercase tracking-[0.32em] text-white/35 transition-colors hover:text-white"
          >
            Fermer
          </button>
        </div>
      </header>

      {/* Context chip — réagit aux changements de route */}
      <div className="relative flex items-center gap-3 border-b border-white/[0.06] px-5 py-2.5">
        <span className="inline-block h-px w-6 bg-white/30" />
        <span className="text-[9px] uppercase tracking-[0.4em] text-white/35">
          Contexte
        </span>
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={routeContext.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="block truncate text-[10px] uppercase tracking-[0.32em] text-white/70"
            >
              {routeContext.label}
            </motion.span>
          </AnimatePresence>
        </div>
        {/* Pastille « Snapshot client » : signale visuellement que Claude
            dispose du contexte temps-réel du client courant. */}
        <AnimatePresence>
          {isClientContext && (
            <motion.span
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-300/[0.05] px-2 py-0.5 text-[9px] uppercase tracking-[0.28em] text-emerald-200/85"
              title="Le snapshot temps-réel de ce client est injecté dans le prompt"
            >
              <span className="inline-block h-1 w-1 rounded-full bg-emerald-300/85" />
              Snapshot
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Conversation */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="relative flex-1 overflow-y-auto px-5 py-6"
      >
        {messages.length === 0 ? (
          <EmptyState
            greeting={greeting}
            firstName={firstName}
            prompts={routeContext.prompts}
            onPromptClick={onPromptClick}
          />
        ) : (
          <ul className="flex flex-col gap-6">
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              const isStreaming = pending && isLast && m.role === "assistant";
              const linkedProposals =
                m.role === "assistant"
                  ? proposals.filter((p) => p.bubble_id === m.id)
                  : [];
              return (
                <MessageRow
                  key={m.id}
                  message={m}
                  streaming={isStreaming}
                  pending={isStreaming && m.content.length === 0}
                  proposals={linkedProposals}
                  onApplyProposal={onApplyProposal}
                  onDismissProposal={onDismissProposal}
                />
              );
            })}
          </ul>
        )}
      </div>

      {/* Erreur globale */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            className="overflow-hidden border-t border-white/[0.08] px-5 py-2 text-[11px] text-red-300/80"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="relative flex items-end gap-3 border-t border-white/[0.08] px-5 py-4"
      >
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            rows={1}
            placeholder={
              pending
                ? "Yoda médite…"
                : "Pose ta question, Maître…"
            }
            disabled={pending}
            className={cn(
              "block min-h-[28px] max-h-32 w-full resize-none bg-transparent",
              "text-[13px] leading-relaxed text-white/90 placeholder:text-white/30",
              "outline-none transition-colors",
              "disabled:opacity-50",
            )}
          />
          {/* Hairline focus indicator */}
          <span
            aria-hidden
            className={cn(
              "mt-1.5 block h-px bg-white/20 transition-all duration-500 ease-out",
              inputFocused || draft.length > 0 ? "w-full bg-white/55" : "w-10",
            )}
          />
        </div>

        {pending ? (
          <button
            type="button"
            onClick={onStop}
            className="group inline-flex shrink-0 items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-red-300/80"
          >
            <span>Arrêter</span>
            <span
              aria-hidden
              className="inline-block h-px w-4 bg-current transition-all duration-500 group-hover:w-8"
            />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Envoyer"
            className={cn(
              "group inline-flex shrink-0 items-center gap-2 text-[10px] uppercase tracking-[0.32em] transition-colors",
              draft.trim()
                ? "text-white/75 hover:text-white"
                : "text-white/20",
            )}
          >
            <span>Envoyer</span>
            <span
              aria-hidden
              className={cn(
                "inline-block h-px w-4 bg-current transition-all duration-500",
                draft.trim() && "group-hover:w-10",
              )}
            />
          </button>
        )}
      </form>
    </motion.div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* État vide                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function EmptyState({
  greeting,
  firstName,
  prompts,
  onPromptClick,
}: {
  greeting: string;
  firstName: string;
  prompts: string[];
  onPromptClick: (p: string) => void;
}) {
  return (
    <div className="flex flex-col gap-8 pt-2">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.1 }}
        className="font-sans font-extralight leading-[1.05] tracking-[-0.02em] text-[#F5F5F7]"
        style={{ fontSize: "1.75rem" }}
      >
        {greeting}
        {firstName && (
          <>
            ,{" "}
            <span className="font-serif italic font-normal text-white/85">
              {firstName}
            </span>
          </>
        )}
        .
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="text-[13px] leading-relaxed text-white/55"
      >
        Le Conseil Jedi, je connais — Holocrons, Missions, parchemins, lots,
        Archives, Audiences, Médiathèque, Codex. À ta page courante, je
        m&apos;adapte.
      </motion.p>

      <div className="flex flex-col gap-0">
        <span className="mb-3 text-[9px] uppercase tracking-[0.4em] text-white/30">
          Suggestions
        </span>
        <ul className="flex flex-col">
          {prompts.map((p, i) => (
            <motion.li
              key={p}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.35 + i * 0.08,
                ease: EASE_OUT_EXPO,
              }}
            >
              <button
                type="button"
                onClick={() => onPromptClick(p)}
                className="group flex w-full items-center gap-3 border-b border-white/[0.06] py-3 text-left text-[13px] leading-relaxed text-white/65 transition-colors hover:text-white"
              >
                <span
                  aria-hidden
                  className="inline-block h-px w-4 shrink-0 bg-current opacity-50 transition-all duration-500 ease-out group-hover:w-10 group-hover:opacity-100"
                />
                <span className="flex-1">{p}</span>
                <span
                  aria-hidden
                  className="text-[10px] tracking-[0.3em] text-white/20 transition-colors group-hover:text-white/55"
                >
                  →
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Une ligne de conversation                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function MessageRow({
  message,
  streaming,
  pending,
  proposals,
  onApplyProposal,
  onDismissProposal,
}: {
  message: Message;
  streaming: boolean;
  pending: boolean;
  proposals: AnyProposalUI[];
  onApplyProposal: (p: AnyProposalUI) => void;
  onDismissProposal: (proposalId: string) => void;
}) {
  if (message.role === "user") {
    return (
      <motion.li
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
        className="flex flex-col items-end gap-1.5"
      >
        <span className="text-[9px] uppercase tracking-[0.4em] text-white/30">
          Vous
        </span>
        <div className="max-w-[88%] whitespace-pre-wrap rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-[13px] leading-relaxed text-white/90">
          {message.content}
        </div>
      </motion.li>
    );
  }

  const hasContent = message.content.length > 0;

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
      className="flex flex-col items-start gap-2.5"
    >
      <span className="text-[9px] uppercase tracking-[0.4em] text-white/30">
        Speetch
      </span>
      {(hasContent || pending) && (
        <div className="max-w-[92%] text-[13px] leading-relaxed text-white/80">
          {pending && !hasContent ? (
            <Thinking />
          ) : (
            <span className="assistant-prose">
              <span
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(message.content),
                }}
              />
              {streaming && <StreamCaret />}
            </span>
          )}
        </div>
      )}
      {proposals.length > 0 && (
        <div className="flex w-full flex-col gap-3">
          {proposals.map((p) => (
            <ProposalCard
              key={p.proposal_id}
              proposal={p}
              onApply={() => onApplyProposal(p)}
              onDismiss={() => onDismissProposal(p.proposal_id)}
            />
          ))}
        </div>
      )}
    </motion.li>
  );
}

function ProposalCard({
  proposal,
  onApply,
  onDismiss,
}: {
  proposal: AnyProposalUI;
  onApply: () => void;
  onDismiss: () => void;
}) {
  const applied = proposal.status === "applied";
  const applying = proposal.status === "applying";
  const hasError = proposal.status === "error";

  const headerLabel = applied
    ? "Appliqué"
    : hasError
      ? "Échec"
      : proposal.kind === "text-override"
        ? "Aperçu — réécriture de texte"
        : proposal.kind === "image-override"
          ? "Aperçu — override d'image"
          : "Aperçu — changement d'image";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className={cn(
        "relative w-full overflow-hidden rounded-xl border",
        applied
          ? "border-emerald-300/30 bg-emerald-300/[0.04]"
          : hasError
            ? "border-red-300/30 bg-red-300/[0.03]"
            : "border-white/[0.1] bg-white/[0.025]",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-white/[0.04] blur-3xl"
      />

      <div className="relative flex flex-col gap-3 px-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-[9px] uppercase tracking-[0.4em]",
              applied
                ? "text-emerald-200/85"
                : hasError
                  ? "text-red-200/85"
                  : "text-white/45",
            )}
          >
            {headerLabel}
          </span>
          <span className="truncate text-[10px] uppercase tracking-[0.32em] text-white/35">
            {proposal.page_name}
          </span>
        </div>

        <p className="text-[12px] leading-relaxed text-white/70">
          {proposal.reason}
        </p>

        {/* Corps spécifique au kind */}
        {proposal.kind === "image-section" && (
          <ImagePreviewBody
            oldUrl={proposal.old_url}
            newUrl={proposal.new_url}
            isVideo={proposal.section_type === "video"}
            footerLines={[
              `Section · ${proposal.section_type} · ${proposal.section_title}`,
              proposal.new_filename ?? "",
            ]}
          />
        )}
        {proposal.kind === "image-override" && (
          <ImagePreviewBody
            oldUrl={proposal.original_src}
            newUrl={proposal.new_url}
            isVideo={false}
            footerLines={[
              `Override raw_html · src d'origine`,
              proposal.new_filename ?? "",
            ]}
          />
        )}
        {proposal.kind === "text-override" && (
          <TextPreviewBody
            oldText={proposal.original_text}
            newText={proposal.new_text}
          />
        )}

        {hasError && proposal.error && (
          <p className="text-[11px] leading-relaxed text-red-300/80">
            {proposal.error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
          {applied ? (
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-emerald-200/85">
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1.5 5L4 7.5L8.5 2.5" />
              </svg>
              Modification appliquée
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={onDismiss}
                disabled={applying}
                className="text-[10px] uppercase tracking-[0.32em] text-white/35 transition-colors hover:text-white disabled:opacity-40"
              >
                Refuser
              </button>
              <button
                type="button"
                onClick={onApply}
                disabled={applying}
                className={cn(
                  "group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] transition-colors",
                  applying ? "text-white/40" : "text-white/85 hover:text-white",
                )}
              >
                <span>{applying ? "Application…" : "Appliquer"}</span>
                <span
                  aria-hidden
                  className={cn(
                    "inline-block h-px bg-current transition-all duration-500",
                    applying ? "w-6" : "w-6 group-hover:w-12",
                  )}
                />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ImagePreviewBody({
  oldUrl,
  newUrl,
  isVideo,
  footerLines,
}: {
  oldUrl: string;
  newUrl: string;
  isVideo: boolean;
  footerLines: string[];
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <MediaThumb url={oldUrl} kind={isVideo ? "video" : "image"} label="Avant" />
        <span aria-hidden className="text-white/30">
          <svg
            width="16"
            height="10"
            viewBox="0 0 16 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          >
            <path d="M1 5h13M10 1l4 4-4 4" />
          </svg>
        </span>
        <MediaThumb
          url={newUrl}
          kind={isVideo ? "video" : "image"}
          label="Après"
          highlight
        />
      </div>
      <div className="flex flex-col gap-0.5 text-[10px] uppercase tracking-[0.28em] text-white/35">
        {footerLines
          .filter((l) => l.length > 0)
          .map((l, i) => (
            <span key={i} className={i === footerLines.length - 1 ? "text-white/55" : undefined}>
              {l}
            </span>
          ))}
      </div>
    </>
  );
}

function TextPreviewBody({
  oldText,
  newText,
}: {
  oldText: string;
  newText: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <span className="text-[9px] uppercase tracking-[0.4em] text-white/30">
          Avant
        </span>
        <p className="whitespace-pre-wrap rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px] leading-relaxed text-white/55 line-through">
          {oldText}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[9px] uppercase tracking-[0.4em] text-emerald-200/75">
          Après
        </span>
        <p className="whitespace-pre-wrap rounded-lg border border-emerald-300/20 bg-emerald-300/[0.03] px-3 py-2 text-[12px] leading-relaxed text-white/90">
          {newText}
        </p>
      </div>
    </div>
  );
}

function MediaThumb({
  url,
  kind,
  label,
  highlight,
}: {
  url: string;
  kind: "image" | "video";
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <span className="text-[9px] uppercase tracking-[0.4em] text-white/30">
        {label}
      </span>
      <div
        className={cn(
          "relative aspect-[4/3] w-full overflow-hidden rounded-lg border",
          highlight
            ? "border-white/30 ring-1 ring-white/10"
            : "border-white/[0.08]",
          "bg-white/[0.025]",
        )}
      >
        {url ? (
          kind === "video" ? (
            <video
              src={url}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-[0.32em] text-white/30">
            vide
          </span>
        )}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <span className="inline-flex items-center gap-1.5 py-1 text-white/45">
      <motion.span
        className="inline-block h-1 w-1 rounded-full bg-white/70"
        animate={{ opacity: [0.25, 1, 0.25] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
      />
      <motion.span
        className="inline-block h-1 w-1 rounded-full bg-white/70"
        animate={{ opacity: [0.25, 1, 0.25] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.18 }}
      />
      <motion.span
        className="inline-block h-1 w-1 rounded-full bg-white/70"
        animate={{ opacity: [0.25, 1, 0.25] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.36 }}
      />
    </span>
  );
}

function StreamCaret() {
  return (
    <motion.span
      aria-hidden
      className="ml-0.5 inline-block h-[1em] w-[1px] translate-y-[2px] bg-white/75 align-middle"
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
