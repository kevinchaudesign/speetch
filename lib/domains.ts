/**
 * Domaines d'expertise Speetch — chaque orbe de la constellation
 * du hero représente un domaine, avec ses 16 compétences orbitant
 * sur 2 orbites (8 inner + 8 outer).
 *
 * Cinq domaines (« agence nouvelle génération IA ») :
 *  1. IA augmentée  — central, couche transverse qui irrigue les 4
 *  2. Marque        — identité, voix, storytelling
 *  3. Produit       — UX, design system, plateformes (Next/Supabase)
 *  4. Contenu       — création visuelle + éditoriale (motion, copy, social)
 *  5. Croissance    — distribution, RP, SEO/GEO, lancement, analytics
 *
 * Chaque domaine a son accent couleur — utilisé pour le glow de
 * l'orbe satellite et pour l'accent du panneau description.
 * NB : les ids de skills sont conservés tels quels (ils servent
 * d'ancres potentielles), seul leur regroupement par domaine et
 * leur accent ont été harmonisés.
 */

import type { Skill, SkillAccent } from "./skills";

export type Domain = {
  id: string;
  label: string;        // affiché sous l'orbe satellite
  shortLabel: string;   // pour les contextes ultra-compacts
  tagline: string;      // une ligne pour décrire le domaine
  accent: SkillAccent;
  skills: Skill[];      // exactement 16, ordre = position orbitale
};

/* ─── Domaine 1 : IA augmentée (central) ─── */
const SKILLS_IA: Skill[] = [
  {
    id: "ia.automatisations",
    label: "AUTOMATISATIONS",
    title: "Automatisations IA",
    description:
      "Workflows sur-mesure qui orchestrent vos outils existants avec une couche d'intelligence — n8n, Make, ou code maison. Speetch dessine la logique métier et l'expérience derrière, pas juste les connecteurs.",
    accent: "amber",
  },
  {
    id: "ia.agents",
    label: "AGENTS IA",
    title: "Agents IA",
    description:
      "Équipes d'agents spécialisés qui collaborent pour exécuter des tâches complexes en autonomie. Speetch dessine leurs rôles, leur voix, leurs garde-fous, leurs handoffs.",
    accent: "amber",
  },
  {
    id: "ia.prompts",
    label: "PROMPTS",
    title: "Prompt design",
    description:
      "Concevoir un prompt comme un brief client : précision, contraintes, exemples, ton. Speetch livre des prompts versionnés, testés, documentés — pas des incantations magiques.",
    accent: "amber",
  },
  {
    id: "ia.llms-custom",
    label: "LLMS CUSTOM",
    title: "LLMs custom",
    description:
      "Choix du bon modèle (Claude, GPT, Mistral, open source), architecture multi-modèle, intégration. Speetch arbitre coût/qualité/latence et orchestre les bascules en cas de panne.",
    accent: "amber",
  },
  {
    id: "ia.fine-tuning",
    label: "FINE-TUNING",
    title: "Fine-tuning",
    description:
      "Spécialisation d'un modèle de base sur vos données — style éditorial, vocabulaire métier, formats internes. Pour quand le prompt ne suffit plus.",
    accent: "amber",
  },
  {
    id: "ia.rag",
    label: "RAG",
    title: "RAG · Retrieval augmented generation",
    description:
      "Connexion d'un LLM à vos sources internes pour des réponses ancrées dans VOTRE vérité. Speetch monte l'indexation, le ranking, l'UX de citation.",
    accent: "amber",
  },
  {
    id: "ia.embeddings",
    label: "EMBEDDINGS",
    title: "Embeddings",
    description:
      "Représentation sémantique de vos contenus pour search vectoriel, clustering, recommandation. Speetch choisit le modèle et la base vectorielle selon votre volume.",
    accent: "amber",
  },
  {
    id: "ia.workflows",
    label: "WORKFLOWS",
    title: "Workflows IA",
    description:
      "Orchestration de chaînes d'opérations IA complexes : extraction → analyse → génération → validation. Speetch structure les étapes, gère les fallbacks, mesure les coûts.",
    accent: "amber",
  },
  {
    id: "ia.geo",
    label: "GEO",
    title: "GEO · Generative Engine Optimization",
    description:
      "Optimisation pour être citée par les LLMs quand un prospect demande votre métier. Speetch travaille la structure, la sémantique et l'autorité de votre présence numérique.",
    accent: "amber",
  },
  {
    id: "ia.voix-synth",
    label: "VOIX SYNTH.",
    title: "Voix synthétique",
    description:
      "Clonage de voix, TTS premium (ElevenLabs, Cartesia), narration multilingue. Speetch produit voix-off, podcasts assistés, ou interfaces vocales qui sonnent humain.",
    accent: "amber",
  },
  {
    id: "ia.image-gen",
    label: "IMAGE GÉN.",
    title: "Image générative",
    description:
      "Direction artistique assistée par Midjourney, Higgsfield, Flux, Nano Banana. Speetch livre des prompts esthétiques cohérents avec votre marque + workflows de variantes.",
    accent: "amber",
  },
  {
    id: "ia.video-gen",
    label: "VIDÉO GÉN.",
    title: "Vidéo générative",
    description:
      "Création vidéo via Sora, Runway, Higgsfield, Kling. Storyboards, sequence shots, motion design assistés — l'œil DA reste dans la boucle.",
    accent: "amber",
  },
  {
    id: "ia.edition",
    label: "ÉDITION IA",
    title: "Édition assistée par IA",
    description:
      "Retouche image (Photoshop Generative Fill, Firefly), montage vidéo (Descript, Captions), édition audio. Speetch industrialise sans perdre la finition humaine.",
    accent: "amber",
  },
  {
    id: "ia.search-aug",
    label: "SEARCH AUG.",
    title: "Recherche augmentée",
    description:
      "Moteurs de recherche enrichis par LLM dans vos produits : reformulation, synthèse, suggestions, citations. UX conçue pour la fiabilité.",
    accent: "amber",
  },
  {
    id: "ia.data-pipes",
    label: "DATA PIPES",
    title: "Data pipelines",
    description:
      "Ingestion, nettoyage, structuration des données qui nourrissent vos systèmes IA. Pipelines Python, n8n, Airbyte, dbt — qualité en amont.",
    accent: "amber",
  },
  {
    id: "ia.brand-voice",
    label: "BRAND VOICE",
    title: "Brand voice IA",
    description:
      "Codification de votre voix de marque pour les LLMs : grammaire, vocabulaire, ce que vous dites et ne dites jamais. Guide + agent IA qui l'incarne.",
    accent: "amber",
  },
];

