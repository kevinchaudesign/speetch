/**
 * Azul — Protocole d'évaluation de l'exactitude.
 * Mise en forme du document source ; le fond éditorial est conservé.
 */

import {
  fr,
  figure,
  legend,
  barsH,
  intervals,
  stack,
  bands,
  timeline,
  kpis,
  heroFig,
} from "./charts.mjs";
import { buildDoc, chapter } from "./shell.mjs";

/* ─── Figures ──────────────────────────────────────────────────────────── */

// L'état de l'art public : trois barres, une seule compte → emphase.
const benchmarks = barsH({
  rows: [
    {
      label: "Spider",
      sub: "schémas propres, mono-tour",
      value: 90,
      note: "Un problème résolu, sans valeur prédictive",
    },
    {
      label: "Référence humaine",
      sub: "sur BIRD",
      value: 92.96,
      note: "Le plafond humain mesuré sur BIRD",
    },
    {
      label: "BIRD",
      sub: "bases réelles, données sales",
      value: 82,
      note: "Difficile, mais avec un indice de contexte écrit à la main",
    },
    {
      label: "Spider 2.0",
      sub: "workflows d'entreprise",
      value: 21,
      em: true,
      tone: "",
      note: "Votre environnement réel",
    },
  ],
  max: 100,
  ticks: [0, 25, 50, 75, 100],
  fmt: (v) => fr(v, Number.isInteger(v) ? 0 : 2),
  unit: " %",
});

const figBenchmarks = figure({
  kicker: "État de l'art public",
  title:
    "Trois benchmarks, trois problèmes différents — et un seul ressemble à votre production",
  sub: "Les scores de pointe en text-to-SQL s'étalent de 21 à 90&nbsp;% selon ce que le benchmark mesure vraiment. Spider est un problème résolu&nbsp;; BIRD est difficile mais s'appuie sur un indice de contexte écrit à la main par des annotateurs experts, ce qui n'arrive jamais en production&nbsp;; Spider 2.0 seul reproduit les grands schémas, les dialectes multiples et les enchaînements d'étapes.",
  chart: benchmarks.chart,
  table: benchmarks.table,
  caption:
    "Sans mesure propre, vous ne savez pas où vous êtes <b>entre 21 et 90&nbsp;%</b> — et vos prospects non plus. La boucle d'Azul enchaîne 4 à 6 appels d'outils par question&nbsp;: les erreurs de chaque étape se composent.",
  aria:
    "Exactitude de pointe par benchmark : Spider 90 %, référence humaine sur BIRD 92,96 %, BIRD 82 %, Spider 2.0 21 %.",
});

// Origine des questions : part-à-tout ordonné par qualité de source.
const sources = stack({
  rows: [
    {
      label: "Composition cible",
      sub: "du jeu de 150 questions",
      segs: [
        { key: "Journaux d'usage bêta", label: "Journaux bêta", value: 50 },
        { key: "Entretiens DAF", label: "Entretiens DAF", value: 35 },
        { key: "Rapports existants", label: "Rapports existants", value: 15 },
      ],
    },
  ],
});

const figSources = figure({
  kicker: "Règle absolue",
  title: "Les questions ne sont pas écrites par l'équipe Azul",
  sub: "Une équipe qui écrit ses propres questions d'évaluation produit un biais systématique&nbsp;: elle écrit ce que le produit sait faire. C'est le défaut le plus courant et le plus invalidant. Trois sources sont autorisées, par ordre de qualité décroissante — les parts ci-dessous sont les points médians des fourchettes cibles.",
  legend: sources.legendHtml,
  chart: sources.chart,
  table: sources.table,
  caption:
    "Fourchettes cibles&nbsp;: journaux d'usage <b>40–60&nbsp;%</b>, entretiens DAF <b>30–40&nbsp;%</b>, rapports existants <b>10–20&nbsp;%</b>. À exclure&nbsp;: les questions inventées par l'équipe produit et celles de la démo commerciale — ces dernières peuvent figurer dans un sous-ensemble séparé et identifié comme tel, jamais dans le jeu principal.",
  aria:
    "Composition du jeu d'évaluation : 50 % journaux d'usage bêta, 35 % entretiens DAF, 15 % rapports existants.",
});

