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

## Test du minuteur — 27 août 2026

Dans la preview de production, le minuteur a été réglé à deux secondes puis démarré après l’amorce audio utilisateur. À `0:00`, l’interface a affiché `Arrêter l’alarme`, confirmant que la tonalité n’est plus un événement unique mais une alarme répétée arrêtée explicitement par l’utilisateur. Le bouton `Démarrer` reste disponible pour une nouvelle séquence.

La logique d’échéance continue de reposer sur `Date.now()` et le stockage local afin de rattraper le temps écoulé lorsque la page revient au premier plan. Une PWA web ne peut toutefois pas maintenir un son garanti si le système a tué son processus ; dans ce scénario, RIZE conserve un état terminé et propose une reprise sonore après retour.

## Validation du chantier arrière-plan / IQ — 27 août 2026

Le minuteur a été exécuté à deux secondes dans la preview fraîche. À `0:00`, le bouton `Arrêter l’alarme` est resté visible, confirmant que la tonalité est répétée jusqu’à une action explicite. Le signal est amorcé au clic de démarrage et la vibration est sollicitée quand l’appareil la supporte.

Le module IQ a été contrôlé après remplacement des rails horizontaux par un retour à la ligne. Dans le DOM de production, `document.scrollWidth` est égal à `document.clientWidth` (`1265`), le rail de modes a `scrollWidth === clientWidth` (`1165`) et le rail de catégories a `scrollWidth === clientWidth` (`804`). Les boutons IQ sont donc contenus sans scrolling horizontal obligatoire.

Une capture `390 × 844` a confirmé que le shell mobile reste contenu. Les deux elbows et les corners disposent en plus de boutons d’accès rapides dans Sniper, indépendants du ciblage direct sur le SVG.
