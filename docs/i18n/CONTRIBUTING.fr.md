# Guide de contribution

<p align="center">
  <a href="README.fr.md">Introduction</a> ·
  <a href="QUICKSTART.fr.md">Démarrage rapide</a> ·
  <a href="CONTRIBUTING.fr.md">Guide de contribution</a> ·
  <a href="CONTRIBUTORS.fr.md">Contributeurs</a> ·
  <a href="FAQ.fr.md">Questions fréquentes</a>
</p>

---

## Façons de contribuer

Les Issues sont les bienvenues pour les rapports de bogues, les demandes d'autorisation et les suggestions. Indiquez les versions de votre client et du noyau, la configuration utilisée et le résultat de routage attendu — et retirez les jetons d'abonnement et les identifiants de nœuds.

## Commandes de développement

Le frontend du Config Builder et le compilateur de modèles partagé se trouvent dans `config-builder/` :

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

Le service local tourne à l'adresse `http://localhost:8788/config-builder/`.

## Structure du dépôt

| Chemin | Rôle |
| :--- | :--- |
| `resources/template/` | Modèle de configuration central |
| `resources/rules/` | Données de règles regroupées par source (adguard / aethersailor / download) |
| `config-builder/` | Frontend du Config Builder, compilateur partagé, service d'abonnement |
| `scripts/rules/` | Scripts de récupération et de synchronisation des règles (mises à jour paresseuses) |
| `scripts/endpoints/` | Anciens points d'accès `/merge` et `/sub` |
| `docs/i18n/` | Documentation wiki multilingue |

## Ajouter une application ou une région

Modifiez le catalogue statique [catalog.json](../../config-builder/shared/catalog.json). Après une reconstruction, le catalogue de la page et le modèle backend se mettent à jour en conséquence. Consultez la [vue d'ensemble de l'implémentation](../../config-builder/docs/IMPLEMENTATION.md) pour le flux de données complet.

## Mise à jour des règles

Les scripts de règles suivent le principe de la mise à jour paresseuse : des sondes conditionnelles ETag / Last-Modified ne récupèrent le contenu que lorsqu'il a changé. Deux workflows GitHub Actions gèrent respectivement les règles desktop AdGuard et la synchronisation des règles Aethersailor. Voir le [guide de déploiement](../../config-builder/docs/DEPLOYMENT.md).

## Documentation

Les documents multilingues se trouvent dans `docs/i18n/`. Chaque langue comporte cinq chapitres : README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS et FAQ. Pour ajouter une langue, copiez un jeu complet et renommez les fichiers avec le code de langue :

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

Les codes de langue suivent la norme BCP 47, par ex. `zh-CN`, `en`, `pt-BR`.
