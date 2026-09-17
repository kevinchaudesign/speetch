/**
 * Azul — Dossier de sécurité et de conformité (revue fournisseur RSSI).
 * Mise en forme du document source ; le fond éditorial est conservé.
 *
 * Les comptages de champs sont extraits du document source, pas estimés :
 * 69 champs « à compléter », dont 20 marqués critiques, sur 14 sections.
 */

import {
  figure,
  legend,
  rangeBars,
  stackAbs,
  timeline,
  kpis,
  heroFig,
} from "./charts.mjs";
import { buildDoc, chapter } from "./shell.mjs";

/* ─── Figures ──────────────────────────────────────────────────────────── */

// État de complétude, section par section. Les six sections prioritaires
// sont mises en avant : ce sont celles qui décident du deal.
const completude = stackAbs({
  rows: [
    { label: "1. Identité du fournisseur", segs: [1, 8] },
    { label: "3. Garantie de lecture seule", sub: "priorité", em: true, segs: [4, 0] },
    { label: "4. Architecture et flux", sub: "priorité", em: true, segs: [5, 4] },
    { label: "5. Données du client", sub: "priorité", em: true, segs: [2, 6] },
    { label: "6. Non-entraînement", segs: [1, 1] },
    { label: "7. Contrôle d'accès", sub: "priorité", em: true, segs: [3, 3] },
    { label: "8. Traçabilité", segs: [0, 5] },
    { label: "9. Conformité RGPD", segs: [1, 6] },
    { label: "10. Position AI Act", segs: [1, 0] },
    { label: "11. Certifications", sub: "priorité", em: true, segs: [1, 4] },
    { label: "12. Sécurité opérationnelle", segs: [0, 8] },
    { label: "13. Risques agents IA", sub: "priorité", em: true, segs: [0, 5] },
  ],
  max: 10,
  ticks: [0, 2, 4, 6, 8, 10],
  segLabels: ["Champs critiques", "Autres champs"],
});

const figCompletude = figure({
  kicker: "État du dossier",
  title: "Soixante-neuf champs à compléter, dont vingt qu'aucun RSSI ne laissera passer",
  sub: "Le modèle est complet dans sa structure&nbsp;; son contenu ne l'est pas. Les sections marquées «&nbsp;priorité&nbsp;» sont celles qui décident du deal — elles concentrent les champs critiques sans être les plus volumineuses.",
  legend: legend([
    { k: "k1", label: "Champs critiques" },
    { k: "kd", label: "Autres champs" },
  ]),
  chart: completude.chart,
  table: completude.table,
  caption:
    "Les sections 2 et 14 n'apparaissent pas&nbsp;: la description du service est rédigée, et les annexes sont une liste de pièces à joindre. <b>Un champ vide envoyé à un RSSI est pire que l'absence de document</b> — quand la réponse est «&nbsp;pas encore&nbsp;», écrire «&nbsp;pas encore, voici la date&nbsp;».",
  aria:
    "Nombre de champs à compléter par section, dont champs critiques : 69 champs au total, 20 critiques, répartis sur 12 sections.",
});

// Ce que le dossier retire du cycle de vente.
const cycle = rangeBars({
  rows: [
    {
      label: "Cycle de vente Standard",
      sub: "de la démo à la signature",
      lo: 90,
      hi: 150,
      note: "Le cycle complet sur l'offre Standard",
    },
    {
      label: "Dont revue de sécurité",
      sub: "2 à 4 semaines",
      lo: 14,
      hi: 28,
      note: "Premier point de mortalité des deals en B2B mid-market",
    },
    {
      label: "Retiré par un dossier envoyé en amont",
      sub: "3 à 6 semaines",
      lo: 21,
      hi: 42,
      em: true,
      note: "Le levier de compression de cycle le mieux documenté",
    },
  ],
  min: 0,
  max: 150,
  ticks: [0, 30, 60, 90, 120, 150],
  unit: " j",
});

