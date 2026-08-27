# RIZE — Audit du prochain grand chantier

Date de l’audit : 28 août 2026.

## Diagnostic produit

RIZE possède déjà une identité Liquid Glass, un splash animé, un Dashboard “Aujourd’hui”, un hub Entraîner, une bibliothèque IQ et des Coachboards. L’expérience reste cependant hétérogène : le shell est premium alors que plusieurs panneaux métier sont encore composés de blocs utilitaires indépendants. Le Dashboard affiche surtout des compteurs et des CTA, mais ne répond pas encore assez fortement à la question « que dois-je faire maintenant ? ». Les motions sont concentrées sur le splash, l’arrivée des cartes et quelques hover states ; il manque des primitives cohérentes pour les états loading, succès, validation, progression, drawer et transition de page.

## Géométrie observée

Le référentiel normalisé actuel est cohérent pour la plupart des spots : x=0..100 va de la ligne de touche gauche à droite et y=0..100 va du milieu vers la baseline. Les corners sont à x=6/94, y=78 et se trouvent à l’extérieur de l’arc NBA dans le modèle mathématique actuel. L’audit calcule une frontière d’arc à x≈7,48 pour le corner gauche et x≈92,52 pour le corner droit à y=78 ; les positions x=6 et x=94 sont donc bien côté corner, mais les hitboxes et les cercles des joueurs doivent rester contenus dans l’angle sans franchir la ligne de touche ni la baseline.

Le modèle doit être enrichi avec une distinction entre `spotPoint` tactique et `playerCenter`/`hitbox` visuelle. Le point de référence d’un corner peut rester proche de la ligne à trois points, tandis que le centre du joueur doit être légèrement reculé vers l’extérieur et vers la baseline pour que son cercle ne chevauche pas visuellement l’arc. Les labels doivent aussi être placés vers l’intérieur du terrain pour ne pas être coupés.

La règle NBA officielle décrit une ligne parallèle à 3 pieds des lignes de touche et un arc à 23 pieds 9 pouces du centre du panier, les deux se rejoignant vers la zone de corner : https://official.nba.com/rule-no-1-court-dimensions-equipment/. Le modèle RIZE peut rester un demi-terrain NBA simplifié, mais la géométrie de l’arc, des lignes de touche, de la baseline, du paint et des points de joueur doit être calculée à partir d’un même repère au lieu de mélanger plusieurs approximations.

## Couverture tactique observée

La bibliothèque `IQ_PLAY_LIBRARY` contient actuellement les plays exécutables suivants : High PnR, Empty Corner PnR, Spain PnR, Pistol, Horns Fist, Zoom/Stagger, BLOB Box Lob, BLOB Stack Cross et SLOB Elevator. Les leçons et scénarios référencent aussi des familles qui ne possèdent pas encore de board direct : Ghost PnR, Double Drag, Chicago/Zoom, Horns Elbow Split, BLOB Zipper et SLOB Safety.

L’impression de plays « balancés » vient de trois problèmes différents. Premièrement, un `relatedPlayId` n’est pas toujours un play possédant une séquence renderable. Deuxièmement, les frames actuelles décrivent bien une disposition et quelques mouvements, mais pas toujours la chaîne complète `alignment → trigger → first read → counter → safety → transition defense`. Troisièmement, certaines instructions mélangent une cible de rôle (`rim`, `corner-right`) et une cible de joueur sans métadonnée indiquant si l’action est une passe, un déplacement, un écran légal ou une lecture conditionnelle.

Le prochain modèle tactique doit donc distinguer : `primaryOption`, `counter`, `safety`, `defensiveCoverage`, `readOrder`, `nextFrameOnRead` et `transitionAfterPlay`. Les frames ne doivent pas être une simple suite de positions ; elles doivent être la représentation visuelle d’un arbre de décisions du meneur.

## Direction UX recommandée

La refonte doit conserver quatre espaces produit : Aujourd’hui, Entraîner, Progresser et Maîtriser. Le Dashboard doit devenir un cockpit quotidien avec une seule action prioritaire, un indicateur de readiness/charge, la dernière preuve de travail et une timeline courte. La page d’ouverture doit être rapide : splash de 1,3 à 1,7 seconde maximum, possibilité de passer, puis arrivée sur une carte « prochaine action » plutôt que sur une mosaïque de compteurs.