/* ─── Domaine 2 : Marque (identité + voix) ─── */
const SKILLS_MARQUE: Skill[] = [
  {
    id: "da.logo",
    label: "LOGO",
    title: "Logo & emblème",
    description:
      "Marques distinctives, mémorisables, déclinables. Speetch travaille la signature graphique comme un caractère typographique : précise, intemporelle, performante en favicon comme en façade.",
    accent: "rose",
  },
  {
    id: "da.identite",
    label: "IDENTITÉ",
    title: "Identité visuelle",
    description:
      "Système d'identité complet : logo, palette, typo, grilles, principes photographiques, ton iconographique. Speetch livre un brand book modulaire + des templates pour l'équipe interne.",
    accent: "rose",
  },
  {
    id: "da.typo",
    label: "TYPOGRAPHIE",
    title: "Typographie sur-mesure",
    description:
      "Choix de fontes (commercial, open source, custom), pairings, hiérarchie. Speetch peut aussi commissionner une typo sur-mesure si la marque mérite sa propre voix.",
    accent: "rose",
  },
  {
    id: "da.couleur",
    label: "COULEUR",
    title: "Palette & système colorimétrique",
    description:
      "Palette primaire, secondaire, sémantique. Speetch teste sur écran et print, sur fond clair et sombre, en accessibilité AA/AAA, et documente les ratios pour vos design tokens.",
    accent: "rose",
  },
  {
    id: "da.icono",
    label: "ICONOGRAPHIE",
    title: "Iconographie",
    description:
      "Système d'icônes cohérent (stroke, fill, hybride, néomorphisme). Speetch dessine la grille de base, livre 30-200 pictos en SVG optimisé, et le guide pour étendre.",
    accent: "rose",
  },
  {
    id: "da.illustration",
    label: "ILLUSTRATION",
    title: "Illustration & visual",
    description:
      "Style illustratif propriétaire, scènes, key visuals. Speetch produit en interne ou commissionne des illustrateur·trice·s en marque blanche, selon le brief.",
    accent: "rose",
  },
  {
    id: "da.moodboard",
    label: "MOODBOARD",
    title: "Moodboards & exploration",
    description:
      "Exploration de directions visuelles avant production. Speetch construit 2-3 pistes contrastées avec références, palette, typo, photographie — pour aligner avant de s'engager.",
    accent: "rose",
  },
  {
    id: "da.guidelines",
    label: "GUIDELINES",
    title: "Guidelines & gouvernance",
    description:
      "Brand book vivant, gouvernance, gardiennage. Speetch peut aussi assurer un rôle de DA externe en abonnement pour garantir la cohérence dans le temps.",
    accent: "rose",
  },
  {
    id: "da.key-visual",
    label: "KEY VISUAL",
    title: "Key visuals & campagnes",
    description:
      "Image-clé d'une campagne, déclinée tous formats (out-of-home, digital, presse, RP). Speetch construit autour d'une idée graphique forte, pas autour d'un slogan plaqué.",
    accent: "rose",
  },
  {
    id: "da.bd",
    label: "BANDE DESSINÉE",
    title: "Bande dessinée & storytelling",
    description:
      "Communication par la bande dessinée : storyboards, mini-récits, manifestes graphiques. Pour quand un texte ne suffit pas et qu'une image fait passer l'émotion.",
    accent: "rose",
  },
  {
    id: "da.photo",
    label: "PHOTOGRAPHIE",
    title: "Direction photographique",
    description:
      "Brief photographe, styling, lumière, postproduction. Speetch fait la DA des shootings produit, portraits, lifestyle, ou coordonne une banque visuelle propriétaire.",
    accent: "rose",
  },
  {
    id: "da.packaging",
    label: "PACKAGING",
    title: "Packaging produit",
    description:
      "Conception packaging produit : structure, surface, étiquette, fini. Speetch livre les fichiers d'exécution + maquette mock-up haute fidélité.",
    accent: "rose",
  },
  {
    id: "comm.brand-voice",
    label: "BRAND VOICE",
    title: "Voix de marque",
    description:
      "Codification éditoriale : ton, vocabulaire, anti-vocabulaire, formules signatures. Speetch livre un brand voice guide vivant + une banque de tournures.",
    accent: "rose",
  },
  {
    id: "comm.storytelling",
    label: "STORYTELLING",
    title: "Storytelling de marque",
    description:
      "Narration globale : pourquoi vous existez, qui vous êtes, où vous allez. Speetch construit l'arc narratif qui transforme une boîte en mythe (ou au moins en histoire mémorable).",
    accent: "rose",
  },
  {
    id: "comm.manifeste",
    label: "MANIFESTES",
    title: "Manifestes & POV",
    description:
      "Manifeste de marque, prises de position éditoriales, POV publics. Speetch écrit ce qui vous distingue vraiment, pas ce qui rassure le board.",
    accent: "rose",
  },
  {
    id: "comm.kit-marque",
    label: "KIT MARQUE",
    title: "Kit de marque & sales",
    description:
      "Kit prêt-à-l'emploi : présentation, one-pager, pitch deck, signature email. Speetch livre des templates Figma + Notion que vos équipes peuvent dupliquer.",
    accent: "rose",
  },
];