const figCycle = figure({
  kicker: "Pourquoi ce document existe",
  title: "Remonter la validation sécuritaire avant la proposition commerciale",
  sub: "En vente B2B mid-market, la revue de sécurité ajoute 2 à 4 semaines au cycle et constitue le premier point de mortalité des deals. Sans certification, elle peut le bloquer purement.",
  chart: cycle.chart,
  table: cycle.table,
  caption:
    "Coût de production du dossier complet&nbsp;: <b>3 à 5 jours-homme</b>, dont l'essentiel en collecte d'informations que vous détenez déjà. Sur un cycle Standard de 90 à 150 jours, un dossier envoyé en amont peut en retirer 3 à 6 semaines — et surtout éviter les deals perdus pour une raison non produit. C'est le meilleur rapport effort/impact du go-to-market avant lancement.",
  aria:
    "Cycle de vente Standard de 90 à 150 jours, dont 14 à 28 jours de revue de sécurité ; un dossier envoyé en amont en retire 21 à 42 jours.",
});

// Calendrier AI Act.
const aiAct = timeline({
  items: [
    {
      date: "2 août 2026",
      title: "Transparence et littératie — applicables",
      on: true,
      body: "L'article&nbsp;50 s'applique&nbsp;: l'utilisateur est informé qu'il interagit avec un système d'IA. Les pouvoirs de sanction sont actifs, jusqu'à 35&nbsp;M€ ou 7&nbsp;% du chiffre d'affaires mondial. L'obligation de littératie IA de l'article&nbsp;4 s'applique également, transformée en obligation de moyens par le Digital Omnibus.",
    },
    {
      date: "2 décembre 2027",
      title: "Annexe III — obligations haut risque",
      body: "Reportée par le Digital Omnibus, publié au JOUE le 24 juillet 2026. Azul n'y figure pas&nbsp;; un client déployeur peut en revanche y entrer selon son usage.",
    },
    {
      date: "2 août 2028",
      title: "Annexe I — obligations haut risque",
      body: "Second report du même paquet.",
    },
  ],
});

const figAiAct = figure({
  kicker: "Calendrier réglementaire",
  title: "Ce qui s'applique, et quand",
  sub: "Anticiper cette question est un avantage commercial&nbsp;: le client devra cartographier ses systèmes d'IA, et un fournisseur qui arrive avec sa qualification documentée lui économise du travail.",
  chart: aiAct.chart,
  table: aiAct.table,
});

/* ─── Corps ────────────────────────────────────────────────────────────── */

