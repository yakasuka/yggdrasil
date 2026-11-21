# Mitwirken

<p align="center">
  <a href="README.de.md">Einführung</a> ·
  <a href="QUICKSTART.de.md">Schnellstart</a> ·
  <a href="CONTRIBUTING.de.md">Mitwirken</a> ·
  <a href="CONTRIBUTORS.de.md">Mitwirkende</a> ·
  <a href="FAQ.de.md">Häufige Fragen</a>
</p>

---

## Mögliche Beiträge

Issues sind willkommen für Fehlerberichte, Genehmigungsanfragen und Vorschläge. Geben Sie Client- und Kernversion, die verwendete Konfiguration und das erwartete Routing-Ergebnis an – und entfernen Sie Abonnement-Tokens und Node-Zugangsdaten.

## Entwicklungsbefehle

Das Frontend des Config Builders und der gemeinsame Template-Compiler befinden sich in `config-builder/`:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

Der lokale Dienst läuft unter `http://localhost:8788/config-builder/`.

## Repository-Struktur

| Pfad | Zweck |
| :--- | :--- |
| `resources/template/` | Kern-Konfigurationsvorlage |
| `resources/rules/` | Regeldaten, nach Quelle gruppiert (adguard / aethersailor / download) |
| `config-builder/` | Config-Builder-Frontend, gemeinsamer Compiler, Abonnement-Dienst |
| `scripts/rules/` | Skripte zum Abrufen und Synchronisieren von Regeln (faule Updates) |
| `scripts/endpoints/` | Alte `/merge`- und `/sub`-Endpunkte |
| `docs/i18n/` | Mehrsprachige Wiki-Dokumentation |

## Anwendung oder Region hinzufügen

Bearbeiten Sie den statischen Katalog [catalog.json](../../config-builder/shared/catalog.json). Nach einem Neubuild aktualisieren sich der Seitenkatalog und die Backend-Vorlage entsprechend. Den vollständigen Datenfluss finden Sie in der [Implementierungsübersicht](../../config-builder/docs/IMPLEMENTATION.md).

## Regel-Updates

Die Regel-Skripte folgen dem Prinzip der faulen Updates: ETag / Last-Modified-Bedingungsabfragen rufen den Inhalt nur bei Änderungen ab. Zwei GitHub-Actions-Workflows behandeln jeweils die AdGuard-Desktop-Regeln und die Synchronisierung der Aethersailor-Regeln. Siehe die [Bereitstellungsanleitung](../../config-builder/docs/DEPLOYMENT.md).

## Dokumentation

Die mehrsprachigen Dokumente liegen in `docs/i18n/`. Jede Sprache umfasst fünf Kapitel: README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS und FAQ. Um eine neue Sprache hinzuzufügen, kopieren Sie einen vollständigen Satz und benennen Sie die Dateien mit dem Sprachcode:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

Sprachcodes folgen BCP 47, z. B. `zh-CN`, `en`, `pt-BR`.
