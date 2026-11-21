<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Yggdrasil-Projektlogo" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Mihomo-Konfigurations- und Abonnement-Tools · Basierend auf der Ratatoskr-Vorlage
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="Kern: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="Neueste Version" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="Vorherige Genehmigung erforderlich" /></a>
</p>

<p align="center">
  <a href="README.de.md">Einführung</a> ·
  <a href="QUICKSTART.de.md">Schnellstart</a> ·
  <a href="CONTRIBUTING.de.md">Mitwirken</a> ·
  <a href="CONTRIBUTORS.de.md">Mitwirkende</a> ·
  <a href="FAQ.de.md">Häufige Fragen</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## Was ist es

**Yggdrasil ist die Anwendung und das Toolset; Ratatoskr ist die zentrale Konfiguration.** Yggdrasil bietet den Config Builder, Template-Parsing, YAML-Generierung und Abonnement-Auslieferung. Ratatoskr definiert die Routing-Regeln, den Regionskatalog, Node-Filter und Proxy-Gruppen.

Der Builder liest Katalog und Regeln aus der Ratatoskr-Vorlage und kombiniert ausgewählte Nodes und Outbound-Strategien zu einem persönlichen YAML. Die Vorlage dient damit sowohl als sofort nutzbare Konfigurationsbasis als auch als gemeinsame Datenquelle für Katalog und Builder.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil organisiert, generiert und liefert aus; Ratatoskr ist die Konfiguration, die beim Nutzer ankommt.**

## Hauptfunktionen

- **Werbeblocking auf Desktop-Niveau.** Enthält das AdGuard-Windows-Desktop-Regel-Abonnement mit etwa 316.000 blockierten Domains, folgt dem offiziellen Upstream mit faulen, bei Änderungen erfolgenden Updates.
- **Leichtgewichtiges Geo-Routing.** GeoSite und GeoIP enthalten die Klassifikationsdaten; die Hauptkonfiguration ist etwa 28 KB groß mit klar lesbarer Routing-Absicht.
- **Fünf Outbound-Strategien.** Manuelle Auswahl, URL-Test, Failover, Lastverteilung mit Consistent Hashing und Round-Robin-Download-Verteilung.
- **Anwendungs- und Regionskatalog.** Proxy-Gruppen für ChatGPT, Claude, Telegram, Spotify, Steam und mehr; Regionsgruppen für Hongkong, Taiwan, Japan, Korea, Singapur und die USA, mit eigenen Icons.
- **Automatisierte Auslieferung.** Regelinhalte werden nur bei Änderungen abgerufen – geringer Ressourcenverbrauch und deterministische Ausgabe. Releases bieten einen festen Download-Link und eine SHA-256-Prüfsumme.

## Konfiguration auswählen

Die Hauptkonfiguration [vom Release herunterladen](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) oder [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) direkt aus dem Repository verwenden.

| Bedarf | Einstieg |
| :--- | :--- |
| Tägliche Hauptkonfiguration | Fester Release-Link / Repository-Vorlage |
| Persönliche Konfiguration visuell erzeugen | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| Vollständige Dokumentation | [Schnellstart](QUICKSTART.de.md) |

## Lizenz und Feedback

**All Rights Reserved · Vorherige schriftliche Genehmigung erforderlich.** Verwendung, Betrieb, Änderung, Weiterverbreitung, öffentliche Bereitstellung und kommerzielle Nutzung origineller Inhalte erfordern die vorherige schriftliche Genehmigung des Rechteinhabers; persönliche und nichtkommerzielle Nutzung ist eingeschlossen. Die vollständigen Bedingungen finden Sie in [LICENSE](../../LICENSE). Für Materialien Dritter gelten deren eigene Lizenzen.

Melden Sie Probleme oder beantragen Sie eine Genehmigung über [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues). Entfernen Sie dabei Abonnement-Tokens und Node-Zugangsdaten aus Ihrem Bericht.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · Konfigurationstool und Kernvorlage arbeiten zusammen.</sub></p>
