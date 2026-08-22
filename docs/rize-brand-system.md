# RIZE — Système de marque et direction UX/UI

## Positionnement

**RIZE** est le gestionnaire personnel du basketteur ambitieux. L’application transforme les entraînements, les mesures et les habitudes de travail en une trajectoire de progression lisible.

> **Promesse :** mesure ton travail, maîtrise ton jeu, élève ton niveau.

Le ton doit être direct, précis et motivant sans tomber dans le discours criard de salle de sport. RIZE doit donner la sensation d’un outil utilisé par un athlète sérieux, avec une qualité d’exécution comparable à un produit premium de coaching.

## Principes de design

| Principe | Application |
|---|---|
| Performance lisible | Une métrique importante par carte, avec unité, tendance et prochaine action |
| Décision rapide | L’accueil répond en quelques secondes à « Que dois-je faire aujourd’hui ? » |
| Énergie maîtrisée | Les accents orange-or sont réservés aux actions, progrès et états positifs |
| Profondeur premium | Bleu nuit, surfaces superposées, bordures discrètes et ombres très contrôlées |
| Confiance | États vides utiles, confirmations explicites et messages d’erreur actionnables |
| Mobile d’abord | Navigation utilisable au pouce, zones tactiles généreuses et contenu respirant |

## Palette de départ

| Token | Valeur | Usage |
|---|---|---|
| `rize-ink` | `#07152A` | Fond principal |
| `rize-surface` | `#101F36` | Cartes et panneaux |
| `rize-surface-raised` | `#172A46` | Cartes actives et overlays |
| `rize-gold` | `#F5B83D` | Marque et highlights |
| `rize-orange` | `#F97316` | CTA et énergie |
| `rize-cream` | `#FFF8E8` | Contraste premium |
| `rize-muted` | `#94A3B8` | Texte secondaire |
| `rize-success` | `#34D399` | Progression validée |
| `rize-danger` | `#FB7185` | Alertes et blessures |

## Architecture mobile cible

La navigation actuelle expose huit modules au même niveau. La cible rassemble les fonctions en quatre espaces :

| Espace | Contenu |
|---|---|
| **Aujourd’hui** | Résumé du jour, prochaine séance, progression récente et CTA principal |
| **Entraîner** | Workouts, planning, minuteur et Sniper Tracker |
| **Progresser** | Performance, suivi joueur et statistiques |
| **Maîtriser** | IQ Meneur, Playbook et contenus de lecture |

Une barre de navigation fixe basse sera privilégiée sur téléphone. Sur tablette et écran large, elle pourra devenir une navigation latérale compacte. Les modules secondaires s’ouvriront depuis les espaces principaux au lieu d’occuper tous la même ligne.

## Typographie et composants

La hiérarchie doit utiliser des titres courts, fortement contrastés, des chiffres de performance plus grands et des libellés secondaires sobres. Les composants de base à créer sont `RizeShell`, `RizeBottomNav`, `RizeCard`, `RizeMetric`, `RizeProgress`, `RizeButton`, `RizeEmptyState` et `RizeSectionHeader`.

## Garde-fous de migration

La refonte ne doit pas modifier les calculs, les clés `localStorage`, le repository de workouts, le service worker ni le manifest. Chaque écran métier sera rebranché sur les mêmes handlers après remplacement du shell visuel. Le tag `functional-baseline-20260822` reste le point de retour fonctionnel.