const body = [
  chapter({
    num: "00",
    title: 'Note d\'usage — à lire par l\'équipe Azul, puis à <span class="it">supprimer</span> avant envoi',
    body: `
    ${heroFig({
      value: "69",
      caption:
        "Champs restant à compléter dans ce modèle, dont 20 marqués critiques. Tant qu'ils ne sont pas remplis, le document n'est pas prêt à être envoyé.",
    })}

    ${figCycle}

    <h3>Trois règles de rédaction</h3>
    <p><strong>Ne jamais laisser un champ vide.</strong> Un «&nbsp;à compléter&nbsp;» envoyé à un RSSI est pire que l'absence de document. Quand la réponse est «&nbsp;pas encore&nbsp;», écrivez «&nbsp;pas encore, voici la date&nbsp;». Un calendrier daté est acceptable&nbsp;; un silence ne l'est pas.</p>
    <p><strong>Ne jamais surpromettre.</strong> Un RSSI qui découvre un écart entre ce document et la réalité technique tue le deal et prévient ses pairs. Le marché français des DAF et RSSI d'ETI est petit.</p>
    <p><strong>Distinguer ce qui est architectural de ce qui est contractuel.</strong> «&nbsp;La permission d'écrire n'existe pas&nbsp;» est architectural et démontrable. «&nbsp;Nous n'entraînons pas de modèle&nbsp;» est contractuel. Les deux ont de la valeur, pas la même.</p>

    <div class="note note--warning">
      <span class="note__tag">Avertissement</span>
      <p>Ce modèle n'est pas un avis juridique. Les qualifications RGPD et AI&nbsp;Act qu'il propose doivent être validées par un conseil spécialisé avant diffusion à un client.</p>
    </div>

    ${figCompletude}`,
  }),

  chapter({
    num: "01",
    title: 'Identité du fournisseur et description du <span class="it">service</span>',
    body: `
    <div class="tw">
      <table>
        <caption>1. Identité du fournisseur</caption>
        <thead><tr><th>Élément</th><th>Réponse</th></tr></thead>
        <tbody>
          <tr><td>Raison sociale</td><td>À compléter</td></tr>
          <tr><td>SIREN</td><td>À compléter</td></tr>
          <tr><td>Siège social</td><td>À compléter — Paris, France</td></tr>
          <tr><td>Effectif</td><td>À compléter</td></tr>
          <tr><td>Date de création</td><td>À compléter</td></tr>
          <tr><td>Actionnariat significatif <span class="flag">Critique</span></td><td>Question systématique en ETI&nbsp;: à qui appartient le fournisseur, et y a-t-il un actionnaire extra-européen&nbsp;?</td></tr>
          <tr><td>Contact sécurité / incidents</td><td>À compléter — adresse dédiée, pas une adresse générique</td></tr>
          <tr><td>DPO ou référent protection des données</td><td>Obligatoire de désigner un contact, même sans DPO formel</td></tr>
          <tr><td>Assurance RC professionnelle</td><td>Montant et assureur — demandé en revue achat ETI</td></tr>
        </tbody>
      </table>
    </div>

    <h3>2. Description du service</h3>
    <p class="wide">Azul est un agent analytique qui interroge en lecture seule les bases de données, les outils métiers SaaS, les documents et les fichiers du client, croise les résultats et les restitue à la lumière des indicateurs de l'entreprise.</p>
    <p><strong>Ce que le service fait&nbsp;:</strong> décomposition d'une question métier, génération et exécution de requêtes SQL en lecture, appels d'API en lecture aux outils SaaS connectés, lecture de documents internes, synthèse et restitution avec la trace complète du raisonnement.</p>
    <p><strong>Ce que le service ne fait pas&nbsp;:</strong> aucune écriture, modification ou suppression dans les systèmes du client. Aucune action déclenchée dans un outil tiers. Aucune décision automatisée au sens de l'article&nbsp;22 du RGPD.</p>`,
  }),

  chapter({
    num: "02",
    title: 'Garantie de <span class="it">lecture seule</span>',
    body: `
    <div class="pull">
      <p>La permission de modifier n'existe pas dans le produit — ce n'est ni une option ni un paramètre de configuration.</p>
      <cite>La section la plus importante du dossier</cite>
    </div>

    <p class="wide">C'est le point où Azul se distingue de l'ensemble des agents d'entreprise du marché, dont la trajectoire est l'action. À documenter avec un soin disproportionné.</p>

    <div class="tw">
      <table>
        <thead><tr><th>Question</th><th>Réponse</th></tr></thead>
        <tbody>
          <tr><td>Comment la lecture seule est-elle mise en œuvre&nbsp;?</td><td>Azul se connecte avec des identifiants en lecture seule. La permission de modifier n'existe pas dans le produit.</td></tr>
          <tr><td>Peut-elle être contournée par un paramétrage, un administrateur ou une évolution produit&nbsp;? <span class="flag">Critique</span></td><td>Réponse attendue&nbsp;: non, et expliquer le mécanisme. Si un chemin de contournement existe, le documenter honnêtement.</td></tr>
          <tr><td>Comment le client peut-il le vérifier lui-même&nbsp;? <span class="flag">Critique</span></td><td>Fournir la liste exacte des privilèges requis par connecteur, afin que le client provisionne lui-même un compte techniquement incapable d'écrire. <strong>C'est la preuve la plus forte disponible&nbsp;: le client se prouve la garantie à lui-même.</strong></td></tr>
          <tr><td>Quels privilèges exacts sont requis, par type de source&nbsp;? <span class="flag">Critique</span></td><td>Tableau par connecteur&nbsp;: PostgreSQL, MySQL, Oracle, MS SQL Server, Snowflake, BigQuery, Redshift, Databricks, ClickHouse, puis chaque outil SaaS. C'est le document que le RSSI transmettra à son DBA.</td></tr>
          <tr><td>Le produit émet-il des requêtes DDL ou DML&nbsp;?</td><td>Réponse attendue&nbsp;: non. Préciser si un garde-fou de validation syntaxique bloque ces requêtes avant exécution.</td></tr>
        </tbody>
      </table>
    </div>`,
  }),

  chapter({
    num: "03",
    title: 'Architecture, flux de <span class="it">données</span> et hébergement',
    body: `
    <h4>4.1 Schéma de flux <span class="flag">Critique</span></h4>
    <p>Un schéma est attendu. Il doit faire apparaître, pour une question type&nbsp;: le poste utilisateur, le service Azul, les sources connectées, <strong>le fournisseur d'inférence</strong>, et pour chaque flèche la nature des données transmises, le sens, et la localisation géographique.</p>

    <h4>4.2 Données transmises au modèle de langage <span class="flag">Critique</span></h4>
    <p>C'est la question centrale de toute revue de sécurité d'un produit à base de LLM. Elle sera posée sous plusieurs formes.</p>
    <div class="tw">
      <table>
        <thead><tr><th>Question</th><th>Réponse</th></tr></thead>
        <tbody>
          <tr><td>Quel modèle de langage est utilisé&nbsp;?</td><td>Mistral — à préciser&nbsp;: quel modèle exactement</td></tr>
          <tr><td>Où l'inférence a-t-elle lieu&nbsp;? <span class="flag">Critique</span></td><td><strong>Déterminant.</strong> API Mistral hébergée en France&nbsp;: souveraineté forte. Mistral via AWS Bedrock, Azure ou Vertex en région UE&nbsp;: la souveraineté porte sur la donnée mais pas sur l'infrastructure sous-jacente, et l'exposition au CLOUD Act revient par l'hébergeur. Poids auto-hébergés&nbsp;: souveraineté maximale.</td></tr>
          <tr><td>Quelles données quittent l'environnement du client vers le modèle&nbsp;? <span class="flag">Critique</span></td><td>Distinguer précisément&nbsp;: (a) schémas et métadonnées, (b) contenu du glossaire de KPI, (c) échantillons de données réelles, (d) résultats de requêtes. Le RSSI veut savoir si des données de production transitent, et lesquelles.</td></tr>
          <tr><td>Des données personnelles transitent-elles&nbsp;?</td><td>En pratique, oui dès qu'un CRM ou un outil de support est connecté. Le nier serait faux et détectable.</td></tr>
          <tr><td>Existe-t-il un mécanisme de minimisation ou de masquage avant l'appel au modèle&nbsp;?</td><td>Si oui, le décrire&nbsp;: c'est un argument fort. Si non, le dire.</td></tr>
          <tr><td>Les données sont-elles conservées par le fournisseur d'inférence&nbsp;?</td><td>Citer la clause de rétention zéro du contrat Mistral si elle existe, avec sa référence.</td></tr>
        </tbody>
      </table>
    </div>

    <h4>4.3 Hébergement et résidence des données</h4>
    <div class="tw">
      <table>
        <thead><tr><th>Élément</th><th>Réponse</th></tr></thead>
        <tbody>
          <tr><td>Hébergeur de la plateforme Azul</td><td>Nom, localisation des centres de données, certifications de l'hébergeur</td></tr>
          <tr><td>Résidence des données</td><td>Union européenne par défaut</td></tr>
          <tr><td>Option on-premise / VPC client</td><td>Disponible — Azul s'exécute dans le VPC du client, les données ne sortent pas</td></tr>
          <tr><td>En mode on-premise, l'inférence reste-t-elle interne&nbsp;? <span class="flag">Critique</span></td><td><strong>Question piège classique.</strong> Si Azul tourne dans le VPC du client mais appelle une API d'inférence externe, la promesse «&nbsp;vos données ne sortent jamais&nbsp;» est inexacte. Si c'est le cas, corrigez la formulation commerciale avant qu'un RSSI ne le relève.</td></tr>
          <tr><td>Exposition au CLOUD Act américain</td><td>Dépend intégralement des deux points précédents. Répondre précisément&nbsp;: sujet devenu sensible depuis les auditions publiques de 2025 sur les garanties des fournisseurs américains.</td></tr>
        </tbody>
      </table>
    </div>

    <h3>5. Données du client&nbsp;: traitement et conservation</h3>
    <div class="note note--accent">
      <span class="note__tag">La question déterminante</span>
      <p><strong>Azul stocke-t-il une copie des données du client&nbsp;?</strong> Si Azul ne stocke que schémas, glossaire, historique des questions et traces, c'est un argument commercial majeur&nbsp;: la surface de risque est très réduite. Le dire clairement.</p>
    </div>
    <p>À documenter également&nbsp;: quelles données sont conservées et combien de temps (tableau par catégorie — schémas, métadonnées, glossaire de KPI, historique des questions, traces d'exécution, résultats mis en cache)&nbsp;; la mise en cache des résultats&nbsp;; le chiffrement au repos (algorithme, gestion des clés) et en transit (TLS&nbsp;1.2 minimum, 1.3 souhaité)&nbsp;; le cloisonnement entre clients&nbsp;; la réversibilité et la suppression en fin de contrat.</p>
    <div class="note note--critical">
      <span class="note__tag">Point de concentration de risque maximal</span>
      <p><strong>Gestion des secrets et identifiants de connexion.</strong> Où sont stockés les identifiants d'accès aux bases du client, comment sont-ils chiffrés, qui peut y accéder chez Azul. C'est le point de concentration de risque le plus élevé du produit.</p>
    </div>`,
  }),

  chapter({
    num: "04",
    title: 'Non-entraînement, contrôle d\'accès et <span class="it">traçabilité</span>',
    body: `
    <h3>6. Engagement de non-entraînement</h3>
    <p class="wide">Aucune donnée client — schémas, requêtes, réponses — n'est utilisée pour entraîner ou améliorer un modèle, qu'il s'agisse d'un modèle d'Azul ou d'un modèle tiers.</p>
    <p>Deux points à documenter&nbsp;: cet engagement doit être <strong>contractuel</strong>, figurant dans les CGU ou le DPA et pas seulement sur le site&nbsp;; et il doit être <strong>répercuté en amont</strong> — citer la clause du contrat Mistral, car un engagement d'Azul ne vaut que s'il est garanti côté fournisseur d'inférence. <span class="flag">Critique</span></p>
    <div class="note">
      <span class="note__tag">Éléments de posture vérifiables</span>
      <p>Le fichier <code>robots.txt</code> du site bloque explicitement les robots d'entraînement — GPTBot, ClaudeBot, CCBot, Google-Extended, Bytespider, Applebot-Extended, Amazonbot, meta-externalagent — tout en autorisant l'indexation. Aucun cookie ni traceur analytique sur le site. <strong>Posture vérifiable, pas déclarative.</strong></p>
    </div>

    <h3>7. Contrôle d'accès et permissions <span class="flag">Critique</span></h3>
    <p class="wide">Objection numéro un des DSI. Sans réponse solide, la garantie de lecture seule ne suffit pas&nbsp;: lire en lecture seule des données qu'un utilisateur ne devrait pas voir reste une fuite.</p>
    <div class="note note--warning">
      <span class="note__tag">Trois modèles possibles — un seul est un signal d'alerte</span>
      <p>(a) Azul hérite des permissions de la source en propageant l'identité de l'utilisateur&nbsp;; (b) Azul utilise un compte de service unique et applique ses propres règles&nbsp;; (c) mixte. <strong>Le modèle (b) est un signal d'alerte pour un RSSI</strong>&nbsp;: il signifie qu'un utilisateur peut interroger des données qu'il ne peut pas voir dans l'outil source.</p>
    </div>
    <p>À documenter aussi&nbsp;: la propagation de l'identité de l'utilisateur final jusqu'à la source&nbsp;; la gestion des rôles côté Azul (administrateur, utilisateur, lecteur&nbsp;; granularité par source)&nbsp;; SSO, SAML et SCIM — attendus en ETI, et si absents, donner une date&nbsp;; l'authentification multifacteur&nbsp;; et <strong>la journalisation des accès administrateurs Azul aux environnements clients</strong> <span class="flag">Critique</span> — qui, chez Azul, peut techniquement accéder aux données d'un client, dans quelles conditions, avec quelle traçabilité. Un RSSI pose toujours cette question.</p>

    <h3>8. Traçabilité et auditabilité</h3>
    <p class="wide">Chaque requête, chaque appel d'API et chaque document consulté est journalisé avec le raisonnement de l'agent. Toute réponse passée peut être rouverte et ses sources vérifiées.</p>
    <p>Reste à préciser&nbsp;: le contenu exact d'une trace (horodatage, utilisateur, question, plan, requêtes SQL émises, appels d'API, documents lus, résultat, version du modèle)&nbsp;; si <strong>la version du modèle est journalisée</strong> — nécessaire pour reproduire une réponse a posteriori, et peu de concurrents le font&nbsp;; la durée de conservation des journaux&nbsp;; leur exportabilité vers le SIEM du client, très demandée en ETI et indispensable en entité financière régulée&nbsp;; et leur immuabilité.</p>`,
  }),

  chapter({
    num: "05",
    title: 'Conformité <span class="it">RGPD</span> et position AI Act',
    body: `
    <h3>9. Conformité RGPD</h3>
    <p>Azul agit en <strong>sous-traitant</strong> au sens de l'article&nbsp;28 du RGPD&nbsp;; le client est responsable de traitement.</p>
    <p>À produire&nbsp;: l'accord de traitement (DPA), joignable au contrat&nbsp;; le registre des activités de traitement&nbsp;; <strong>la liste des sous-traitants ultérieurs</strong> <span class="flag">Critique</span> — elle doit inclure Mistral et l'hébergeur, avec pour chacun nom, rôle, localisation et garanties, car un DPO vérifiera cette liste&nbsp;; la procédure de notification de changement de sous-traitant, avec un préavis attendu de 30 jours minimum&nbsp;; les transferts hors UE (si aucun&nbsp;: le dire, c'est un argument fort&nbsp;; si transfert&nbsp;: clauses contractuelles types et analyse d'impact)&nbsp;; l'assistance aux demandes d'exercice de droits&nbsp;; et le délai d'engagement de notification de violation, 24 à 48&nbsp;heures après constatation.</p>

    <h3>10. Position au regard de l'AI Act</h3>
    <div class="note note--warning">
      <span class="note__tag">À faire relire par un avocat spécialisé</span>
      <p>Ce qui suit est une proposition de qualification, pas un avis juridique.</p>
    </div>
    <div class="tw">
      <table>
        <thead><tr><th>Question</th><th>Réponse proposée</th></tr></thead>
        <tbody>
          <tr><td>Azul est-il un système d'IA à haut risque&nbsp;?</td><td><strong>Non, selon notre analyse.</strong> L'annexe&nbsp;III du règlement (UE) 2024/1689 liste des usages fermés — tri de CV, scoring de crédit, tarification en assurance santé, notation d'étudiants, gestion des travailleurs, accès aux services essentiels. Un agent d'interrogation analytique en lecture seule n'y figure pas, et la liste n'a pas été élargie par le paquet Digital Omnibus.</td></tr>
          <tr><td>Azul est-il fournisseur d'un modèle d'IA à usage général (GPAI)&nbsp;?</td><td><strong>Non</strong>, dès lors qu'Azul consomme un modèle tiers sans le modifier substantiellement. Les obligations GPAI pèsent sur le fournisseur du modèle. À confirmer si un fine-tuning est réalisé — la qualification changerait.</td></tr>
          <tr><td>Et si le client utilise Azul pour un usage relevant de l'annexe&nbsp;III&nbsp;? <span class="flag">Critique</span></td><td>C'est le client, en tant que <strong>déployeur</strong>, qui entre alors dans le champ. Exemple typique&nbsp;: l'analyse de la performance des salariés, qui relève de la «&nbsp;gestion des travailleurs&nbsp;». Azul s'engage à fournir la documentation technique nécessaire à la conformité du déployeur — reste à préciser laquelle.</td></tr>
        </tbody>
      </table>
    </div>

    ${figAiAct}`,
  }),

  chapter({
    num: "06",
    title: 'Certifications, sécurité opérationnelle et risques <span class="it">propres aux agents</span>',
    body: `
    <h3>11. Certifications et calendrier <span class="flag">Critique</span></h3>
    <p class="wide">Section où l'honnêteté est la seule option viable. Un RSSI vérifie.</p>
    <div class="tw">
      <table>
        <thead><tr><th>Certification</th><th>Statut</th><th>Échéance engagée</th></tr></thead>
        <tbody>
          <tr><td>SOC 2 Type II</td><td>Si non engagé&nbsp;: le dire, et donner une date de démarrage</td><td>À compléter</td></tr>
          <tr><td>ISO/IEC 27001</td><td>À compléter</td><td>À compléter</td></tr>
          <tr><td>HDS — données de santé</td><td>Non détenue — Azul ne s'adresse pas aux traitements de données de santé</td><td>Non planifiée</td></tr>
          <tr><td>SecNumCloud</td><td>Non détenue</td><td>À envisager seulement si un axe secteur public est retenu</td></tr>
        </tbody>
      </table>
    </div>

    <div class="note note--accent">
      <span class="note__tag">Formulation recommandée en l'absence de certification</span>
      <p>Azul est une jeune entreprise et ne détient pas encore de certification externe. Le processus SOC&nbsp;2 Type&nbsp;II démarre le [date], pour une attestation attendue le [date]. Dans l'intervalle, nous proposons&nbsp;: (a) ce dossier complet, (b) un questionnaire de sécurité personnalisé sous [N] jours ouvrés, (c) une session technique avec vos équipes sécurité, (d) un engagement contractuel sur les points de cette section, (e) la possibilité d'un déploiement on-premise qui place l'exécution sous votre contrôle.</p>
      <p><strong>Le point (e) est votre meilleur atout face à un RSSI récalcitrant</strong>&nbsp;: la souveraineté du déploiement peut se substituer partiellement à la certification du fournisseur. Peu de concurrents peuvent le proposer.</p>
    </div>

    <h3>12. Sécurité opérationnelle</h3>
    <p>Huit champs à documenter&nbsp;: politique de sécurité formalisée&nbsp;; gestion des vulnérabilités et tests d'intrusion — <em>un pentest externe coûte quelques milliers d'euros et débloque des deals</em>&nbsp;; cycle de développement sécurisé (revue de code, analyse de dépendances, gestion des secrets)&nbsp;; sauvegarde et restauration avec RPO et RTO&nbsp;; plan de continuité et de reprise&nbsp;; procédure de réponse à incident&nbsp;; sensibilisation sécurité des équipes&nbsp;; et sous-traitance du développement — un RSSI demande si du code est produit hors UE.</p>

    <h3>13. Risques spécifiques aux agents IA</h3>
    <p class="wide">Section rare chez les fournisseurs. La produire vous distingue nettement — la plupart des dossiers de sécurité IA de 2026 traitent l'IA comme un logiciel classique.</p>
    <div class="tw">
      <table>
        <thead><tr><th>Risque</th><th>Traitement chez Azul</th></tr></thead>
        <tbody>
          <tr><td><strong>Injection de prompt via les données</strong> — un contenu malveillant dans un ticket, un document ou un champ de CRM détourne l'agent</td><td>Question de plus en plus posée. La lecture seule limite radicalement l'impact&nbsp;: un agent détourné ne peut ni écrire, ni exfiltrer vers un système tiers, ni déclencher d'action. <strong>Argument très fort, à condition qu'aucun connecteur sortant n'existe.</strong></td></tr>
          <tr><td>Réponse fausse délivrée avec confiance</td><td>Décrire le mécanisme d'abstention, la mesure d'exactitude et la trace qui permet la vérification. Renvoyer au protocole d'évaluation.</td></tr>
          <tr><td>Fuite inter-utilisateurs via le contexte</td><td>Un utilisateur peut-il, via l'historique ou le glossaire partagé, accéder à une information dérivée de données qu'il ne peut pas voir&nbsp;?</td></tr>
          <tr><td>Dérive lors d'un changement de version du modèle</td><td>Le client est-il notifié d'un changement de modèle&nbsp;? Les réponses passées restent-elles reproductibles&nbsp;? <strong>Peu de fournisseurs traitent ce point&nbsp;; c'est un différenciateur en entité régulée.</strong></td></tr>
          <tr><td>Dépendance à un fournisseur d'inférence unique</td><td>Plan de continuité si le fournisseur est indisponible ou modifie ses conditions.</td></tr>
        </tbody>
      </table>
    </div>

    <h3>14. Annexes à joindre</h3>
    <ul>
      <li>Schéma d'architecture et de flux de données</li>
      <li>Tableau des privilèges requis, par connecteur <span class="flag">Critique</span></li>
      <li>Accord de traitement des données (DPA)</li>
      <li>Liste des sous-traitants ultérieurs</li>
      <li>Conditions générales d'utilisation</li>
      <li>Attestation d'assurance RC professionnelle</li>
      <li>Rapport de test d'intrusion, s'il existe</li>
      <li>Plan d'assurance sécurité, si le client en exige un</li>
    </ul>`,
  }),

  chapter({
    num: "07",
    title: 'Les six champs à traiter en <span class="it">priorité absolue</span>',
    body: `
    <p class="wide">Parce qu'ils décident du deal. Note finale pour l'équipe Azul — à supprimer avant envoi.</p>

    ${kpis([
      {
        label: "§4.2 — Où a lieu l'inférence",
        value: "01",
        accent: true,
        note: "Tout le reste de votre argument de souveraineté en dépend.",
      },
      {
        label: "§3 — Privilèges par connecteur",
        value: "02",
        accent: true,
        note: "La pièce qui transforme une promesse commerciale en vérification technique faite par le client lui-même. C'est aussi la plus rapide à produire.",
      },
      {
        label: "§7 — Modèle de permissions fines",
        value: "03",
        accent: true,
        note: "Si votre réponse est « compte de service unique », vous avez un problème produit avant d'avoir un problème commercial.",
      },
      {
        label: "§5 — Gestion des secrets",
        value: "04",
        accent: true,
        note: "Point de concentration de risque maximal.",
      },
      {
        label: "§11 — Calendrier de certification",
        value: "05",
        accent: true,
        note: "Une date engagée vaut mieux qu'un silence.",
      },
      {
        label: "§13 — Injection de prompt",
        value: "06",
        accent: true,
        note: "Si vous pouvez démontrer qu'un agent détourné ne peut rien faire, vous avez l'argument de sécurité le plus fort du marché des agents d'entreprise en 2026 — précisément parce que tous vos concurrents vont vers l'action.",
      },
    ])}

    <div class="pull">
      <p>Sur un cycle Standard de 90 à 150 jours dont 2 à 4 semaines de revue sécurité, un dossier envoyé en amont peut retirer 3 à 6 semaines du cycle — et surtout éviter les deals perdus pour une raison non produit.</p>
      <cite>Le meilleur rapport effort/impact du go-to-market avant lancement</cite>
    </div>

    <h3>Contact</h3>
    <p>Toute question relative à ce dossier&nbsp;: adresse dédiée sécurité, à compléter. Délai d'engagement pour une réponse à un questionnaire de sécurité personnalisé&nbsp;: [N] jours ouvrés.</p>`,
  }),
].join("\n");

export const DOC_RSSI = buildDoc({
  title: "Azul — Dossier de sécurité et de conformité",
  eyebrow:
    'Azul <span class="sep">·</span> Planning stratégique <span class="sep">·</span> <b>Revue fournisseur</b>',
  h1: 'Dossier de sécurité et de <span class="it">conformité</span>',
  lede: "Document de revue fournisseur, à l'attention du RSSI, du DPO et de la direction des systèmes d'information. Version modèle — à compléter par l'équipe Azul avant diffusion.",
  meta: [
    { k: "Document", v: "Dossier RSSI — modèle" },
    { k: "Produit le", v: "15 septembre 2026" },
    { k: "À compléter", v: "69 champs, dont 20 critiques" },
    { k: "Coût de production", v: "3 à 5 jours-homme" },
    { k: "Gain de cycle", v: "3 à 6 semaines" },
  ],
  body,
});
