# RIZE — Audit minuteur et Highlights

## Périmètre

Cette évolution ajoute trois comportements locaux : une tonalité courte à la fin du minuteur, une image de prévisualisation pour les vidéos importées et la gestion du classement d’une vidéo entre albums.

## Minuteur

Le son est généré par Web Audio avec un oscillateur sinusoïdal court. L’AudioContext est amorcé au clic sur `Démarrer`, ce qui respecte les restrictions d’autoplay des navigateurs mobiles. La tonalité est déclenchée une seule fois lorsque le compteur passe à `0:00`. Si le navigateur bloque Web Audio ou ne l’implémente pas, le minuteur reste utilisable sans erreur.

## Vignettes vidéo

Lors de l’import, RIZE charge temporairement la vidéo depuis le fichier local, capture une image autour du début de la séquence dans un canvas limité à 640 pixels de large, puis stocke la vignette JPEG dans IndexedDB avec la référence de la vidéo. L’interface reconstruit un Object URL uniquement pour l’affichage et le révoque lorsque la liste change ou que le composant est démonté.

Les vidéos déjà présentes sans vignette continuent d’afficher un état `Aperçu indisponible`. Si leur fichier redevient accessible lors de l’ouverture, RIZE tente de produire et de persister leur vignette à ce moment-là.

## Albums

Chaque carte vidéo contient un sélecteur `Déplacer vers`. Le déplacement met à jour uniquement `albumId` dans IndexedDB et la liste React, sans dupliquer le fichier ni modifier le fichier original du téléphone. La suppression passe par une confirmation. Elle retire la référence locale et sa vignette éventuelle de RIZE, mais ne supprime jamais le fichier original de la galerie ou du stockage du téléphone.

## Validation interactive

Une vidéo de test locale a été importée dans `Game Highlights`. La carte a affiché une image avec le badge `Aperçu local`. Elle a ensuite été déplacée vers `Moves & Handles`, où la vignette est restée visible. Après rechargement de la preview, l’album, la vidéo et la vignette ont persisté via IndexedDB. La boîte de confirmation de suppression a été affichée puis annulée afin de préserver l’état de test.

Le minuteur a été réglé sur une seconde et lancé. Le rendu a atteint `0:00` et le bouton est revenu à `Démarrer`. Le texte de l’interface indique explicitement qu’une courte tonalité locale accompagne la fin du compte à rebours.

## Limite locale à conserver

Les vidéos et leurs vignettes restent locales à l’appareil et au navigateur. Le fichier vidéo source n’est pas copié vers un cloud, et l’application ne peut pas supprimer physiquement une vidéo de la galerie du téléphone.