// Stratification : trois axes, chacun part-à-tout.
const strates = stack({
  rows: [
    {
      label: "Axe A",
      sub: "sources mobilisées",
      segs: [
        { key: "Strate 1", label: "Mono-source", value: 30 },
        { key: "Strate 2", label: "Bi-source", value: 40 },
        { key: "Strate 3", label: "Tri-source et +", value: 30 },
      ],
    },
    {
      label: "Axe B",
      sub: "difficulté analytique",
      segs: [
        { key: "Strate 1", label: "Agrégation simple", value: 25 },
        { key: "Strate 2", label: "Jointure et filtrage", value: 30 },
        { key: "Strate 3", label: "Fenêtrage, cohortes", value: 30 },
        { key: "Strate 4", label: "Raisonnement composite", value: 15 },
      ],
    },
    {
      label: "Axe C",
      sub: "résolution sémantique",
      segs: [
        { key: "Strate 1", label: "Vocabulaire du schéma", value: 40 },
        { key: "Strate 2", label: "Glossaire de KPI", value: 40 },
        { key: "Strate 3", label: "Ambigu ou non défini", value: 20 },
      ],
    },
  ],
});

const figStrates = figure({
  kicker: "Stratification",
  title: "Une moyenne globale sur un jeu déséquilibré ne dit rien d'utile",
  sub: "Le jeu est stratifié sur trois axes, plus un sous-ensemble transverse. Les strates sont ordonnées de la plus facile à la plus exigeante — la rampe suit cet ordre.",
  legend: strates.legendHtml,
  chart: strates.chart,
  table: strates.table,
  caption:
    "<b>Axe A</b> — le plus important pour le positionnement&nbsp;: la strate tri-source est celle où le taux d'erreur va exploser, et c'est justement celle qu'il faut connaître. <b>Axe C</b> — la strate «&nbsp;glossaire de KPI&nbsp;» teste directement la thèse produit&nbsp;: le mouvement «&nbsp;Connecter&nbsp;» sert-il à quelque chose&nbsp;? La strate «&nbsp;ambigu&nbsp;» teste le comportement d'abstention — la bonne réponse n'y est pas une réponse, c'est une demande de clarification. <b>Axe D</b>, transverse&nbsp;: 15 à 20 questions de résolution d'entités inter-sources, mesurées séparément.",
  aria:
    "Stratification du jeu sur trois axes : sources mobilisées, difficulté analytique, résolution sémantique.",
});

// Le graphique central : l'intervalle de Wilson rétrécit avec n.
const wilson = intervals({
  rows: [
    {
      label: "n = 30",
      sub: "inutilisable",
      values: { a: { lo: 62.7, hi: 90.5, mid: 80 }, b: { lo: 74.4, hi: 96.5, mid: 90 } },
    },
    {
      label: "n = 50",
      values: { a: { lo: 67.0, hi: 88.8, mid: 80 }, b: { lo: 78.6, hi: 95.7, mid: 90 } },
    },
    {
      label: "n = 100",
      values: { a: { lo: 71.1, hi: 86.7, mid: 80 }, b: { lo: 82.6, hi: 94.5, mid: 90 } },
    },
    {
      label: "n = 150",
      sub: "recommandé",
      em: true,
      values: { a: { lo: 72.9, hi: 85.6, mid: 80 }, b: { lo: 84.2, hi: 93.8, mid: 90 } },
    },
    {
      label: "n = 200",
      values: { a: { lo: 73.9, hi: 85.0, mid: 80 }, b: { lo: 85.1, hi: 93.4, mid: 90 } },
    },
    {
      label: "n = 300",
      sub: "coût doublé",
      values: { a: { lo: 75.1, hi: 84.1, mid: 80 }, b: { lo: 86.1, hi: 92.9, mid: 90 } },
    },
  ],
  series: [
    { key: "a", label: "Si le vrai taux est 80 %", k: "k1" },
    { key: "b", label: "Si le vrai taux est 90 %", k: "k2" },
  ],
  min: 60,
  max: 100,
  ticks: [60, 70, 80, 90, 100],
  unit: " %",
});

