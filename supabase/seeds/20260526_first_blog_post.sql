-- ============================================================================
-- Seed : premier article du blog Speetch — manifeste vision.
-- ----------------------------------------------------------------------------
-- Inséré en BROUILLON pour que l'owner ajoute la cover depuis l'admin avant
-- publication. Pas idempotent intentionnellement : on s'attend à un seul run.
-- Si tu rejoues, supprime d'abord la ligne existante par slug.
-- ============================================================================

insert into public.blog_posts (
  slug,
  title,
  excerpt,
  content_html,
  content_json,
  status,
  seo_title,
  seo_description,
  reading_time_minutes,
  author_id
) values (
  'pourquoi-studio-communication-ia',
  'Pourquoi nous bâtissons un studio de communication pensé avec l''IA',
  'Speetch est un studio de communication parisien construit autour d''une intuition simple : l''IA n''efface pas la direction artistique, elle l''amplifie. Voici ce que ça veut dire concrètement, et pour qui nous travaillons.',
  $html$<p>Nous avons fondé Speetch parce que le métier de la communication change — vite, et en profondeur. Les outils basculent. Les attentes des marques aussi. Et la question n'est plus de savoir si l'IA va s'inviter dans la création, mais avec quelle exigence on lui ouvre la porte.</p>

<p>Ce premier article est une note de vision. Une fois posée, elle nous servira de boussole pour tout le reste : les méthodes que nous publierons ici, les choix que nous expliquerons, les marques que nous accompagnons.</p>

<h2>Pourquoi un studio, pas une agence</h2>

<p>Le mot « agence » porte un héritage : grandes équipes, process lourds, livrables à la prestation. Le mot « studio » dit autre chose. Un studio fabrique. Il a une voix. Il assume une direction.</p>

<p>Speetch est pensé comme un studio premium à taille d'humain, dont chaque livrable porte une signature claire. Nous préférons travailler avec moins de marques, plus longtemps, et plus profondément. C'est notre seul moyen de garantir une vraie direction artistique — et pas une déclinaison de templates.</p>

<h2>L'IA n'efface pas la direction artistique, elle l'amplifie</h2>

<p>La tentation contemporaine est de croire que l'IA fait le travail à la place du studio. Elle ne le fait pas. Ce qu'elle fait, c'est multiplier le nombre de variations qu'un directeur artistique peut tester en une journée. Étendre la palette des recherches. Lever certaines barrières techniques.</p>

<p>Mais le jugement reste humain. La décision aussi. <strong>Le goût ne s'automatise pas.</strong> Ce qui distingue une marque, c'est la cohérence des choix qu'on fait à chaque étape — et ces choix appartiennent à une direction.</p>

<h3>Trois usages concrets de l'IA chez nous</h3>

<ul>
  <li><strong>Exploration visuelle accélérée.</strong> Nous générons rapidement des dizaines de pistes pour un univers de marque, puis nous trions à la main. L'IA défriche, l'œil humain choisit.</li>
  <li><strong>Personnages cohérents et incarnés.</strong> Pour les marques qui ont besoin d'une mascotte ou d'un porte-parole, nous travaillons avec des modèles image-to-image qui préservent l'identité d'une référence — pas des générateurs qui « inventent un visage » à chaque appel.</li>
  <li><strong>Outils sur-mesure pour le client.</strong> Chaque marque que nous accompagnons reçoit un espace de travail avec un assistant IA paramétré à sa voix. Pas un chatbot générique : un compagnon entraîné sur sa marque.</li>
</ul>

<h2>Le sur-mesure comme valeur cardinale</h2>

<p>Nous refusons les modèles génériques, les interfaces copiées, les chartes graphiques pré-mâchées. Une marque qui a quelque chose à dire mérite des artefacts qui ne ressemblent à aucun autre. C'est plus long. C'est plus exigeant. C'est précisément la valeur que nous proposons.</p>

<p>Concrètement, cela veut dire que chaque <a href="/clients">espace client Speetch</a> est conçu comme une livraison unique : ses pages, ses composants, sa narration. Le code lui appartient. La direction aussi.</p>

<h2>Pour qui nous travaillons</h2>

<p>Speetch s'adresse aux marques qui ont une intention claire — qui ont quelque chose à dire et qui veulent le dire bien. Pas forcément des grandes structures. Pas forcément des budgets démesurés. Une marque émergente avec une vraie vision peut être un meilleur partenaire qu'une entreprise installée qui cherche un prestataire de plus.</p>

<p>Nous travaillons en équipe rapprochée. Nous nous engageons sur la qualité, pas sur les volumes. Et nous documentons notre méthode au fur et à mesure — ce blog en est le premier témoignage.</p>

<h2>Et après</h2>

<p>Les prochaines chroniques détailleront des chantiers concrets : comment nous construisons une mascotte cohérente, comment nous installons un assistant IA dans un espace client, comment nous lisons une demande de marque pour en faire un projet de studio plutôt qu'une simple commande.</p>

<p>D'ici là, vous pouvez explorer notre <a href="/">vision globale</a> ou nous écrire directement. La communication à l'ère de l'IA n'est pas une mode — c'est un changement de standard. Nous voulons en être l'un des points de repère.</p>$html$,
  '{}'::jsonb,
  'draft',
  'Manifeste Speetch — un studio de communication à l''ère de l''IA',
  'Pourquoi un studio plutôt qu''une agence, et comment l''IA s''intègre à la direction artistique chez Speetch. Une note de vision depuis Paris.',
  4,
  (select id from public.profiles where is_owner = true limit 1)
);
