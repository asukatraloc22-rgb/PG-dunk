# Checklist de test mobile — PG Dunk

## Préparation

Utiliser une URL HTTPS accessible depuis le téléphone ou la tablette. Ouvrir l’application une première fois en ligne et attendre la fin du chargement. Pour le test local, conserver le même navigateur pendant toute la vérification afin de ne pas mélanger les caches.

| Test | Résultat attendu | Statut |
|---|---|---|
| Ouverture initiale en ligne | L’application se charge sans erreur | À tester |
| Manifest détecté | Nom PG Dunk, couleur bleu nuit et icône dorée | À tester |
| Installation Android | Chrome propose « Installer l’application » ou « Ajouter à l’écran d’accueil » | À tester |
| Installation iOS/iPadOS | Safari permet « Sur l’écran d’accueil » | À tester |
| Lancement depuis l’icône | L’application s’ouvre en mode autonome, sans barre d’URL visible | À tester |
| Rotation téléphone/tablette | L’interface reste utilisable en portrait et paysage | À tester |
| Navigation tactile | Tous les onglets et boutons répondent au toucher | À tester |
| Planning | Ajouter, modifier, réordonner et supprimer une séance | À tester |
| Workouts locaux | Générer, sauvegarder, mettre en favori et supprimer | À tester |
| Suivi du joueur | Enregistrer séance, poids et blessure ; vérifier la suppression | À tester |
| Suivi des tirs | Sélectionner une zone, choisir Réussi/Raté et vérifier les statistiques | À tester |
| Performance | Saisir les mesures et vérifier les résultats | À tester |
| Quiz et minuteur | Répondre au quiz, démarrer, mettre en pause et réinitialiser le minuteur | À tester |
| Persistance | Fermer puis rouvrir l’application ; les données locales sont conservées | À tester |
| Hors connexion | Activer le mode avion après le premier chargement ; l’interface locale reste accessible | À tester |
| Mise à jour | Revenir en ligne après publication d’une nouvelle version ; le nouveau build est récupéré | À tester |

## Points à signaler

Noter le modèle de l’appareil, le système d’exploitation, le navigateur, l’orientation utilisée et le nom exact de toute fonctionnalité qui échoue. Pour une erreur de synchronisation, préciser si l’utilisateur était connecté à Supabase ou en mode local.

## Limite actuelle

La version actuelle est une **PWA installable**. Elle n’est pas encore un paquet APK ou IPA distribué par un store. Les données locales reposent sur le stockage du navigateur ; il ne faut donc pas effacer les données du navigateur pendant la phase de test.

## Critère de passage vers le design premium

La refonte visuelle peut commencer lorsque l’installation, le hors connexion, la persistance locale et les parcours principaux fonctionnent sur au moins un appareil Android et un appareil Apple, sans régression bloquante.
