/**
 * Azul — Structure de deck seed.
 * Mise en forme du document source ; le fond éditorial est conservé.
 */

import {
  fr,
  figure,
  legend,
  barsH,
  rangeBars,
  stack,
  stackAbs,
  timeline,
  kpis,
  heroFig,
} from "./charts.mjs";
import { buildDoc, chapter } from "./shell.mjs";

/* ─── Figures ──────────────────────────────────────────────────────────── */

// Architecture du deck : quatre parties, 14 slides de corps.
const structure = stackAbs({
  rows: [
    { label: "Partie 1", sub: "Le problème", segs: [3, 0] },
    { label: "Partie 2", sub: "La solution et la preuve", segs: [4, 0], em: true },
    { label: "Partie 3", sub: "Le marché et la concurrence", segs: [3, 0] },
    { label: "Partie 4", sub: "L'exécution", segs: [4, 0] },
    { label: "Annexes", sub: "sorties uniquement sur question", segs: [0, 6] },
  ],
  max: 6,
  ticks: [0, 2, 4, 6],
  segLabels: ["Slides de corps", "Slides d'annexe"],
});

const figStructure = figure({
  kicker: "Format cible",
  title: "Quatorze slides de corps, six en annexe, quinze minutes",
  sub: "Tout ce qui ne tient pas dans ces quatorze slides va en annexe et sert à répondre aux questions. La partie 2 — la solution et la preuve — est celle qui porte la slide 4, la seule que 90&nbsp;% de vos concurrents n'ont pas.",
  legend: legend([
    { k: "k1", label: "Slides de corps" },
    { k: "kd", label: "Slides d'annexe" },
  ]),
  chart: structure.chart,
  table: structure.table,
  caption:
    "<b>Trois slides ne peuvent pas être écrites aujourd'hui</b>&nbsp;: la 4 (exactitude), la 9 (traction) et la 11 (unit economics) dépendent d'inconnues non levées. Elles sont décrites avec ce qu'elles doivent contenir, et un plan B si le chiffre n'existe pas au moment de lever.",
  aria:
    "Structure du deck : partie 1 trois slides, partie 2 quatre slides, partie 3 trois slides, partie 4 quatre slides, plus six annexes.",
});

// Dispersion des estimations du marché BI — l'argument de rigueur.
const dispersion = rangeBars({
  rows: [
    {
      label: "Fourchette retenue au deck",
      sub: "2026, TCAC 9–11 %",
      lo: 38,
      hi: 50,
      em: true,
      note: "Ce que nous affichons, avec la dispersion expliquée",
    },
    {
      label: "Dispersion des sept cabinets",
      sub: "pour la même année",
      lo: 31.8,
      hi: 95.6,
      note: "Les définitions sont incompatibles entre cabinets",
    },
  ],
  min: 0,
  max: 100,
  ticks: [0, 25, 50, 75, 100],
  unit: " Md$",
  pad: 8.5,
});

const figDispersion = figure({
  kicker: "Garde-fou top-down",
  title: "Afficher la fourchette, et expliquer pourquoi elle est si large",
  sub: "Marché mondial du logiciel BI et analytics en 2026&nbsp;: sept cabinets donnent des chiffres allant de 31,8 à 95,6&nbsp;Md$ pour la même année, parce que leurs définitions sont incompatibles.",
  chart: dispersion.chart,
  table: dispersion.table,
  caption:
    "Afficher «&nbsp;le marché de la BI vaut 50&nbsp;Md$&nbsp;» invite au démontage. Afficher la dispersion et l'expliquer montre que vous avez lu les sources&nbsp;: <b>c'est un signal de rigueur gratuit</b>. Ordre imposé dans le deck&nbsp;: bottom-up d'abord, top-down en garde-fou — l'inverse est le réflexe du deck moyen et se démonte en une question.",
  aria:
    "Marché BI 2026 : fourchette retenue 38 à 50 milliards de dollars, dispersion des sept cabinets de 31,8 à 95,6 milliards.",
});