const figWilson = figure({
  kicker: "Pourquoi 150 questions",
  title: "La précision de la mesure dépend de la taille de l'échantillon",
  sub: "Intervalles de confiance à 95&nbsp;% (méthode de Wilson). Le point marque le taux vrai supposé, le trait son intervalle. En dessous de n&nbsp;=&nbsp;50, l'intervalle est si large que la mesure ne décide de rien.",
  legend: legend([
    { k: "k1", label: "Si le vrai taux est 80 %" },
    { k: "k2", label: "Si le vrai taux est 90 %" },
  ]),
  chart: wilson.chart,
  table: wilson.table,
  caption:
    "À <b>n&nbsp;=&nbsp;150</b>, l'intervalle fait environ <b>±5 points</b>&nbsp;: assez pour décider d'un lancement et pour être défendable devant un investisseur. Passer à 300 ne gagne que 1,5 point de précision pour un doublement du coût de vérité terrain. Conséquence à ne pas perdre de vue&nbsp;: les strates de l'axe A comptent 45 à 60 questions chacune, soit environ <b>±10 points par strate</b> — les taux par strate sont indicatifs, pas publiables comme chiffres fermes. Le dire explicitement dans toute présentation.",
  aria:
    "Intervalles de confiance de Wilson à 95 % selon la taille du jeu, de n égale 30 à n égale 300, pour un taux vrai de 80 % et de 90 %.",
});

// Procédure d'exécution : durées par étape.
const exec = barsH({
  rows: [
    { label: "1. Gel", sub: "version produit, modèle, prompts", value: 0.125, tone: "dim" },
    { label: "2. Exécution", sub: "les 150 questions, sans intervention", value: 1 },
    { label: "3. Capture", sub: "automatisée", value: 0.05, tone: "dim" },
    { label: "4. Notation", sub: "deux évaluateurs puis un seul", value: 2.5, em: true },
    { label: "5. Arbitrage", sub: "un tiers tranche", value: 0.5, tone: "dim" },
    { label: "6. Analyse", sub: "cinq métriques par strate", value: 0.5, tone: "dim" },
    { label: "7. Post-mortem", sub: "classification des échecs", value: 1 },
  ],
  max: 3,
  ticks: [0, 1, 2, 3],
  fmt: (v) => (v < 0.2 ? "—" : v.toString().replace(".", ",")),
  unit: " j",
});

const figExec = figure({
  kicker: "Procédure",
  title: "Sept étapes, 6 à 8 jours-homme côté Azul",
  sub: "Plus 1,5 à 2 jours-homme par client bêta pour la vérité terrain. La notation domine le coût — c'est le prix de la crédibilité du chiffre.",
  chart: exec.chart,
  table: exec.table,
  caption:
    "Étapes 1 et 3 sous la demi-journée (gel&nbsp;: 1&nbsp;h&nbsp;; capture&nbsp;: automatisée). <b>Règles d'exécution non négociables</b>&nbsp;: aucune reformulation de question pour aider l'agent&nbsp;; aucune relance après une mauvaise réponse — la mesure porte sur le premier tour&nbsp;; aucun ajustement de prompt en cours de campagne&nbsp;; l'équipe qui note n'est pas celle qui a développé la fonctionnalité testée, autant que la taille de l'équipe le permet.",
  aria:
    "Durée des sept étapes de la procédure d'exécution, de quelques heures à 2,5 jours pour la notation.",
});

