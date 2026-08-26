# RIZE — Audit Playbook et planning

## Vérification preview production

La preview fraîche du build affiche une seule entrée `Highlights` dans le groupe desktop principal et une seule entrée dans la navigation mobile dédiée. L’entrée secondaire précédemment présente dans le second groupe desktop a été supprimée.

Le Playbook affiche trois onglets principaux : `Offense`, `Défense` et `Sideline`. La section Offense contient les sous-sections `Offense de base` et `Offense contre une défense`. La section Défense contient `Défense : fondamentaux` et `Défense selon l’attaque`. La section Sideline contient `Sideline · médiane` et `Sideline · sous le panier`.

Les nouvelles cartes défensives sont visibles : `Shell Defense · closeout & gap`, `2-3 Zone · paint first`, `Défendre le Pick-and-Roll`, `Défendre le 5-Out` et `Défendre le Post-Up`. Les remises sont séparées entre `SLOB Elevator` / `SLOB · Floppy quick hitter` et `BLOB Box Lob` / `BLOB Stack Cross` / `BLOB · Box screen-the-screener`.

Chaque carte affiche maintenant `BOARD` ou `SHEET`, tandis que la fiche sélectionnée rappelle sa sous-section et le mode disponible. Les plays sans frames restent volontairement `COACH SHEET` et leur bouton Coachboard est désactivé ; aucune fausse animation générique n’est affichée.

## Points à contrôler ensuite

Le typecheck et le lint passent. Une vérification interactive reste recommandée sur téléphone pour l’ouverture d’une carte Planning, l’édition du nom/prescription d’un exercice et la persistance après rechargement. Le rendu desktop de la taxonomie Playbook est lisible ; sur mobile, les onglets de sections devront être vérifiés en largeur 390 px pour confirmer qu’ils ne sont pas trop serrés.

## Hub Entraîner et personnalisation

La preview confirme que `Entraîner` est une destination unique affichant la bibliothèque Meneur, la planification hebdomadaire et l’exécution. La bibliothèque source présente les actions `Démarrer` et `Planifier`. Le Planning expose une indication de personnalisation rapide sur les séances Meneur ouvertes ; les exercices peuvent être cochés, renommés ou recevoir une prescription différente pour cette occurrence planifiée, puis sauvegardés localement. Les sessions textuelles libres restent éditables comme simples entrées du planning.

La vérification a été réalisée dans une preview de production après build et typecheck. Le layout desktop compact reste centralisé ; la prochaine vérification doit confirmer l’ouverture d’une séance planifiée sur un écran mobile étroit et l’absence de débordement horizontal dans les formulaires inline.

## Vérification visuelle du Planning

La preview affiche les sept jours dans une grille responsive, avec les cartes de séances regroupées et les contrôles monter / descendre / modifier / supprimer visibles sans débordement horizontal dans la largeur testée. Les formulaires d’ajout restent contenus dans la carte d’orchestration. Les séances source Meneur restent visibles séparément au-dessus du planning, avec `Démarrer` et `Planifier`.

## Rebuild après synchronisation du Planning

Le build final reconstruit correctement après l’ajout de `plannerRevision`. La preview fraîche redémarre sans erreur et conserve le shell RIZE, la navigation unique Highlights, les trois familles Playbook et le hub Entraîner. La vérification interactive du rafraîchissement immédiat du Planning reste à effectuer depuis cette nouvelle instance.

La preview a aussi confirmé que les contrôles doivent être relus après chaque navigation : un index mémorisé peut cibler Suivi au lieu d’Entraîner lorsque l’état de page change. La navigation elle-même reste stable et les libellés sont correctement exposés.

La preview confirme le correctif `plannerRevision` : après le clic `Planifier` dans la bibliothèque Meneur, la carte apparaît immédiatement dans le Planning sans rechargement. En ouvrant la carte, les six exercices de la séance sont visibles, chacun avec son contrôle `Modifier`, ainsi que `Démarrer`. Le hub reste centralisé et la carte planifiée est identifiée par son compteur d’exercices réalisés.

