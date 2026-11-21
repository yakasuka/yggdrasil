# Häufige Fragen

<p align="center">
  <a href="README.de.md">Einführung</a> ·
  <a href="QUICKSTART.de.md">Schnellstart</a> ·
  <a href="CONTRIBUTING.de.md">Mitwirken</a> ·
  <a href="CONTRIBUTORS.de.md">Mitwirkende</a> ·
  <a href="FAQ.de.md">Häufige Fragen</a>
</p>

---

## Warum ist die Konfiguration so klein und deckt dennoch viele Dienste ab?

Ratatoskr verweist auf Geo-Datenkategorien; die konkreten Domain- und IP-Daten liegen in der Datenbank. Die Konfiguration enthält nur Kategoriereferenzen, die Reihenfolge der Treffer und die Outbound-Orchestrierung. Die Geo-Datenbank muss weiterhin vom Client geladen und aktualisiert werden.

## Kann ein YAML in jedem Client verwendet werden?

Die Konfiguration zielt auf Mihomo ab. Der Client muss die entsprechende Syntax unterstützen und die referenzierten Geo-Kategorien enthalten. DNS, TUN und andere Netzwerk-Übernahmefunktionen hängen von der gewählten Vorlage und der Geräteumgebung ab.

## Muss bei der Wartung jedes Mal die gesamte Konfiguration neu geschrieben werden?

Geo-Datenkategorien, zusätzliche Regelquellen, Node-Abonnements und Outbound-Strategien werden getrennt gepflegt. Aktualisieren Sie Daten über den Client-Mechanismus und passen Sie die betreffenden Regeln oder Proxy-Gruppen nur bei Bedarf an; Kategorienamen und Referenzen müssen gültig bleiben.

## Wie werden Werbeblocking-Regeln aktualisiert?

GitHub Actions prüft täglich den offiziellen AdGuard-Upstream und ruft nur bei Inhaltsänderungen Aktualisierungen der Regeldatei ab – im Sinne eines ressourcenschonenden, faulen Update-Ansatzes.

## Wie hängen Config Builder und Hauptkonfiguration zusammen?

Der Config Builder (die Yggdrasil-Anwendung) liest die Anwendungs-, Regions- und Strategie-Definitionen aus der Ratatoskr-Vorlage und stellt aus Ihren Web-Auswahlen eine persönliche Konfiguration zusammen. Der eine organisiert und generiert, der andere definiert das eigentliche Routing und die Node-Strategien.

## Ist die Nutzung kostenlos? Ist eine Genehmigung erforderlich?

Das Projekt verwendet eine **All Rights Reserved**-Lizenz. Verwendung, Betrieb, Änderung, Weiterverbreitung, öffentliche Bereitstellung und kommerzielle Nutzung origineller Inhalte erfordern die vorherige schriftliche Genehmigung des Rechteinhabers; persönliche und nichtkommerzielle Nutzung ist eingeschlossen. Die vollständigen Bedingungen finden Sie in [LICENSE](../../LICENSE). Beantragen Sie eine Genehmigung über [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues).
