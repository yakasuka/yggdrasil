# Questions fréquentes

<p align="center">
  <a href="README.fr.md">Introduction</a> ·
  <a href="QUICKSTART.fr.md">Démarrage rapide</a> ·
  <a href="CONTRIBUTING.fr.md">Guide de contribution</a> ·
  <a href="CONTRIBUTORS.fr.md">Contributeurs</a> ·
  <a href="FAQ.fr.md">Questions fréquentes</a>
</p>

---

## Pourquoi la configuration est-elle si petite tout en couvrant de nombreux services ?

Ratatoskr référence des catégories de données Geo ; les données concrètes de domaines et d'adresses IP sont portées par la base de données. La configuration ne conserve que les références de catégories, l'ordre de correspondance et l'orchestration des sorties. La base Geo doit toujours être chargée et mise à jour par le client.

## Un seul YAML peut-il être utilisé dans tous les clients ?

La configuration cible Mihomo. Le client doit prendre en charge la syntaxe correspondante et inclure les catégories Geo référencées. Les fonctions de capture réseau telles que DNS et TUN dépendent du modèle choisi et de l'environnement de l'appareil.

## La maintenance nécessite-t-elle de réécrire toute la configuration à chaque fois ?

Les catégories de données Geo, les sources de règles complémentaires, les abonnements de nœuds et les stratégies de sortie sont maintenus séparément. Mettez à jour les données via le mécanisme du client et n'ajustez les règles ou groupes proxy concernés qu'en cas de besoin ; les noms de catégories et les références doivent rester valides.

## Comment les règles de blocage des publicités sont-elles mises à jour ?

GitHub Actions sonde quotidiennement l'upstream officiel d'AdGuard et ne récupère les mises à jour que lorsque le contenu change, selon une approche de mise à jour paresseuse à faible consommation de ressources.

## Quel est le lien entre le Config Builder et la configuration principale ?

Le Config Builder (l'application Yggdrasil) lit les définitions d'applications, de régions et de stratégies du modèle Ratatoskr et assemble une configuration personnelle à partir de vos sélections dans l'interface. L'un organise et génère ; l'autre définit le routage et les stratégies de nœuds réels.

## L'utilisation est-elle gratuite ? Une autorisation est-elle nécessaire ?

Le projet utilise une licence **All Rights Reserved**. L'utilisation, l'exécution, la modification, la redistribution, le déploiement public et l'usage commercial de contenus originaux nécessitent l'autorisation écrite préalable du titulaire des droits ; les usages personnels et non commerciaux sont également concernés. Consultez les conditions complètes dans [LICENSE](../../LICENSE). Demandez une autorisation via [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues).