// Bottom-up : le calcul qui tient.
const sam = kpis([
  {
    label: "Entreprises cibles en France",
    value: "4 800",
    note: "ETI et scale-ups de 100-500 salariés, multi-outils, maturité data suffisante.",
  },
  {
    label: "ACV visé",
    value: "18–30",
    unit: "k€",
    note: "Palier Standard, le cœur de l'offre.",
  },
  {
    label: "SAM France",
    value: "90–120",
    unit: "M€/an",
    accent: true,
    note: "4 800 cibles × ACV. Le beachhead prouvé.",
  },
  {
    label: "SAM Europe élargie",
    value: "1,0–1,3",
    unit: "Md€/an",
    accent: true,
    note: "≈ 54 600 cibles. Le chiffre principal si vous visez une Série A rapide.",
  },
]);

// Paliers tarifaires — catégories ordonnées, rampe ordinale.
const paliers = rangeBars({
  rows: [
    { label: "Pilote", sub: "3 mois, payant — une équipe finance", lo: 3, hi: 5 },
    { label: "Standard", sub: "ETI 100-500 salariés", lo: 18, hi: 30, em: true },
    { label: "Souverain / on-premise", sub: "ETI régulée, finance", lo: 60, hi: 120 },
  ],
  min: 0,
  max: 120,
  ticks: [0, 30, 60, 90, 120],
  unit: " k€",
});

const figPaliers = figure({
  kicker: "Modèle économique",
  title: "Abonnement par paliers de capacité, utilisateurs illimités, jamais au siège",
  sub: "Au siège, nous serions comparés à Power&nbsp;BI à 10&nbsp;$/mois. À l'usage pur, le client ne peut pas budgéter — c'est le premier motif de non-renouvellement documenté chez ThoughtSpot. Les paliers de capacité alignent le prix sur la valeur sans décourager l'usage.",
  chart: paliers.chart,
  table: paliers.table,
  caption:
    "Marge brute à mesurer — <b>seuil de viabilité 75&nbsp;%</b>. L'on-premise est le seul endroit où la souveraineté se monétise plutôt que de simplement débloquer une revue sécurité&nbsp;: à dire explicitement.",
  aria:
    "Paliers tarifaires : pilote 3 à 5 k€, standard 18 à 30 k€ par an, souverain 60 à 120 k€ par an.",
});

// Emploi des fonds.
const fonds = stack({
  rows: [
    {
      label: "Emploi des fonds",
      sub: "sur 18 mois",
      segs: [
        { key: "Produit", label: "Produit", value: 50 },
        { key: "Go-to-market", label: "Go-to-market", value: 25 },
        { key: "Sécurité & certification", label: "Sécurité", value: 15 },
        { key: "Opérations", label: "Opérations", value: 10 },
      ],
    },
  ],
});

const figFonds = figure({
  kicker: "Demande",
  title: "1,5 à 3 M€, complétés en non-dilutif",
  sub: "French Tech Seed — 2&nbsp;€ d'obligations convertibles pour 1&nbsp;€ d'equity, jusqu'à 500&nbsp;k€ · i-Lab jusqu'à 600&nbsp;k€ · CIR et JEI.",
  legend: fonds.legendHtml,
  chart: fonds.chart,
  table: fonds.table,
  caption:
    "Le produit absorbe la moitié&nbsp;: résolution d'entités et couche sémantique. <b>Mettre SOC&nbsp;2 comme ligne budgétaire explicite est un signal fort</b> — cela montre que vous savez que le blocage n'est pas produit mais commercial, et que Dust, votre concurrent français le plus direct, l'a déjà. Jalons à 18 mois&nbsp;: exactitude publiée et auditée · SOC&nbsp;2 Type&nbsp;II obtenu · [N] clients payants · [X] M€ d'ARR · ouverture Benelux et Suisse romande.",
  aria:
    "Emploi des fonds : 50 % produit, 25 % go-to-market, 15 % sécurité et certification, 10 % opérations.",
});

