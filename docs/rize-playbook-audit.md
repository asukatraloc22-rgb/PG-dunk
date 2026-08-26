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