// Seuils de décision — statuts avec glyphe et libellé.
const seuils = bands({
  rows: [
    {
      label: "M3 — Faux confiants",
      sub: "le seuil non négociable",
      critical: "> 5 %",
      warning: "3 – 5 %",
      good: "< 3 %",
    },
    {
      label: "M1 — Exactitude",
      sub: "strate mono-source",
      critical: "< 85 %",
      warning: "85 – 92 %",
      good: "> 92 %",
    },
    {
      label: "M1 — Exactitude",
      sub: "strate multi-sources",
      critical: "< 70 %",
      warning: "70 – 85 %",
      good: "> 85 %",
    },
    {
      label: "M5 — Cohérence",
      sub: "doublons reformulés",
      critical: "< 90 %",
      warning: "90 – 95 %",
      good: "> 95 %",
    },
    {
      label: "M2 — Abstention",
      sub: "sur questions insolubles",
      critical: "< 60 %",
      warning: "60 – 85 %",
      good: "> 85 %",
    },
  ],
});

const figSeuils = figure({
  kicker: "Seuils de décision",
  title: "À fixer avant de connaître les résultats",
  sub: "Un seuil défini après coup n'est pas un seuil. Chaque régime porte son glyphe et son libellé&nbsp;: la couleur ne distingue rien à elle seule.",
  legend: legend([
    { k: "kc", label: "■ Blocage" },
    { k: "kw", label: "▲ Lancement restreint" },
    { k: "kg", label: "● Lancement" },
  ]),
  chart: seuils.chart,
  table: seuils.table,
  caption:
    "<b>Blocage</b>&nbsp;: le lancement commercial sur le beachhead DAF est repoussé. Pas de contournement par un autre segment — un produit qui délivre plus de 5&nbsp;% de faux confiants abîmera sa réputation partout, simplement plus lentement. <b>Lancement restreint</b>&nbsp;: possible avec un périmètre contractuel explicite — questions multi-sources en mode assisté, validation humaine obligatoire avant tout usage en comité, communication franche auprès des premiers clients. C'est un régime honorable, à condition de l'assumer. <b>Lancement</b>&nbsp;: communication du chiffre, avec son intervalle de confiance et sa méthode.",
  aria:
    "Seuils de décision par métrique, en trois régimes : blocage, lancement restreint, lancement.",
});

// Plan à quatre semaines.
const plan = timeline({
  items: [
    {
      date: "Semaine 1",
      title: "Constituer la matière",
      on: true,
      body: "Obtenir l'accord de 3 clients bêta · Extraire les questions des journaux d'usage · Conduire 5 entretiens DAF pour compléter.",
    },
    {
      date: "Semaine 2",
      title: "Construire le jeu — et écrire les seuils",
      on: true,
      body: "Bâtir les 150 questions stratifiées · Intégrer les pièges · Fixer les seuils de décision <em>et les écrire</em>, avant tout résultat.",
    },
    {
      date: "Semaine 3",
      title: "Établir la vérité terrain",
      on: true,
      body: "Avec les analystes clients, réponse de référence avant toute exposition à la réponse d'Azul · Double vérification sur 20&nbsp;% du jeu.",
    },
    {
      date: "Semaine 4",
      title: "Exécuter, noter, décider",
      on: true,
      body: "Exécution · Notation · Analyse · Post-mortem · Rédaction de la note de résultat.",
    },
  ],
});

const figPlan = figure({
  kicker: "Mise en œuvre",
  title: "Quatre semaines jusqu'à la décision",
  sub: "Sortie attendue en S4&nbsp;: une note de trois pages contenant les cinq métriques avec leurs intervalles, la ventilation par strate, la classification des causes d'échec, et la décision — bloquer, restreindre ou lancer.",
  chart: plan.chart,
  table: plan.table,
  caption:
    "C'est le document qui, plus que le deck, déterminera les douze prochains mois d'Azul.",
});

/* ─── Corps ────────────────────────────────────────────────────────────── */