/* ─── Domaine 3 : Produit (UX + plateformes) ─── */
const SKILLS_PRODUIT: Skill[] = [
  {
    id: "produit.ux-research",
    label: "UX RESEARCH",
    title: "UX research",
    description:
      "Entretiens utilisateurs, tests d'utilisabilité, analyse comportementale. Speetch livre des insights actionnables, pas des slides — chaque finding mène à une décision design.",
    accent: "cyan",
  },
  {
    id: "produit.wireframes",
    label: "WIREFRAMES",
    title: "Wireframes & architecture",
    description:
      "Wireframes low/high fidelity, parcours, arborescence. Speetch préfère les sketches rapides + Figma, pas la sur-formalisation qui ralentit.",
    accent: "cyan",
  },
  {
    id: "produit.prototypage",
    label: "PROTOTYPAGE",
    title: "Prototypage interactif",
    description:
      "Prototypes cliquables Figma, Framer, ProtoPie. Speetch privilégie le prototype haute fidélité testable, qui dit « oui ça marche » avant d'engager le dev.",
    accent: "cyan",
  },
  {
    id: "produit.design-system",
    label: "DESIGN SYSTEM",
    title: "Design system",
    description:
      "Système de composants design + tokens cohérents. Speetch livre dans Figma + variables, prêt à être consommé par votre équipe dev (Tailwind, CSS variables, code).",
    accent: "cyan",
  },
  {
    id: "produit.ui-web",
    label: "UI WEB",
    title: "UI web responsive",
    description:
      "Interfaces web responsives mobile-first, accessibilité native, design tokens cohérents. Speetch livre des écrans qui survivent au dev sans perdre 30% de leur âme.",
    accent: "cyan",
  },
  {
    id: "produit.ui-mobile",
    label: "UI MOBILE",
    title: "UI mobile native",
    description:
      "iOS Human Interface Guidelines + Material You. Speetch designe en respectant les patterns natifs au lieu de plaquer du web sur du mobile.",
    accent: "cyan",
  },
  {
    id: "produit.a11y",
    label: "ACCESSIBILITÉ",
    title: "Accessibilité",
    description:
      "Conception WCAG AA/AAA, navigation clavier, contraste, screen readers. Speetch fait l'audit + livre les corrections avec un impact mesurable.",
    accent: "cyan",
  },
  {
    id: "produit.tokens",
    label: "TOKENS",
    title: "Design tokens",
    description:
      "Tokens cross-platform (Figma variables → CSS, iOS, Android). Speetch monte le pipeline Style Dictionary ou équivalent pour que les tokens vivent une fois et se propagent partout.",
    accent: "cyan",
  },
  {
    id: "produit.handoff",
    label: "HANDOFF DEV",
    title: "Handoff design ↔ dev",
    description:
      "Documentation handoff, design specs, code snippets. Speetch parle aux devs (Kevin est dev senior) et livre des fichiers que personne ne maudit.",
    accent: "cyan",
  },
  {
    id: "produit.heuristiques",
    label: "AUDIT UX",
    title: "Audit heuristique",
    description:
      "Audit de votre produit existant selon les 10 heuristiques Nielsen + critères modernes (cognitive load, accessibility, mobile). Speetch livre un rapport priorisé + roadmap.",
    accent: "cyan",
  },
  {
    id: "web.next",
    label: "NEXT.JS",
    title: "Next.js (App Router)",
    description:
      "App Router, Server Components, Server Actions, streaming, ISR. Speetch monte des sites/apps Next.js depuis le scaffolding jusqu'au déploiement.",
    accent: "cyan",
  },
  {
    id: "web.react",
    label: "REACT",
    title: "React 19 + hooks",
    description:
      "React moderne : hooks, Suspense, concurrent features, server components. Speetch écrit du React lisible — pas de magic, pas de cargo cult.",
    accent: "cyan",
  },
  {
    id: "web.typescript",
    label: "TYPESCRIPT",
    title: "TypeScript strict",
    description:
      "TypeScript strict, types discriminés, génériques utiles. Speetch tape tout y compris le shape Supabase, et refuse les `any` qui pourrissent un projet.",
    accent: "cyan",
  },
  {
    id: "web.supabase",
    label: "SUPABASE",
    title: "Supabase (Postgres + Auth)",
    description:
      "Postgres, RLS, auth, storage, realtime, edge functions. Speetch monte le schéma, les migrations, les policies, et l'admin client/owner.",
    accent: "cyan",
  },
  {
    id: "web.tailwind",
    label: "TAILWIND",
    title: "Tailwind CSS",
    description:
      "Tailwind utility-first + design tokens. Speetch refuse les abstractions inutiles (UI libs lourdes) et garde le CSS prévisible et performant.",
    accent: "cyan",
  },
  {
    id: "web.auth",
    label: "AUTH FLOWS",
    title: "Authentification & autorisation",
    description:
      "Magic link, OAuth, sessions, JWT, RLS Postgres. Speetch monte des flows d'auth propres et sécurisés — pas de Bcrypt cassé.",
    accent: "cyan",
  },
];

