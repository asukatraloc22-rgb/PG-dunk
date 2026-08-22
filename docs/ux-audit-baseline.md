# Audit UX de référence — PG Dunk

## État de référence

La version fonctionnelle a été gelée sur `main` au commit `3ebcc5d`. Un tag de restauration est disponible sous `functional-baseline-20260822`. La branche `integration/fusion-v1` pointe sur le même état fonctionnel.

## Parcours présents

| Domaine | Parcours actuellement disponible | Priorité UX |
|---|---|---:|
| Workouts IA | Génération, historique et favoris | Haute |
| Performance | Mesures de détente, RSI, apex et progression | Haute |
| Planning | Création, modification, suppression et réordonnancement des séances | Haute |
| Suivi joueur | Séances, poids et blessures | Haute |
| IQ Meneur | Quiz et progression | Moyenne |
| Playbook | Jeux, positions et coaching | Moyenne |
| Sniper Tracker | Zones, tirs réussis/ratés et statistiques | Haute |
| Timer | Démarrage, pause, remise à zéro et presets | Moyenne |

## Constats prioritaires

L’application possède actuellement trop de destinations de premier niveau dans une navigation horizontale. Cette structure expose huit modules au même niveau et oblige l’utilisateur à faire défiler la barre de navigation sur mobile. La refonte devra introduire une hiérarchie claire : un accueil orienté “Aujourd’hui”, puis des espaces Performance, Entraînement, Suivi et IQ/Playbook.

Les composants métier sont déjà séparés dans plusieurs fichiers, mais `App.tsx` reste le shell principal et contient encore une grande partie de la logique d’état et de rendu. La refonte devra donc commencer par le shell, les composants de navigation, les cartes et les primitives de formulaire, sans modifier les calculs ni les clés de persistance.

Le produit dispose d’une identité visuelle cohérente autour du bleu nuit et de l’or, mais l’interface peut gagner en perception premium grâce à une meilleure hiérarchie typographique, des états vides plus éditoriaux, des appels à l’action plus distinctifs, des transitions sobres et une navigation pensée d’abord pour le pouce.

## Garde-fous avant refonte

| Garde-fou | Décision |
|---|---|
| Version de secours | Tag `functional-baseline-20260822` |
| Logique métier | Ne pas modifier pendant la refonte du shell |
| Persistance | Conserver les clés existantes |
| PWA | Conserver manifest, service worker et icônes |
| Responsive | Tester au minimum 360 px, 390 px, 768 px et 1024 px |
| Validation | Typecheck, lint, build et parcours manuel après chaque bloc |

## Recommandation de séquencement

La prochaine étape doit être une décision de marque : choisir le nom, le ton et la promesse avant de créer le système visuel. Ensuite, il faudra transformer la navigation en expérience mobile-first, créer un tableau de bord “Aujourd’hui”, puis appliquer les mêmes composants premium aux écrans métier existants. Cette méthode évite de repeindre huit écrans séparément et donne une impression de produit cohérent de niveau senior.