// Cycle de vente par palier.
const cycles = rangeBars({
  rows: [
    { label: "Pilote", sub: "3 mois, payant", lo: 30, hi: 45, em: true },
    { label: "Standard", sub: "abonnement annuel", lo: 90, hi: 150 },
  ],
  min: 0,
  max: 150,
  ticks: [0, 30, 60, 90, 120, 150],
  unit: " j",
});

const figCycles = figure({
  kicker: "Go-to-market",
  title: "Deux cycles de vente, deux points d'entrée",
  sub: "Beachhead&nbsp;: la direction financière d'ETI et de scale-ups françaises de 100 à 500 salariés. C'est le seul segment où un assistant généraliste est disqualifiant — un DAF ne présente pas au comité un chiffre qu'il ne peut pas sourcer.",
  chart: cycles.chart,
  table: cycles.table,
  caption:
    "<b>Canaux</b>&nbsp;: outbound fondateur sur 200 à 300 comptes nommés · réseaux de directeurs financiers · prescripteurs (experts-comptables, CAC, boutiques data). <b>Point d'entrée</b>&nbsp;: DAF — champion et budget · RSSI — gardien · équipe data — bloqueur à coopter en propriétaire du glossaire de KPI.",
  aria:
    "Cycle de vente : pilote 30 à 45 jours, standard 90 à 150 jours.",
});

// Les cinq sorties de la catégorie.
const sorties = timeline({
  items: [
    { date: "Mai 2025", title: "askR.ai → LTF Invest", on: true, body: "Paris." },
    { date: "Juin 2025", title: "Seek AI → IBM", on: true },
    { date: "Août 2025", title: "Waii → Salesforce", on: true },
    { date: "Décembre 2025", title: "Wobby → Actian", on: true },
    { date: "Janvier 2026", title: "Basejump → open source", on: true },
  ],
});

const figSorties = figure({
  kicker: "Slide à ajouter — annexe ou corps",
  title: "Cinq sorties dans notre catégorie en douze mois",
  sub: "Notre lecture&nbsp;: le marché consolide avant d'avoir fini de se former, les acquéreurs sont des plateformes, et les valorisations de sortie sont faibles.",
  chart: sorties.chart,
  table: sorties.table,
  caption:
    "<b>Pourquoi prendre ce risque</b>&nbsp;: l'investisseur trouvera ces cinq transactions en due diligence. Les amener vous-même transforme une mine en démonstration de lucidité. C'est aussi le seul moyen de contrôler le cadrage de la conversation sur la sortie. La slide se termine par&nbsp;: «&nbsp;voici pourquoi nous pensons ne pas finir dans cette liste&nbsp;» — votre réponse.",
});

// Exactitude : ce qu'il faut afficher, ce qu'il ne faut jamais afficher.
const exactitude = barsH({
  rows: [
    {
      label: "Latence médiane",
      sub: "à ne jamais afficher à la place",
      value: 15,
      tone: "dim",
      note: "Métrique de latence — lue comme l'absence de chiffre d'exactitude",
    },
    {
      label: "Nombre d'outils appelés",
      sub: "à ne jamais afficher à la place",
      value: 15,
      tone: "dim",
      note: "Métrique de volumétrie",
    },
    {
      label: "Taux d'exactitude mesuré",
      sub: "avec son intervalle de confiance",
      value: 100,
      em: true,
      note: "Le seul chiffre qui déplace la conversation",
    },
  ],
  max: 100,
  ticks: [0, 50, 100],
  fmt: () => "",
});

/* ─── Corps ────────────────────────────────────────────────────────────── */