const body = [
  chapter({
    num: "01",
    title: 'Pourquoi ce protocole, et ce qu\'il doit <span class="it">produire</span>',
    body: `
    ${heroFig({
      value: "21",
      unit: "%",
      caption:
        "L'exactitude d'exécution de pointe sur Spider 2.0 — le seul benchmark public qui reproduise des workflows d'entreprise réels. C'est l'ordre de grandeur du problème que vous attaquez, pas celui que vous atteindrez.",
    })}

    ${figBenchmarks}

    <h3>Les trois usages du résultat</h3>
    <p><strong>Décision de lancement.</strong> En dessous du seuil défini au chapitre&nbsp;07, le lancement commercial sur le beachhead DAF doit être repoussé. Le protocole est d'abord un mécanisme d'arrêt.</p>
    <p><strong>Argument de levée.</strong> La slide&nbsp;4 du deck. Presque aucun fondateur de cette catégorie n'arrive avec un taux d'erreur mesuré et un intervalle de confiance.</p>
    <p><strong>Harnais de non-régression.</strong> Une fois construit, il se rejoue à chaque changement de modèle, de prompt ou de connecteur. C'est sa valeur la plus durable — et elle justifie à elle seule l'investissement.</p>

    <div class="note note--accent">
      <span class="note__tag">Ce que ce protocole n'est pas</span>
      <p>Ce n'est pas un benchmark académique et il ne doit pas chercher à l'être. Il mesure <strong>votre produit, sur des schémas réels, sur des questions que vos acheteurs posent.</strong> Sa validité externe est faible&nbsp;; sa validité décisionnelle est élevée. C'est le bon arbitrage.</p>
    </div>`,
  }),

  chapter({
    num: "02",
    title: 'Construction du <span class="it">jeu</span> d\'évaluation',
    body: `
    ${figSources}

    ${figStrates}

    <h3>Pièges à inclure délibérément</h3>
    <p>Un jeu d'évaluation sans pièges surestime systématiquement la performance. Inclure au minimum&nbsp;:</p>
    ${kpis([
      {
        label: "Questions insolubles",
        value: "5",
        note: "Avec les sources connectées. Réponse correcte attendue : abstention motivée. Une réponse chiffrée est une erreur grave.",
      },
      {
        label: "Questions ambiguës",
        value: "5",
        note: "« Nos meilleurs clients » — meilleurs en CA, en marge, en ancienneté ? Réponse correcte : demande de clarification.",
      },
      {
        label: "Prémisses fausses",
        value: "5",
        note: "« Pourquoi notre churn a-t-il augmenté en mars ? » alors qu'il a baissé. Réponse correcte : contester la prémisse.",
      },
      {
        label: "Doublons reformulés",
        value: "3–5",
        accent: true,
        note: "La même question posée différemment, placée à distance dans le jeu. Un écart entre les deux est un défaut critique en contexte financier.",
      },
    ])}

    <h3>Établissement de la vérité terrain <span class="flag">Critique</span></h3>
    <p>C'est la partie coûteuse, et il n'y a pas de raccourci.</p>
    <ol>
      <li>Pour chaque question, un humain compétent — idéalement l'analyste ou le contrôleur de gestion du client bêta — produit la réponse de référence <strong>avant</strong> de voir la réponse d'Azul.</li>
      <li>La réponse de référence inclut la valeur, la requête ou la démarche qui y mène, et les sources mobilisées.</li>
      <li>Pour les questions à abstention attendue, la référence est le motif d'abstention attendu.</li>
      <li><strong>Double vérification sur 20&nbsp;% du jeu</strong> par une seconde personne. Si le désaccord dépasse 10&nbsp;%, le jeu est mal spécifié et doit être repris — les questions sont ambiguës, pas le produit.</li>
    </ol>

    <div class="note">
      <span class="note__tag">Coût et contrepartie</span>
      <p>Comptez 3 à 6 minutes par question pour un analyste qui connaît le schéma, hors questions composites. Pour 150 questions&nbsp;: <strong>1,5 à 2 jours-homme par client bêta</strong>, à négocier comme contrepartie de la gratuité ou du tarif préférentiel du pilote.</p>
      <p>Le jeu d'évaluation que le client aura contribué à construire lui est réutilisable pour évaluer n'importe quel outil concurrent. C'est un livrable de valeur, pas une corvée — formulé ainsi, il est beaucoup plus facile à obtenir.</p>
    </div>

    ${figWilson}`,
  }),

  chapter({
    num: "03",
    title: 'Les cinq <span class="it">métriques</span>',
    body: `
    <p class="wide">La troisième est la plus importante, et c'est rarement celle que l'on met en avant.</p>

    <h3>M1 — Taux d'exactitude</h3>
    <p>Proportion de réponses dont la valeur correspond à la référence, <strong>et</strong> dont les sources mobilisées sont correctes. Une bonne valeur obtenue par une mauvaise démarche compte comme partiellement correcte et doit être comptée séparément&nbsp;: en finance, un chiffre juste par accident n'est pas un chiffre juste — il ne le restera pas au mois suivant. Trois catégories&nbsp;: <code>EXACT</code> · <code>VALEUR_JUSTE_DEMARCHE_FAUSSE</code> · <code>FAUX</code>.</p>

    <h3>M2 — Taux d'abstention motivée</h3>
    <p>Proportion de questions où l'agent refuse explicitement de répondre en indiquant pourquoi&nbsp;: source manquante, définition ambiguë, prémisse contestée. Ce n'est <strong>pas</strong> une métrique à minimiser — un taux d'abstention de 0&nbsp;% sur un jeu contenant 15 questions insolubles ou ambiguës est un signal d'alarme, pas une performance. À décomposer en abstention justifiée et abstention excessive.</p>

    <h3>M3 — Taux de faux confiants <span class="flag">Critique</span></h3>
    <div class="pull">
      <p>Un produit à 75&nbsp;% d'exactitude et 2&nbsp;% de faux confiants est commercialement viable. Un produit à 88&nbsp;% d'exactitude et 12&nbsp;% de faux confiants ne l'est pas sur une cible DAF.</p>
      <cite>Le seul seuil non négociable de ce protocole</cite>
    </div>
    <p>Proportion de réponses fausses délivrées sans réserve, sans signal d'incertitude, sans demande de clarification. C'est la métrique de risque existentiel — celle qui produit le scénario du chiffre faux en comité de direction. <strong>Seuil recommandé&nbsp;: moins de 3&nbsp;%.</strong></p>

    <h3>M4 — Taux de résolution d'entités inter-sources</h3>
    <p>Sur le sous-ensemble de l'axe&nbsp;D, proportion de questions où l'agent rattache correctement une même entité à travers plusieurs systèmes. Mesuré séparément parce que c'est la mesure du seul fossé concurrentiel identifié&nbsp;: un score élevé est l'argument produit le plus fort dont vous disposiez, un score faible indique que le fossé n'existe pas encore.</p>

    <h3>M5 — Taux de cohérence</h3>
    <p>Sur les doublons reformulés, proportion de paires produisant la même valeur. <strong>Seuil recommandé&nbsp;: plus de 95&nbsp;%.</strong> L'incohérence est plus destructrice que l'erreur&nbsp;: une erreur se corrige, une incohérence détruit la confiance dans l'ensemble du système.</p>

    <div class="note">
      <span class="note__tag">Métriques secondaires à relever au passage</span>
      <p>Latence médiane et au 90<sup>e</sup> centile · nombre d'appels d'outils par question · <strong>coût d'inférence par question</strong>, qui alimente directement la mesure de marge brute.</p>
    </div>`,
  }),

  chapter({
    num: "04",
    title: 'Procédure d\'<span class="it">exécution</span>',
    body: figExec,
  }),

  chapter({
    num: "05",
    title: 'Post-mortem — la partie qui a le plus de <span class="it">valeur produit</span>',
    body: `
    <p class="wide">Chaque échec est classé par cause. C'est ce qui transforme un chiffre en feuille de route.</p>

    <div class="tw">
      <table>
        <caption>Classification des causes d'échec</caption>
        <thead><tr><th>Cause</th><th>Question diagnostique</th><th>Ce que ça implique</th></tr></thead>
        <tbody>
          <tr><td>Schéma mal compris</td><td>L'agent a-t-il choisi les bonnes tables&nbsp;?</td><td>Travail d'ingestion de schéma</td></tr>
          <tr><td>Sémantique manquante</td><td>Le terme métier était-il dans le glossaire&nbsp;?</td><td>Si oui et que l'échec persiste&nbsp;: le mouvement «&nbsp;Connecter&nbsp;» ne fonctionne pas. <strong>Le diagnostic le plus grave possible</strong></td></tr>
          <tr><td>Jointure incorrecte</td><td>La relation entre tables était-elle exprimable&nbsp;?</td><td>Modélisation des relations</td></tr>
          <tr><td>Résolution d'entité échouée</td><td>Les identifiants inter-systèmes étaient-ils rapprochables&nbsp;?</td><td>Le fossé concurrentiel n'existe pas encore</td></tr>
          <tr><td>Erreur de période</td><td>«&nbsp;Le trimestre dernier&nbsp;» a-t-il été résolu correctement&nbsp;?</td><td>Cause d'échec la plus fréquente et la plus facile à corriger</td></tr>
          <tr><td>Défaillance du modèle</td><td>La requête était-elle correcte mais le raisonnement faux&nbsp;?</td><td>Seule cause qui justifie de tester un autre modèle</td></tr>
          <tr><td>Échec de connecteur</td><td>L'API a-t-elle renvoyé une donnée incomplète&nbsp;?</td><td>Profondeur des connecteurs</td></tr>
        </tbody>
      </table>
    </div>

    <div class="note note--warning">
      <span class="note__tag">Un point à surveiller particulièrement</span>
      <p>Si la cause dominante est «&nbsp;défaillance du modèle&nbsp;», le choix de Mistral doit être réexaminé — et c'est l'occasion de faire tourner le même jeu sur un modèle frontière pour quantifier l'écart. Si la cause dominante est sémantique ou schéma, ce qui est le plus probable au vu de la littérature, <strong>changer de modèle ne servirait à rien</strong>. Cette information vaut plusieurs mois de travail mal orienté.</p>
    </div>

    <h3>Comparaison concurrentielle — campagne 2, optionnelle mais très rentable</h3>
    <p>Une fois le jeu construit, le faire tourner sur les concurrents accessibles en essai&nbsp;: ThoughtSpot Spotter, Dot, Databricks Genie si un client bêta est sur Databricks, Le Chat Enterprise.</p>
    <p>Limites à assumer honnêtement dans toute publication&nbsp;: certains outils n'accèdent pas aux mêmes sources, ce qui les désavantage mécaniquement sur les strates multi-sources. Publier le résultat par strate, pas en agrégé, et signaler le biais. <strong>Coût marginal&nbsp;: 2 à 3 jours</strong>, puisque le jeu et la vérité terrain existent déjà.</p>`,
  }),

  chapter({
    num: "06",
    title: 'Seuils de <span class="it">décision</span>',
    body: figSeuils,
  }),

  chapter({
    num: "07",
    title: 'Publication — ce qui se <span class="it">dit</span>, et comment',
    body: `
    <div class="pull">
      <p>Sur 150 questions financières réelles, posées sur les schémas de production de 3 clients, avec vérité terrain établie par leurs analystes&nbsp;: XX&nbsp;% d'exactitude (IC 95&nbsp;%&nbsp;: [XX&nbsp;; XX]) · XX&nbsp;% d'abstention motivée · XX&nbsp;% de réponses fausses délivrées avec confiance.</p>
      <cite>Formulation recommandée pour la slide 4 du deck</cite>
    </div>

    <h3>Trois règles de publication</h3>
    <p><strong>Toujours publier l'intervalle de confiance.</strong> Un taux nu se lit comme du marketing&nbsp;; un taux avec son intervalle se lit comme une mesure.</p>
    <p><strong>Toujours publier le taux de faux confiants</strong>, même s'il est le moins flatteur. C'est lui qui prouve que vous avez mesuré la bonne chose. Un fondateur qui annonce 91&nbsp;% d'exactitude sans mentionner le taux d'erreur silencieuse sera perçu comme n'ayant pas compris le problème.</p>
    <p><strong>Ne jamais comparer votre chiffre à BIRD ou à Spider.</strong> Les périmètres n'ont rien à voir et un investisseur technique le relèvera. Vous pouvez citer Spider 2.0 comme référence de difficulté, pas comme base de comparaison.</p>

    <h3>Rythme</h3>
    <div class="tw">
      <table>
        <thead><tr><th>Fréquence</th><th>Périmètre</th></tr></thead>
        <tbody>
          <tr><td>Campagne complète — 150 questions</td><td>Trimestrielle, et systématiquement avant toute levée ou annonce publique</td></tr>
          <tr><td>Non-régression — 50 questions échantillonnées</td><td>À chaque changement de version de modèle, de prompt système ou de connecteur majeur</td></tr>
          <tr><td>Ajout de questions</td><td>Continu — toute question client mal traitée rejoint le jeu, après vérité terrain</td></tr>
        </tbody>
      </table>
    </div>
    <p>Le jeu d'évaluation doit devenir <strong>un actif versionné au même titre que le code</strong>. Un changement de modèle sans passage du harnais est un risque non maîtrisé — et c'est exactement le type de risque qu'un RSSI vous demandera de documenter.</p>`,
  }),

  chapter({
    num: "08",
    title: 'Limites — à assumer <span class="it">publiquement</span>',
    body: `
    <p><strong>Trois clients bêta ne représentent pas un marché.</strong> Les résultats sont valides pour ces schémas, pas généralisables. Le dire.</p>
    <p><strong>La vérité terrain est établie par des humains faillibles.</strong> Le benchmark BIRD lui-même est affecté par des taux d'erreur d'annotation importants, documentés dans la littérature récente. Le taux de désaccord inter-évaluateurs est votre garde-fou — le publier.</p>
    <p><strong>Le jeu vieillit.</strong> Des questions dont les réponses sont figées cessent d'être représentatives quand les données évoluent. Prévoir un rafraîchissement de la vérité terrain à chaque campagne trimestrielle.</p>
    <p><strong>Un jeu d'évaluation peut être sur-optimisé.</strong> Si l'équipe produit commence à corriger spécifiquement les questions du jeu plutôt que les causes sous-jacentes, la mesure perd toute valeur.</p>
    <div class="note note--accent">
      <span class="note__tag">Contre-mesure</span>
      <p>Maintenir un <strong>sous-ensemble aveugle de 30 questions</strong>, jamais montré à l'équipe de développement, et ne le révéler qu'après chaque campagne.</p>
    </div>

    ${figPlan}`,
  }),
].join("\n");

export const DOC_PROTOCOLE = buildDoc({
  title: "Azul — Protocole d'évaluation de l'exactitude",
  eyebrow:
    'Azul <span class="sep">·</span> Planning stratégique <span class="sep">·</span> <b>Question n°1</b>',
  h1: 'Protocole d\'évaluation de <span class="it">l\'exactitude</span>',
  lede: "Méthode de construction, d'exécution et de publication d'une mesure défendable. Le protocole est d'abord un mécanisme d'arrêt : en dessous du seuil, on ne lance pas.",
  meta: [
    { k: "Document", v: "Protocole d'évaluation" },
    { k: "Produit le", v: "15 septembre 2026" },
    { k: "Jeu cible", v: "150 questions · 3 clients bêta" },
    { k: "Effort", v: "6 à 8 j-h + 1,5 à 2 j-h par client" },
    { k: "Mise en œuvre", v: "4 semaines" },
  ],
  body,
});
