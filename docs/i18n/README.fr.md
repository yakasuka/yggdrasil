<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Logo du projet Yggdrasil" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Outils de configuration et d'abonnement Mihomo · Basés sur le modèle Ratatoskr
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="Noyau : Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="Dernière version" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="Autorisation préalable requise" /></a>
</p>

<p align="center">
  <a href="README.fr.md">Introduction</a> ·
  <a href="QUICKSTART.fr.md">Démarrage rapide</a> ·
  <a href="CONTRIBUTING.fr.md">Guide de contribution</a> ·
  <a href="CONTRIBUTORS.fr.md">Contributeurs</a> ·
  <a href="FAQ.fr.md">Questions fréquentes</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## Présentation

**Yggdrasil est l'application et les outils ; Ratatoskr en est la configuration centrale.** Yggdrasil fournit le générateur de configuration, l'analyse de modèles, la génération YAML et la diffusion d'abonnements. Ratatoskr définit les règles de routage, le catalogue des régions, les filtres de nœuds et les groupes proxy.

Le générateur lit le catalogue et les règles du modèle Ratatoskr et combine les nœuds sélectionnés avec les stratégies de sortie pour produire un YAML personnel. Le modèle sert ainsi à la fois de base de configuration prête à l'emploi et de source de données partagée entre le catalogue et le générateur.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil organise, génère et diffuse ; Ratatoskr est la configuration qui parvient à l'utilisateur.**

## Fonctionnalités clés

- **Blocage des publicités niveau desktop.** Inclut l'abonnement aux règles AdGuard Windows desktop avec environ 316 000 domaines bloqués, suit l'upstream officiel avec des mises à jour paresseuses déclenchées par les changements.
- **Routage léger basé sur Geo.** GeoSite et GeoIP transportent les données de classification ; la configuration principale fait environ 28 Ko avec des intentions de routage claires.
- **Cinq stratégies de sortie.** Sélection manuelle, URL-test, failover, répartition par hachage cohérent et répartition des téléchargements en round-robin.
- **Catalogue d'applications et de régions.** Groupes proxy pour ChatGPT, Claude, Telegram, Spotify, Steam, etc. ; groupes régionaux pour Hong Kong, Taïwan, le Japon, la Corée, Singapour et les États-Unis, avec des icônes dédiées.
- **Diffusion automatisée.** Les corps de règles ne sont récupérés que lorsque le contenu change — faible consommation de ressources et sortie déterministe. Les releases fournissent un lien de téléchargement fixe et une somme de contrôle SHA-256.

## Choisir une configuration

Téléchargez la configuration principale [depuis la release](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) ou utilisez directement [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) du dépôt.

| Besoin | Point d'entrée |
| :--- | :--- |
| Configuration principale quotidienne | Lien fixe de la release / modèle du dépôt |
| Générer une configuration personnelle visuellement | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| Documentation complète | [Démarrage rapide](QUICKSTART.fr.md) |

## Licence et retours

**All Rights Reserved · Autorisation écrite préalable requise.** L'utilisation, l'exécution, la modification, la redistribution, le déploiement public et l'usage commercial de contenus originaux nécessitent l'autorisation écrite préalable du titulaire des droits ; les usages personnels et non commerciaux sont également concernés. Consultez les conditions complètes dans [LICENSE](../../LICENSE). Les éléments tiers restent soumis à leurs propres licences.

Signalez un problème ou demandez une autorisation via [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues). Retirez les jetons d'abonnement et les identifiants de nœuds de vos rapports.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · l'outil de configuration et le modèle central travaillent ensemble.</sub></p>
