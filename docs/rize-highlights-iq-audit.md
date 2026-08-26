# Audit Highlights / IQ — 27 août 2026

- Preview de production utilisée : `http://localhost:4186/`.
- IQ : les rails catégories et modes sont contenus dans leur carte après ajout de `min-w-0`, `max-w-full` et `rize-horizontal-rail`; la scrollbar est courte et reste dans le panneau.
- Sniper : les boutons Elbow sont accessibles et libellés `Elbow / Mid-Range Left` et `Elbow / Mid-Range Right`.
- Highlights : la vue contient les albums locaux, le bouton d’import et l’état vide; aucun fichier personnel n’est présent dans cette origine de preview.
- À vérifier avant publication finale : import du fichier de test, vignette persistante et parcours `Ouvrir avec` après activation de la préférence système Android.

## Décisions techniques

Les vidéos fallback sont maintenant stockées sous forme de `fileBlob` local en plus de la vignette. Les anciennes entrées peuvent être régénérées automatiquement lorsqu’elles possèdent ce Blob. Le partage vers Android passe par `navigator.share` et ne peut pas cliquer à la place de l’utilisateur sur le choix système « Toujours utiliser »; RIZE mémorise donc la préférence de relance directe et laisse Android afficher sa propre boîte de dialogue.

## Vérification de la correction actuelle

- Le fichier `rize-open-with-test.mp4` a été importé dans la preview `http://localhost:4186/`.
- La carte a affiché une image `Prévisualisation de rize open with test`, avec le badge `Aperçu local`.
- Le menu `Ouvrir avec…` affiche l’option `Utiliser directement le sélecteur système` et explique clairement l’action Android `Toujours`.
- La preview Chromium de bureau ne propose pas le partage natif ; le bouton est donc désactivé dans cet environnement, ce qui est attendu. Le parcours natif doit être vérifié dans la PWA installée sur Android.
- Le rail de catégories IQ ne sort plus de la carte ; la scrollbar reste confinée à son conteneur.

## Test de lecture intégré

Dans la preview finale, le fichier de test a été importé puis affiché avec sa vignette locale. Le dialogue `Ouvrir avec…` présente désormais `Lire dans RIZE`, `Choisir une application du téléphone` et `Ouvrir dans le navigateur`. Le bouton `Lire dans RIZE` a rendu le lecteur vidéo interne avec poster et contrôles, ce qui fournit un chemin de lecture stable quand le partage Android n’est pas disponible dans le navigateur de bureau.