Les motions recommandées sont : apparition en cascade légère des sections, morphing du CTA principal lorsqu’une séance est terminée, pulse discret sur une donnée nouvellement enregistrée, transition de drawer pour les détails, et animation du Coachboard limitée aux changements de frame. Les animations doivent utiliser transform/opacity, rester sous 300 ms pour les interactions fréquentes, et être désactivées ou réduites avec `prefers-reduced-motion`.

## Périmètre d’implémentation recommandé

1. Recalibrer le modèle de terrain avec spots, centres joueurs, hitboxes et labels.
2. Ajouter les cases manquantes aux plays réellement présents dans IQ.
3. Refondre les frames autour d’un contrat de lecture tactique commun.
4. Transformer Aujourd’hui en cockpit de prochaine action sans casser les clés localStorage.
5. Extraire les primitives motion et feedback dans `index.css` sans réorganiser le dépôt.
6. Tester les parcours mobile 390×844, tablette et desktop, en thème sombre et clair.

## Sources

- NBA Official, Rule No. 1: Court Dimensions – Equipment. https://official.nba.com/rule-no-1-court-dimensions-equipment/
- FIBA Equipment & Venue Centre, Venue Design. https://www.venueguide.fiba.basketball/vanue-design

## Références tactiques consultées

Les références publiques consultées confirment la structure retenue pour les nouveaux boards : le double drag est une succession d’écrans balle qui doit préserver l’espacement ; le ghost screen repose sur une menace d’écran suivie d’une sortie avant contact ; la Chicago action enchaîne un pindown et un DHO ; les remises BLOB/SLOB doivent prévoir une première option, un counter et une safety.

Sources pédagogiques ouvertes consultées :

- Basketball For Coaches, “5 Simple Basketball Inbound Plays”. https://www.basketballforcoaches.com/basketball-inbound-plays/
- The Hoops Geek, “10 Simple Basketball Inbound Plays”. https://www.thehoopsgeek.com/basketball-inbound-plays/
- Coach’s Clipboard, “Box Baseline Out-Of-Bounds Plays”. https://www.coachesclipboard.net/OBBoxPlays.html
- The Hoops Geek, “The Complete Guide to Horns Offense”. https://www.thehoopsgeek.com/basketball-horns-offense/
- Level Up Basketball, “The Pick-and-Roll, Explained”. https://www.levelupbasket.com/blog/the-pick-and-roll-explained

## Vérification preview après première tranche UI

La preview de production montre un splash avec ballon, orbites discrètes, statut offline-first et sortie automatique. Après l’introduction, le Dashboard affiche une carte de prochaine action distincte au-dessus des métriques et des actions rapides. La hiérarchie est lisible sur la largeur desktop simulée et le shell conserve un overflow horizontal masqué. La carte principale orange reste orientée CTA et les compteurs secondaires n’écrasent pas le message produit.

## Vérification preview Playbook

La preview affiche les nouveaux plays `Zoom / Stagger Exit`, `Double Drag`, `Ghost Pick-and-Roll`, `Chicago Action` et `Horns Elbow Split` dans Offense de base avec le badge BOARD. La section Défense affiche Shell Defense, zone 2-3, défense du Pick-and-Roll, du 5-Out et du Post-Up, chacun avec BOARD. La hiérarchie en deux colonnes reste lisible et le panneau de sélection garde une largeur contenue.

## Vérification Coachboard Zoom

Le nouveau `Zoom / Stagger Exit` est visible avec le badge BOARD et s’ouvre en plein écran. Le premier frame montre le shooteur dans le corner faible, les screeneurs répartis vers block-left/block-right et les autres joueurs en spacing top/corner ; les contrôles précédent, reset et étape suivante sont présents. La capture headless lancée sans budget temporel est restée sur le splash, ce qui confirme seulement que le splash occupe bien le viewport au démarrage ; un test mobile différé est encore requis pour inspecter le board lui-même à 390×844.

## Validation visuelle du Dashboard final

Le build final montre le splash avec le ballon, les orbites et les deux marqueurs produit. Après la sortie, le Dashboard place la carte de prochaine action avant les compteurs et les actions rapides. Le CTA reste clairement dominant, les métriques sont secondaires et les boutons de navigation sont suffisamment larges pour un usage au pouce sur la largeur contrôlée.

## Validation de la logique de play

Dans la preview finale, le play `Zoom / Stagger Exit` affiche maintenant trois cartes de décision sous les options : `1 · Première lecture`, `2 · Counter` et `3 · Safety`. Le contenu reprend les lectures du catalogue IQ et rend explicite l’ordre de décision avant l’ouverture du board. Cette structure corrige l’impression d’un play seulement décoratif ou balancé.