const body = [
  chapter({
    num: "00",
    title: 'Avertissement de <span class="it">cadrage</span>',
    body: `
    <p class="wide">Ce deck est construit sur la trajectoire recommandée au Livrable&nbsp;3&nbsp;: <strong>seed de 1,5 à 3&nbsp;M€, complété en non-dilutif, avec optionnalité préservée.</strong> Une mention «&nbsp;delta venture&nbsp;» signale ce qui change si vous visez une Série&nbsp;A rapide.</p>

    ${heroFig({
      value: "14",
      unit: "slides",
      caption:
        "De corps, plus six en annexe, pour quinze minutes de présentation. Tout ce qui ne tient pas dans ces quatorze slides va en annexe et sert à répondre aux questions.",
    })}

    <div class="note note--critical">
      <span class="note__tag">Trois slides ne peuvent pas être écrites aujourd'hui</span>
      <p>La <strong>4</strong> (exactitude), la <strong>9</strong> (traction) et la <strong>11</strong> (unit economics) dépendent d'inconnues non levées. Elles sont décrites ci-après avec ce qu'elles doivent contenir, et un plan B si le chiffre n'existe pas au moment de lever.</p>
      <p><strong>Ne levez pas sans la slide 4.</strong></p>
    </div>

    ${figStructure}`,
  }),

  chapter({
    num: "01",
    title: 'Partie 1 — le <span class="it">problème</span> (slides 1 à 3)',
    body: `
    <h3>Slide 1 — Couverture</h3>
    <p>Logo, une phrase de positionnement, la ville, la date, le montant recherché.</p>
    <div class="pull">
      <p>Azul est l'analyste qui répond aux questions dont la réponse traverse plusieurs outils — avec la source de chaque chiffre, et sans jamais rien écrire dans vos systèmes.</p>
      <cite>La phrase de positionnement</cite>
    </div>
    <div class="note note--warning">
      <span class="note__tag">À bannir</span>
      <p>«&nbsp;La BI redessinée&nbsp;». S'adosser au budget BI vous ancre sur un prix Power&nbsp;BI à ~10&nbsp;$/utilisateur/mois, souvent déjà payé dans un bundle M365. <strong>C'est la décision de positionnement la plus coûteuse du deck.</strong></p>
    </div>

    <h3>Slide 2 — Le problème, raconté par un cas concret</h3>
    <p>Ne pas ouvrir sur le marché. Ouvrir sur une question&nbsp;: une question métier réelle d'un DAF, et ce qu'il faut faire aujourd'hui pour y répondre.</p>
    <div class="pull">
      <p>Quels sont mes 10 clients les plus à risque de churn ce trimestre, et combien d'ARR ça représente&nbsp;?</p>
      <cite>La question qui ouvre le deck</cite>
    </div>
    <p>La réponse existe. Elle est dans Postgres pour l'usage, dans Zendesk pour les tickets, dans HubSpot pour l'ARR et le segment. Personne ne peut y répondre en moins de trois jours. <strong>Donc la question n'est pas posée.</strong></p>
    <p>Le message&nbsp;: le coût n'est pas le délai, c'est <em>la question abandonnée</em>. C'est le vrai concurrent, et c'est une formulation qu'aucun concurrent n'utilise. Ce qui rend cette slide crédible&nbsp;: elle est reprise d'un exemple déjà mis en scène sur votre site. Vous savez la démontrer en direct.</p>

    <h3>Slide 3 — Pourquoi ce problème n'est pas résolu</h3>
    <p>Trois colonnes, une ligne chacune. Sec, factuel, sans caricature des concurrents.</p>
    <div class="tw">
      <table>
        <thead><tr><th>La BI</th><th>Les entrepôts</th><th>Les assistants généralistes</th></tr></thead>
        <tbody>
          <tr>
            <td>Restitue ce qu'on lui a demandé de construire. Ne lit ni les API métier ni les documents.</td>
            <td>Genie, Snowflake Intelligence&nbsp;: excellents, et mono-plateforme. La donnée qui compte n'est pas toute dans l'entrepôt.</td>
            <td>Lisent bien les documents, mal le SQL gouverné. Et ne peuvent pas engager la fiabilité d'un chiffre.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="note">
      <span class="note__tag">Objection anticipée — elle viendra</span>
      <p>«&nbsp;Et Power&nbsp;BI Copilot&nbsp;? Et ChatGPT avec des connecteurs&nbsp;?&nbsp;» — Réponse&nbsp;: ils répondent à des questions mono-source ou documentaires. La question de la slide&nbsp;2 en traverse trois, et exige que chaque chiffre soit sourçable. <strong>Montrez-le plutôt que de l'affirmer</strong> — d'où la slide&nbsp;5.</p>
    </div>`,
  }),

  chapter({
    num: "02",
    title: 'Partie 2 — la solution et la <span class="it">preuve</span> (slides 4 à 7)',
    body: `
    <h3>Slide 4 — L'exactitude <span class="flag">Critique</span></h3>
    <p class="wide">C'est la slide la plus importante du deck, et celle que 90&nbsp;% de vos concurrents n'ont pas.</p>

    <div class="note note--accent">
      <span class="note__tag">Contenu cible</span>
      <p>Sur 150 questions financières réelles, posées sur les schémas de production de 3 clients bêta&nbsp;: réponses exactes <strong>XX&nbsp;%</strong> (IC 95&nbsp;%&nbsp;: [XX&nbsp;; XX]) · abstentions explicites avec motif <strong>XX&nbsp;%</strong> · <strong>réponses fausses délivrées avec confiance XX&nbsp;%</strong> ← le chiffre qui compte.</p>
      <p>Référence&nbsp;: l'état de l'art public sur les workflows d'entreprise réels (Spider 2.0) plafonne à environ 21&nbsp;% d'exactitude d'exécution.</p>
    </div>

    <p><strong>Pourquoi c'est décisif&nbsp;:</strong> tout fondateur de cette catégorie arrive avec une démo. Presque aucun n'arrive avec un taux d'erreur mesuré et un intervalle de confiance. Vous passez immédiatement de «&nbsp;encore un wrapper&nbsp;» à «&nbsp;une équipe qui a compris où est le problème&nbsp;».</p>

    ${figure({
      kicker: "Ce qu'il ne faut jamais afficher à la place",
      title: "Une métrique de latence se lit comme l'absence de chiffre d'exactitude",
      sub: "2,5 à 4,1 secondes · 4 à 6 outils appelés · 6 à 12 lignes de résultat. Ce sont des métriques de latence et de volumétrie. Un investisseur data-averti les lira comme un aveu.",
      chart: exactitude.chart,
      table: exactitude.table,
      aria:
        "Comparaison d'impact : la latence et le nombre d'outils appelés pèsent peu face au taux d'exactitude mesuré.",
    })}

    <div class="note note--warning">
      <span class="note__tag">Si le chiffre n'existe pas au moment de lever</span>
      <p>Ne fabriquez pas de proxy. Présentez le protocole, la date de résultat, et les critères de décision — «&nbsp;si &lt;&nbsp;90&nbsp;%, nous repoussons le lancement commercial&nbsp;». <strong>Un protocole crédible sans résultat vaut mieux qu'un chiffre non sourcé</strong> — et infiniment mieux que le silence.</p>
    </div>

    <h3>Slide 5 — Le produit, en une boucle</h3>
    <p>Le visuel de la trace agentique&nbsp;: <code>azul.plan</code> → <code>azul.query</code> → <code>azul.fetch</code> → <code>azul.read</code> → <code>azul.synthesize</code>, avec les sources nommées sous chaque étape.</p>
    <p>Le message&nbsp;: ce n'est pas un chatbot sur une base, c'est une décomposition traçable. Chaque étape est visible, journalisée et rejouable. <strong>Un seul cas, déroulé en entier</strong> — celui de la slide&nbsp;2. Pas trois. L'investisseur doit sortir avec une image, pas un catalogue.</p>

    <h3>Slide 6 — Ce qui est défendable, et ce qui ne l'est pas</h3>
    <p>Slide contre-intuitive&nbsp;: vous listez ce qui n'est pas différenciant. Faites-le.</p>
    <p><strong>Ce qui n'est pas notre fossé — et nous le savons&nbsp;:</strong> le nombre de connecteurs (MCP les commoditise&nbsp;: ~9&nbsp;650 serveurs au registre officiel en mai 2026), l'interface conversationnelle, l'hébergement européen (le cloud souverain pèse 80&nbsp;Md$ en 2026, c'est devenu un standard d'achat).</p>
    <p><strong>Ce qui l'est&nbsp;:</strong></p>
    <ul>
      <li><strong>La lecture seule structurelle.</strong> Aucun concurrent identifié n'en fait une impossibilité technique — tout le marché va vers l'action. Pour un DAF, c'est un critère d'achat, pas une limitation.</li>
      <li><strong>La résolution d'entités entre sources.</strong> Savoir que le client X de HubSpot est le compte Y de Stripe et l'organisation Z de Zendesk. C'est le seul actif qui s'accumule et ne se copie pas par un commit.</li>
      <li><strong>La trace du raisonnement</strong>, pas seulement de la requête. Toute réponse passée rouvrable et vérifiable.</li>
    </ul>
    <div class="note note--warning">
      <span class="note__tag">Risque à gérer</span>
      <p>Le point 2 suppose que vous l'ayez implémenté. Si ce n'est pas le cas, reformulez en feuille de route explicite plutôt qu'en acquis.</p>
    </div>

    <h3>Slide 7 — Le contrat de confiance</h3>
    <p>Les quatre garanties, avec pour chacune <strong>la preuve, pas la promesse</strong>.</p>
    <div class="tw">
      <table>
        <thead><tr><th>Garantie</th><th>Preuve à afficher</th></tr></thead>
        <tbody>
          <tr><td>Lecture seule au niveau de la source</td><td>Identifiants read-only, permission d'écriture inexistante — démontrable en 30 secondes</td></tr>
          <tr><td>Aucun entraînement de modèle</td><td>Engagement contractuel + <code>robots.txt</code> bloquant GPTBot, ClaudeBot, CCBot, Google-Extended et consorts. <strong>Posture vérifiable, pas déclarative</strong></td></tr>
          <tr><td>Hébergement UE ou on-premise</td><td>Mistral, inférence à préciser selon le déploiement retenu</td></tr>
          <tr><td>Traçabilité intégrale</td><td>Chaque requête, appel d'API et document consulté journalisé avec le raisonnement</td></tr>
        </tbody>
      </table>
    </div>
    <p><strong>Rattacher explicitement au risque marché&nbsp;:</strong> Gartner prévoit que plus de 40&nbsp;% des projets d'IA agentique seront annulés d'ici fin 2027, principalement pour valeur floue et contrôles insuffisants. Vos garanties répondent directement aux deux causes. <em>Ce n'est pas une slide de conformité, c'est une slide de gestion du risque d'adoption.</em></p>`,
  }),

  chapter({
    num: "03",
    title: 'Partie 3 — le marché et la <span class="it">concurrence</span> (slides 8 à 10)',
    body: `
    <h3>Slide 8 — Marché</h3>
    <p class="wide">Ordre imposé&nbsp;: <strong>bottom-up d'abord, top-down en garde-fou.</strong> L'inverse est le réflexe du deck moyen et se démonte en une question.</p>

    ${sam}

    <p>Sources&nbsp;: Eurostat SBS 2023 — 53&nbsp;000 entreprises de 250+ salariés et 246&nbsp;000 de 50 à 249 dans l'UE-27 · INSEE Focus n°372 — 7&nbsp;442 ETI françaises.</p>

    ${figDispersion}

    <div class="note note--accent">
      <span class="note__tag">Delta venture</span>
      <p>Mettre le SAM Europe en chiffre principal et la France en beachhead prouvé, avec un plan d'expansion daté. <strong>Le SAM France seul ne porte pas une thèse venture</strong>, et un bon investisseur le dira.</p>
    </div>

    <h3>Slide 9 — Traction <span class="flag">Critique</span></h3>
    <p>Contenu cible, à remplir depuis les métriques du Livrable&nbsp;3&nbsp;:</p>
    <ul>
      <li>Nombre de clients bêta et secteurs</li>
      <li><strong>Part de questions réellement multi-sources</strong> — la métrique de validation du positionnement. Si elle dépasse 40&nbsp;%, votre différenciateur est utilisé, pas seulement vendu. <em>C'est le chiffre le plus spécifique à Azul de tout le deck.</em></li>
      <li>Questions par utilisateur actif par semaine, rétention à 4 semaines</li>
      <li>Conversion démo → pilote payant</li>
      <li>Pipeline qualifié en nombre de comptes nommés</li>
    </ul>
    <p><strong>Si la traction est mince&nbsp;:</strong> assumez-le et compensez par la slide&nbsp;4. Un seed avec peu de traction mais une mesure d'exactitude rigoureuse est finançable&nbsp;; un seed avec une belle démo et aucune mesure ne l'est plus en 2026. <strong>Ce qui ne compte pas&nbsp;:</strong> inscriptions, demandes de démo non qualifiées, nombre de connecteurs.</p>

    <h3>Slide 10 — Concurrence</h3>
    <p><strong>Ne pas faire de matrice 2×2 avec Azul en haut à droite.</strong> Tout le monde en fait une, personne n'y croit. Faire une carte en quatre cercles avec un verdict honnête par cercle.</p>
    <div class="tw">
      <table>
        <thead><tr><th>Cercle</th><th>Acteurs</th><th>Notre position</th></tr></thead>
        <tbody>
          <tr><td>Entrepôts</td><td>Databricks Genie (4&nbsp;000+ clients dès la préversion), Snowflake Intelligence</td><td>Ils gagnent dans l'entrepôt. <strong>Nous gagnons dès qu'une source est hors entrepôt</strong></td></tr>
          <tr><td>BI + IA</td><td>ThoughtSpot Spotter, Power BI Copilot, Omni, Sigma</td><td>Ils ont la base installée. Ils ne lisent ni les API métier ni les documents</td></tr>
          <tr><td>Assistants horizontaux</td><td>ChatGPT company knowledge, Glean (275+ systèmes), Dust (3&nbsp;000 clients, ARR &gt; 20&nbsp;M$), Le Chat Enterprise</td><td>Ils ont la distribution. <strong>Ils ne peuvent pas engager la fiabilité d'un chiffre présenté en comité</strong></td></tr>
          <tr><td>Pure-plays</td><td>Zenlytic, Dot, Veezoo, WisdomAI</td><td>Aucun n'attaque le DAF d'ETI européenne</td></tr>
        </tbody>
      </table>
    </div>

    ${figSorties}`,
  }),

  chapter({
    num: "04",
    title: 'Partie 4 — l\'<span class="it">exécution</span> (slides 11 à 14)',
    body: `
    <h3>Slide 11 — Modèle économique <span class="flag">Critique</span></h3>
    ${figPaliers}

    <h3>Slide 12 — Go-to-market</h3>
    ${figCycles}
    <div class="note">
      <span class="note__tag">Objection anticipée</span>
      <p>«&nbsp;Pourquoi les DAF et pas les équipes data&nbsp;?&nbsp;» — Réponse&nbsp;: les équipes data sont le goulet, pas l'acheteur. Les cibler, c'est vendre à celui qu'on remplace.</p>
    </div>

    <h3>Slide 13 — Équipe</h3>
    <p>À compléter — aucune information vérifiée sur l'équipe n'était disponible à la production de ce document. Deux points à traiter frontalement plutôt que de les laisser émerger&nbsp;:</p>
    <p><strong>Le lien avec swaap-finance.</strong> Un investisseur le trouvera. Une origine fintech se raconte comme un atout — rigueur sur le chiffre auditable, culture de la traçabilité, compréhension du besoin d'un DAF. Non traité, il se lit comme de la dispersion.</p>
    <p><strong>La légitimité data.</strong> Si l'équipe ne vient pas de la BI, nommez le conseiller ou le premier recrutement qui comble ce manque.</p>

    <h3>Slide 14 — Demande et emploi des fonds</h3>
    ${figFonds}`,
  }),

  chapter({
    num: "05",
    title: 'Annexes et questions à dix <span class="it">secondes</span>',
    body: `
    <div class="tw">
      <table>
        <caption>Six slides d'annexe, sorties uniquement sur question</caption>
        <thead><tr><th>#</th><th>Annexe</th><th>Sert à répondre à</th></tr></thead>
        <tbody>
          <tr><td>A1</td><td>Détail du calcul TAM/SAM/SOM, hypothèses et sensibilité</td><td>«&nbsp;Comment vous arrivez à ce chiffre&nbsp;?&nbsp;»</td></tr>
          <tr><td>A2</td><td>Tableau comparatif concurrentiel sur 16 axes</td><td>«&nbsp;Et par rapport à [concurrent]&nbsp;?&nbsp;»</td></tr>
          <tr><td>A3</td><td>Protocole d'évaluation complet de l'exactitude</td><td>«&nbsp;Comment vous mesurez ça&nbsp;?&nbsp;»</td></tr>
          <tr><td>A4</td><td>Architecture technique et flux de données</td><td>«&nbsp;Où passent les données&nbsp;?&nbsp;»</td></tr>
          <tr><td>A5</td><td>Position AI Act et RGPD</td><td>«&nbsp;Vous êtes à haut risque&nbsp;?&nbsp;»</td></tr>
          <tr><td>A6</td><td>Les trois scénarios de risque et les contre-mesures</td><td>«&nbsp;Qu'est-ce qui vous tue&nbsp;?&nbsp;»</td></tr>
        </tbody>
      </table>
    </div>

    <div class="note note--accent">
      <span class="note__tag">L'annexe A6 est un actif, pas une concession</span>
      <p>Présenter vous-même vos trois scénarios de mortalité — le bundle, la remontée de valeur vers la sémantique, le chiffre faux en comité — avec les contre-mesures, est <strong>le meilleur signal de maturité disponible à ce stade</strong>.</p>
    </div>

    <h3>Les quatre questions auxquelles vous devez savoir répondre en dix secondes</h3>

    <h4>« Pourquoi vous et pas Le Chat de Mistral, qui a déjà des connecteurs Databricks et Snowflake ? »</h4>
    <p>Le Chat est un assistant généraliste. Il ne construit pas de modèle sémantique métier et n'est pas structurellement en lecture seule. Et nous ne pouvons pas être remplacés par notre fournisseur sans qu'il devienne éditeur analytique, ce qui n'est pas sa trajectoire. <em>Préparez aussi la version honnête&nbsp;: c'est un risque réel, traité en A6.</em></p>

    <h4>« Quelle est votre exactitude ? »</h4>
    <p>Slide&nbsp;4. <strong>Si vous n'avez pas le chiffre, vous n'auriez pas dû prendre le rendez-vous.</strong></p>

    <h4>« Qu'est-ce qui vous empêche d'être copié par ThoughtSpot en six mois ? »</h4>
    <p>Rien, au niveau des fonctionnalités. La résolution d'entités et le glossaire de KPI accumulés par client sont l'actif. Et ThoughtSpot ne viendra pas chercher des ETI françaises de 200 salariés.</p>

    <h4>« Pourquoi une équipe fintech fait de la BI ? »</h4>
    <p>Slide&nbsp;13. Préparez-la.</p>

    <div class="pull">
      <p>Un deck bien construit accélère une conversation&nbsp;; il n'en crée pas une. Il ne compense ni l'absence de chiffre d'exactitude, ni l'absence de SOC&nbsp;2, ni l'indécision sur la stratégie sémantique.</p>
      <cite>Ce que ce deck ne peut pas faire</cite>
    </div>`,
  }),
].join("\n");

export const DOC_DECK = buildDoc({
  title: "Azul — Structure de deck seed",
  eyebrow:
    'Azul <span class="sep">·</span> Planning stratégique <span class="sep">·</span> <b>Levée seed</b>',
  h1: 'Structure de <span class="it">deck seed</span>',
  lede: "Trame slide par slide, contenu, sources et objections anticipées. Dérivé des Livrables 1, 2 et 3.",
  meta: [
    { k: "Document", v: "Structure de deck" },
    { k: "Produit le", v: "15 septembre 2026" },
    { k: "Format", v: "14 slides + 6 annexes" },
    { k: "Durée", v: "15 minutes" },
    { k: "Montant visé", v: "1,5 à 3 M€ + non-dilutif" },
  ],
  body,
});