/* ─── Domaine 4 : Contenu (création visuelle + éditoriale) ─── */
const SKILLS_CONTENU: Skill[] = [
  {
    id: "da.motion",
    label: "MOTION",
    title: "Motion design",
    description:
      "Animation de marque : logo en mouvement, transitions UI, vidéos manifestes. Speetch livre en After Effects, Lottie, Rive, ou code (Framer Motion) selon l'usage final.",
    accent: "gold",
  },
  {
    id: "da.social",
    label: "DA SOCIAL",
    title: "DA réseaux sociaux",
    description:
      "Templates Instagram, TikTok, LinkedIn cohérents avec votre marque. Speetch pense l'engagement (taux de scroll, hook visuel) en plus de l'esthétique.",
    accent: "gold",
  },
  {
    id: "da.web",
    label: "DA WEB",
    title: "DA digital & web",
    description:
      "Direction artistique web : composition, animation, interaction. Speetch pense le site comme un objet culturel, pas comme une vitrine vide.",
    accent: "gold",
  },
  {
    id: "da.print",
    label: "DA PRINT",
    title: "Édition & print",
    description:
      "Livres, plaquettes, cartes de visite, posters, presse. Speetch maîtrise la chaîne graphique (CMYK, Pantone, ennoblissement) et bosse main dans la main avec l'imprimeur.",
    accent: "gold",
  },
  {
    id: "comm.copy",
    label: "COPYWRITING",
    title: "Copywriting éditorial",
    description:
      "Textes pages, articles, claims, slogans. Speetch écrit des textes qui sonnent juste — pas des templates copy-collés depuis ChatGPT non assumé.",
    accent: "gold",
  },
  {
    id: "comm.linkedin",
    label: "LINKEDIN",
    title: "LinkedIn éditorial",
    description:
      "Posts founder, série thématique, calendriers. Speetch écrit en ghost ou coache la prise de parole — le ton reste le vôtre, le rythme devient régulier.",
    accent: "gold",
  },
  {
    id: "comm.instagram",
    label: "INSTAGRAM",
    title: "Instagram & Threads",
    description:
      "Stratégie contenu, carrousels, reels, stories. Speetch arbitre entre brand-building et performance, en gardant l'esthétique brand au cœur.",
    accent: "gold",
  },
  {
    id: "comm.tiktok",
    label: "TIKTOK",
    title: "TikTok & vidéo courte",
    description:
      "Formats natifs TikTok : hook 3s, narration, montage rapide. Speetch écrit, dirige, monte — ou coache une équipe interne à le faire bien.",
    accent: "gold",
  },
  {
    id: "comm.newsletter",
    label: "NEWSLETTER",
    title: "Newsletter & email éditorial",
    description:
      "Newsletters récurrentes (hebdo, mensuel) : ligne édito, design, segments, métriques d'engagement. Speetch monte sur Brevo, Substack, Beehiiv, ConvertKit selon l'audience.",
    accent: "gold",
  },
  {
    id: "comm.podcast",
    label: "PODCAST",
    title: "Podcast",
    description:
      "Concept podcast (format, durée, ton), production légère ou full, distribution multi-plateformes. Speetch peut aussi animer ou coacher la prise de parole micro.",
    accent: "gold",
  },
  {
    id: "produit.animations",
    label: "ANIMATIONS",
    title: "Animations UI",
    description:
      "Micro-interactions, transitions, easings. Speetch utilise framer-motion, Rive, Lottie selon l'usage, et privilégie l'animation qui sert le sens (pas la décoration).",
    accent: "gold",
  },
  {
    id: "produit.copy-ui",
    label: "COPY UI",
    title: "Copywriting UI",
    description:
      "Microcopy, états vides, messages d'erreur, onboarding. Speetch travaille les mots de l'interface comme un livre — chaque phrase compte.",
    accent: "gold",
  },
  {
    id: "produit.icons-ui",
    label: "ICONS UI",
    title: "Icônes UI",
    description:
      "Système d'icônes UI cohérent (stroke 1.5px, grille 24×24, optical sizing). Speetch dessine ou customise depuis Lucide / Heroicons / Phosphor selon votre stack.",
    accent: "gold",
  },
  {
    id: "produit.user-flows",
    label: "USER FLOWS",
    title: "User flows & parcours",
    description:
      "Cartographie des parcours utilisateur, points de friction, opportunités de conversion. Speetch dessine en Figjam ou Whimsical, puis priorise par impact.",
    accent: "gold",
  },
  {
    id: "web.anim-web",
    label: "ANIM WEB",
    title: "Animations web",
    description:
      "Framer Motion, GSAP, Lenis (smooth scroll), CSS animations natives. Speetch arbitre selon la performance cible et la complexité de l'effet.",
    accent: "gold",
  },
  {
    id: "web.headless",
    label: "HEADLESS CMS",
    title: "Headless CMS",
    description:
      "Sanity, Contentful, Storyblok, ou CMS maison sur Supabase. Speetch arbitre selon le volume éditorial et l'autonomie souhaitée des éditeurs.",
    accent: "gold",
  },
];

