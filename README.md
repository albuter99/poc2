# MDM | PoC d'indexation

Maquette interactive en français avec **trois écrans** :

1. Document : ajout fictif d'un fichier, métadonnées remplies aléatoirement puis modifiables, et types d'indexation adaptés.
2. Indexation : proposition d'une chaîne complète ou saisie terme par terme avec `Tab`/`Entrée`, texte libre selon le type, et suggestions marquées `*` pour les nouveautés IA.
3. Révision finale : un résultat par type, vérifications, sauvegarde du brouillon et validation de démonstration.

## Démarrage

Ouvrir `index.html` dans un navigateur, ou consulter le site publié sur GitHub Pages.

## Publication

Le workflow `.github/workflows/pages.yml` déploie automatiquement le contenu de la branche `main` lorsque GitHub Pages est configuré avec **GitHub Actions** comme source dans `Settings > Pages`.

## Limites de cette PoC

- Les fichiers ne sont **ni lus ni envoyés**. Seul le nom du fichier sélectionné est retenu.
- Les métadonnées automatiques, extraits de documents et recommandations sont **simulés**.
- Les règles de correspondance entre types de documents et types d'indexation sont **illustratives** et devront être validées.
- Les brouillons sont conservés uniquement dans le stockage local du navigateur, sans backend ni connexion au MDM.
- Les autres rubriques de navigation sont volontairement désactivées.