La vérification interactive montre l’éditeur inline sur le premier exercice : deux champs dédiés `Nom personnalisé de l’exercice` et `Prescription personnalisée de l’exercice`, puis `Annuler` et `Enregistrer`. Les boutons restent contenus dans la carte de séance et le premier exercice conserve son emplacement sans débordement visible.

Le test d’édition inline a été exécuté avec succès : `Écartés couchés — amplitude contrôlée` et `3 × 12 tempo 3-1-1` sont acceptés dans les deux champs. L’interface affiche ensuite les actions d’annulation et d’enregistrement dans la carte, avec une largeur contenue pour le layout mobile.

Après enregistrement, la carte affiche immédiatement le nom `Écartés couchés — amplitude contrôlée` et la prescription `3 × 12 tempo 3-1-1`. La personnalisation reste donc locale à l’occurrence de séance planifiée et n’écrase pas la bibliothèque Meneur source.

## Validation visuelle du Coachboard graphique

La preview finale montre le Coachboard dans une couche plein écran indépendante. Le terrain utilise un gradient bois, la peinture est différenciée par un dégradé, les joueurs ont un anneau d’équipe, une ombre SVG et un label `OFF` / `DEF`, tandis que le ballon dispose d’un halo orange. La première frame du Pick & Roll conserve les deux corners, les wings et le high slot avec le porteur au top. Les contrôles de frame restent accessibles en bas de la couche.

## Finalisation défense, remises et contraste

Les Coachboards frame par frame sont désormais disponibles pour `Shell Defense · closeout & gap`, `2-3 Zone · paint first`, `Défendre le Pick-and-Roll`, `Défendre le 5-Out`, `Défendre le Post-Up`, `SLOB · Floppy quick hitter`, `SLOB Elevator`, `BLOB Box Lob`, `BLOB Stack Cross` et `BLOB · Box screen-the-screener`. Les cartes historiques BLOB/SLOB de la bibliothèque IQ affichent bien `BOARD` et résolvent leurs propres frames, sans mapping générique opaque.

Les remises sous panier utilisent une marge inbound à `y=95` dans la géométrie partagée afin que le joueur et le ballon restent visibles dans le viewBox, tout en restant proches de la baseline. Le Coachboard conserve le référentiel commun à Sniper : `x=0..100` de gauche à droite et `y=0..100` du milieu vers la baseline.

L’audit de contraste a conduit à assombrir les accents orange, ambre, sky, emerald et rose en thème clair, à renforcer les anciens textes `slate-500/600/700` en thème sombre, et à utiliser une encre sombre sur les CTA orange/ambre. Les ratios vérifiés sont supérieurs à 4,5:1 pour les combinaisons contrôlées, notamment 7,31:1 pour l’accent orange clair, 7,56:1 pour l’accent sky clair et 6,26:1 pour le texte muted sombre.

La preview production a confirmé le portail Coachboard en `1280 × 1100`, avec `x=0`, `y=0`, largeur et hauteur égales au viewport, et `body { overflow: hidden }`. Les thèmes clair et sombre ont été contrôlés visuellement sur Dashboard et Playbook ; le bouton de thème affiche bien `Clair` ou `Sombre`, les CTA restent lisibles, et les sections Défense/Sideline restent distinctes. Le Service Worker et le cache navigateur ont été purgés pendant le test pour éviter de valider un ancien bundle.

Le build final passe avec typecheck, lint et `git diff --check`. Les avertissements non bloquants restent la version TypeScript hors plage officiellement supportée par `@typescript-eslint`, Browserslist obsolète et un bundle principal supérieur à 500 kB.

La capture Chromium en `390 × 844` confirme un shell mobile-first sans débordement latéral : l’en-tête, le CTA d’installation, le hero orange et l’action principale restent contenus dans la largeur. La navigation basse reste superposée comme prévu par l’application ; les blocs de statistiques commencent sous le hero et restent accessibles par défilement.