/* ─── Domaine 5 : Croissance (distribution + perf + RP) ─── */
const SKILLS_CROISSANCE: Skill[] = [
  {
    id: "comm.rp",
    label: "RP & PRESSE",
    title: "RP & relations presse",
    description:
      "Communiqués, dossiers de presse, prise de contact journalistes, suivi des retombées. Speetch travaille avec un réseau RP français quand le sujet le mérite.",
    accent: "emerald",
  },
  {
    id: "comm.events",
    label: "ÉVÉNEMENTIEL",
    title: "Événements & scénographie",
    description:
      "DA d'événements : signalétique, identité, scénographie, expérience visiteur. Speetch livre brief partenaires + suit l'exécution sur place.",
    accent: "emerald",
  },
  {
    id: "comm.launch",
    label: "LAUNCHING",
    title: "Launching produit",
    description:
      "Stratégie de lancement produit : teasing, jour J, post-launch. Speetch orchestre les canaux (presse, social, newsletter, partenaires) pour un effet de seuil.",
    accent: "emerald",
  },
  {
    id: "comm.campaign",
    label: "CAMPAGNES",
    title: "Campagnes intégrées",
    description:
      "Campagnes multicanal autour d'une idée graphique forte. Speetch produit créa + média planning + suivi des performances jusqu'au bilan.",
    accent: "emerald",
  },
  {
    id: "comm.crisis",
    label: "CRISE",
    title: "Communication de crise",
    description:
      "Préparation et gestion de crise : tone of voice, sequencing, canaux. Speetch écrit la première réponse en 30 minutes quand c'est nécessaire.",
    accent: "emerald",
  },
  {
    id: "comm.webinars",
    label: "WEBINAIRES",
    title: "Webinaires & conférences",
    description:
      "Format, story, slides, animation, captation. Speetch designe l'intervention comme un produit éditorial, pas comme un PowerPoint commercial.",
    accent: "emerald",
  },
  {
    id: "web.perf",
    label: "WEB PERF",
    title: "Performance web",
    description:
      "Core Web Vitals au top : LCP < 2.5s, INP < 200ms, CLS < 0.1. Speetch optimise images, fonts, scripts, edge caching, lazy loading.",
    accent: "emerald",
  },
  {
    id: "web.seo-tech",
    label: "SEO TECH",
    title: "SEO technique",
    description:
      "Schema.org, sitemap, robots, canonicals, meta dynamiques, OpenGraph. Speetch monte le socle SEO technique avant que vous ayez besoin d'un consultant SEO.",
    accent: "emerald",
  },
  {
    id: "web.hosting",
    label: "HOSTING",
    title: "Hosting & déploiement",
    description:
      "Vercel, Hostinger, Railway, VPS. Speetch monte le pipeline CI/CD git push → prod, avec preview branches et rollback instantané.",
    accent: "emerald",
  },
  {
    id: "web.edge",
    label: "EDGE FUNC.",
    title: "Edge functions & API",
    description:
      "Routes API Next, edge functions Vercel/Cloudflare, Supabase functions. Speetch écrit des endpoints typés, testés, monitorés.",
    accent: "emerald",
  },
  {
    id: "web.a11y-code",
    label: "A11Y CODE",
    title: "Accessibilité (code)",
    description:
      "ARIA roles, focus traps, keyboard nav, screen reader testing. Speetch code l'accessibilité comme une feature, pas comme un patch de fin.",
    accent: "emerald",
  },
  {
    id: "web.email",
    label: "EMAIL TECH",
    title: "Emails transactionnels",
    description:
      "Brevo, Resend, Postmark, SES. Speetch monte le pipeline d'envoi + templates HTML qui passent dans Outlook (sans pleurer).",
    accent: "emerald",
  },
  {
    id: "web.analytics",
    label: "ANALYTICS",
    title: "Analytics & métriques",
    description:
      "PostHog, Plausible, Umami, Vercel Analytics. Speetch monte un setup qui respecte la vie privée + dashboards custom pour les métriques qui comptent.",
    accent: "emerald",
  },
  {
    id: "web.devops",
    label: "DEVOPS",
    title: "DevOps & monitoring",
    description:
      "Sentry, Logflare, uptime monitoring, alertes. Speetch monte l'infrastructure de surveillance pour que vous sachiez avant le client qu'il y a un bug.",
    accent: "emerald",
  },
  {
    id: "produit.ab-tests",
    label: "A/B TESTS",
    title: "A/B testing & expérimentation",
    description:
      "Conception et analyse d'A/B tests (PostHog, Statsig, in-house). Speetch propose les hypothèses, le design des variants, et l'interprétation statistique des résultats.",
    accent: "emerald",
  },
  {
    id: "produit.design-ops",
    label: "DESIGN OPS",
    title: "Design ops",
    description:
      "Process design, naming, workflow Figma, handoff dev. Speetch monte l'infrastructure invisible qui fait gagner 30% de vélocité à votre équipe design.",
    accent: "emerald",
  },
];

