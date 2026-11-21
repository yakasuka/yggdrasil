<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Logo du projet Yggdrasil" />
</p>

<h1 align="center">Démarrage rapide</h1>

<p align="center">
  <a href="README.fr.md">Introduction</a> ·
  <a href="QUICKSTART.fr.md">Démarrage rapide</a> ·
  <a href="CONTRIBUTING.fr.md">Guide de contribution</a> ·
  <a href="CONTRIBUTORS.fr.md">Contributeurs</a> ·
  <a href="FAQ.fr.md">Questions fréquentes</a>
</p>

---

## Avant de commencer

Le projet utilise une licence **All Rights Reserved**. Obtenez l'autorisation écrite préalable du titulaire des droits concerné avant d'utiliser, d'exécuter, de modifier, de redistribuer, de déployer publiquement ou d'utiliser à des fins commerciales les contenus originaux du projet. Voir [LICENSE](../../LICENSE).

## Méthode recommandée : Config Builder

Ouvrez le [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) et suivez cinq étapes :

1. **Source d'abonnement.** Saisissez le nom du fournisseur ainsi qu'un abonnement YAML, Base64 ou sous forme de liens de nœuds courants. Les nœuds et les informations de trafic signalées par le fournisseur sont analysés.
2. **Nœuds par région.** Seules les régions réellement présentes dans l'abonnement sont affichées. Choisissez la plage de nœuds à conserver.
3. **Stratégies de nœuds.** Ne conservez que les stratégies automatiques nécessaires. La sortie par défaut est la sélection manuelle.
4. **Routage des applications.** Toutes les applications sont activées et proxifiées par défaut. Attribuez si besoin une région conservée, Direct ou Reject à chaque application.
5. **Confirmation finale.** Prévisualisez la configuration, téléchargez `name-ratatoskr.yaml` ou générez un lien d'abonnement persistant.

Les abonnements acceptent YAML, Base64 et les liens de nœuds courants. Les données de trafic proviennent du `Subscription-Userinfo` du fournisseur. Les vérifications de délai optionnelles mesurent le temps d'établissement de la connexion TCP entre le serveur de mesure et le nœud — il ne s'agit ni d'un ping ICMP ni de la latence complète du proxy.

## Méthode manuelle : utiliser le modèle directement

1. Téléchargez [ratatoskr-template.yaml](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml).
2. Maintenez localement vos propres `proxy-providers` / `proxies` avec les nœuds de l'abonnement.
3. Vérifiez que le client dispose des données GeoSite / GeoIP référencées.
4. Importez dans un client compatible Mihomo, choisissez une sortie par application ou par région, puis relancez les tests de délai.

## Ports

| Configuration | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| Modèle manuel | `7890` | `7891` |
| Fichier généré par le Config Builder | `7890` | `7890` |

Le Config Builder utilise un port mixte et autorise la personnalisation. Conservez les URL d'abonnement personnelles, les identifiants de nœuds et les jetons d'accès dans un flux local ou privé.

## Déploiement

Le Config Builder et le service d'abonnement sont déployés ensemble sur Cloudflare Pages. Consultez le [guide de déploiement](../../config-builder/docs/DEPLOYMENT.md) et la [vue d'ensemble de l'implémentation](../../config-builder/docs/IMPLEMENTATION.md).

---

<p align="center"><sub>Yggdrasil × Ratatoskr · l'outil de configuration et le modèle central travaillent ensemble.</sub></p>
