# MDM | PoC de travail d'indexation

Démonstration HTML/CSS/JavaScript autonome, en français, publiée avec GitHub Pages.

## Parcours

0. **Travail d'indexation** : choisir **Nouvelle indexation**. **Modifier une indexation** est affiché, mais pas encore développé.
1. **Travail d'indexation** : un seul `Type d'indexation`, métadonnées du travail, du document et de l'affaire, puis fichier. Les dix types, les trois juridictions et les neuf types de document viennent des spécifications de travail. Les règles de restriction du type de document sont appliquées uniquement quand elles ont été explicitement fournies.
2. **Indexation** : une ligne ou plusieurs lignes pour les types annotés « N lignes », édition et cliquer-glisser des maillons, suggestions de termes, chaînes de référence et chaînes d'indexation. Les suggestions intelligentes sont identifiées par `*`.
3. **Révision** : résumé et contrôles **Nouveau terme** et **Suggestion intelligente (*)**, puis **Sauvegarder**.

**Sauvegarder (brouillon)** conserve une copie locale dans le navigateur, sans validation ni transfert vers MDM. Le bouton **Sauvegarder** de la révision conserve également une copie de démonstration. L'interface **Modifier une indexation** n'est pas encore disponible.

## Limites explicites

- Les affaires `DEMO-...` et les données associées sont fictives.
- Le fichier choisi n'est **pas lu** ni envoyé à un serveur. Seul son nom est affiché et peut être enregistré dans une copie locale.
- Les recommandations, la détection de termes nouveaux et la vérification IA sont simulées, sans connexion à un référentiel réel.
- `Langue du travail d'indexation` est configurée en français par défaut, à confirmer.
- La signification exacte des multiples lignes et le circuit final d'approbation métier restent à confirmer.
- Les correspondances document/type d'indexation non communiquées n'ont pas été inventées.

## Publication

Le dépôt contient un workflow `.github/workflows/pages.yml` qui publie les fichiers de la branche `main` sur GitHub Pages.