/* ─── Constellation finale ─────────────────────────────────────────── */

export const DOMAINS: readonly Domain[] = [
  {
    id: "ia",
    label: "Intelligence augmentée",
    shortLabel: "IA",
    tagline: "Agents, automatisations, contenu génératif, GEO",
    accent: "amber",
    skills: SKILLS_IA,
  },
  {
    id: "marque",
    label: "Marque",
    shortLabel: "Marque",
    tagline: "Identité, typo, voix, storytelling",
    accent: "rose",
    skills: SKILLS_MARQUE,
  },
  {
    id: "produit",
    label: "Produit",
    shortLabel: "Produit",
    tagline: "UX, design system, plateformes Next + Supabase",
    accent: "cyan",
    skills: SKILLS_PRODUIT,
  },
  {
    id: "contenu",
    label: "Contenu",
    shortLabel: "Contenu",
    tagline: "Création visuelle, éditoriale, motion, social",
    accent: "gold",
    skills: SKILLS_CONTENU,
  },
  {
    id: "croissance",
    label: "Croissance",
    shortLabel: "Croissance",
    tagline: "Distribution, RP, SEO/GEO, lancement, analytics",
    accent: "emerald",
    skills: SKILLS_CROISSANCE,
  },
];

export function getDomain(id: string): Domain | null {
  return DOMAINS.find((d) => d.id === id) ?? null;
}

/** Cherche un skill par id à travers tous les domaines. */
export function findSkill(skillId: string): Skill | null {
  for (const d of DOMAINS) {
    const s = d.skills.find((sk) => sk.id === skillId);
    if (s) return s;
  }
  return null;
}
