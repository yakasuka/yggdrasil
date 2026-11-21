<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Logo van het Yggdrasil-project" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Mihomo configuratie- en abonnementstools · Gebouwd rond het Ratatoskr-sjabloon
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="Kern: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="Nieuwste release" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="Toestemming vereist" /></a>
</p>

<p align="center">
  <a href="README.nl.md">Introductie</a> ·
  <a href="QUICKSTART.nl.md">Snel starten</a> ·
  <a href="CONTRIBUTING.nl.md">Bijdragen</a> ·
  <a href="CONTRIBUTORS.nl.md">Bijdragers</a> ·
  <a href="FAQ.nl.md">Veelgestelde vragen</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## Wat is het

**Yggdrasil is de applicatie en tooling; Ratatoskr is de kernconfiguratie.** Yggdrasil biedt de config builder, sjabloonparsering, YAML-generatie en abonnementslevering. Ratatoskr definieert de routeringsregels, regiocatalogus, nodefilters en proxygroepen.

De builder leest de catalogus en regels uit het Ratatoskr-sjabloon en combineert geselecteerde nodes en outbound-strategieën tot een persoonlijke YAML. Het sjabloon fungeert daarmee zowel als direct bruikbare configuratiebasis als gedeelde databron voor catalogus en builder.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil organiseert, genereert en levert; Ratatoskr is de configuratie die bij de gebruiker aankomt.**

## Belangrijkste functies

- **Advertentieblokkering op desktopniveau.** Bevat het AdGuard Windows-desktopregelabonnement met ongeveer 316.000 geblokkeerde domeinen, dat de officiële upstream volgt met lui, wijzigingsafhankelijke updates.
- **Lichte routing op basis van Geo.** GeoSite en GeoIP bevatten classificatiedata; de hoofdconfiguratie is ongeveer 28 KB met een duidelijke routeringsintentie.
- **Vijf outbound-strategieën.** Handmatige selectie, URL-test, failover, consistent-hashing load balancing en round-robin downloadbalancing.
- **Applicatie- en regiocatalogus.** Proxygroepen voor ChatGPT, Claude, Telegram, Spotify, Steam en meer; regiogroepen voor Hongkong, Taiwan, Japan, Korea, Singapore en de VS, met eigen iconen.
- **Geautomatiseerde levering.** Regelinhoud wordt alleen opgehaald als de inhoud verandert — laag resourcegebruik en deterministische uitvoer. Releases bieden een vaste downloadlink en een SHA-256-controlesom.

## Een configuratie kiezen

Download de hoofdconfiguratie van [Releases](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) of gebruik [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) in de repository.

| Behoefte | Ingang |
| :--- | :--- |
| Dagelijkse hoofdconfiguratie | Vaste release-link / repositoriesjabloon |
| Persoonlijke configuratie visueel genereren | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| Volledige documentatie | [Snel starten](QUICKSTART.nl.md) |

## Licentie en feedback

**All Rights Reserved · Voorafgaande schriftelijke toestemming vereist.** Gebruik, uitvoering, wijziging, redistributie, publieke implementatie en commerciële toepassing van origineel materiaal vereisen voorafgaande schriftelijke toestemming van de rechthebbende; persoonlijk en niet-commercieel gebruik is inbegrepen. Zie [LICENSE](../../LICENSE). Materiaal van derden blijft onderworpen aan de eigen licenties.

Meld problemen of vraag toestemming aan via [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues). Verwijder abonnementstokens en node-credentials uit meldingen.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · configuratietool en kernsjabloon die samenwerken.</sub></p>
