# Architecture cible de PG Dunk

Cette branche d’intégration utilise `src/App.tsx` comme point d’entrée fonctionnel temporaire. Les fonctionnalités seront extraites progressivement par domaine afin de stabiliser le produit avant la refonte visuelle.

```text
src/
  App.tsx                 # composition temporaire de l’application
  main.tsx                # bootstrap Vite/React
  index.css               # styles globaux et directives Tailwind
  components/             # composants UI réutilisables
  features/
    workouts/             # génération, bibliothèque, historique et favoris
    performance/          # détente, RSI et progression
    shooting/             # suivi des tirs et statistiques par zone
    playbook/              # quiz IQ et situations tactiques
    tracking/             # planning, poids et historique de séances
    recovery/             # blessures, récupération et minuteur
  lib/                    # clients API, persistance et utilitaires
  types/                  # contrats partagés du domaine
  data/                   # contenus statiques et seeds
```

## Règles de migration

Chaque domaine doit regrouper ses types, sa logique, ses composants et ses tests. Les fonctionnalités seront d’abord rendues fonctionnelles avec une persistance locale normalisée, puis connectées au backend. Les clés API et les appels LLM resteront côté serveur. Le design premium sera traité après la création de la version fonctionnelle complète.

## État de la phase 2

Le point d’entrée Vite importe désormais les fichiers depuis `src/`, le document HTML possède les métadonnées françaises du produit et la branche d’intégration dispose d’une structure cible documentée. Aucune fonctionnalité des deux autres dépôts n’a encore été copiée.
