<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Yggdrasil-Projektlogo" />
</p>

<h1 align="center">Schnellstart</h1>

<p align="center">
  <a href="README.de.md">Einführung</a> ·
  <a href="QUICKSTART.de.md">Schnellstart</a> ·
  <a href="CONTRIBUTING.de.md">Mitwirken</a> ·
  <a href="CONTRIBUTORS.de.md">Mitwirkende</a> ·
  <a href="FAQ.de.md">Häufige Fragen</a>
</p>

---

## Bevor Sie beginnen

Das Projekt verwendet eine **All Rights Reserved**-Lizenz. Holen Sie vor Verwendung, Betrieb, Änderung, Weiterverbreitung, öffentlicher Bereitstellung oder kommerzieller Nutzung origineller Projektinhalte die vorherige schriftliche Genehmigung des jeweiligen Rechteinhabers ein. Siehe [LICENSE](../../LICENSE).

## Empfohlen: Config Builder

Öffnen Sie den [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) und folgen Sie fünf Schritten:

1. **Abonnementquelle.** Geben Sie den Namen des Anbieters sowie ein YAML-, Base64- oder übliches Node-Link-Abonnement ein. Nodes und vom Anbieter gemeldete Traffic-Informationen werden analysiert.
2. **Regions-Nodes.** Es werden nur Regionen angezeigt, die im Abonnement tatsächlich vorhanden sind. Wählen Sie den zu behaltenden Node-Bereich.
3. **Node-Strategien.** Behalten Sie nur die benötigten automatischen Strategien. Der Standard-Outbound ist die manuelle Auswahl.
4. **App-Routing.** Alle Anwendungen sind standardmäßig aktiviert und werden über den Proxy geleitet. Weisen Sie bei Bedarf pro Anwendung eine beibehaltene Region, Direct oder Reject zu.
5. **Abschlussprüfung.** Sehen Sie die Konfiguration in der Vorschau, laden Sie `name-ratatoskr.yaml` herunter oder erzeugen Sie einen dauerhaften Abonnement-Link.

Abonnements akzeptieren YAML, Base64 und übliche Node-Links. Traffic-Daten stammen aus `Subscription-Userinfo` des Anbieters. Optionale Verzögerungsprüfungen messen die TCP-Verbindungsaufbauzeit vom Messserver zum Node – nicht ICMP-Ping oder vollständige Proxy-Latenz.

## Manuell: Vorlage direkt verwenden

1. Laden Sie [ratatoskr-template.yaml](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) herunter.
2. Pflegen Sie Ihre eigenen `proxy-providers` / `proxies` mit den Abonnement-Nodes.
3. Stellen Sie sicher, dass der Client die referenzierten GeoSite / GeoIP-Daten besitzt.
4. Importieren Sie in einen Mihomo-kompatiblen Client, wählen Sie pro Anwendung oder Region einen Outbound und führen Sie die Verzögerungstests erneut aus.

## Ports

| Konfiguration | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| Manuelle Vorlage | `7890` | `7891` |
| Ausgabe des Config Builders | `7890` | `7890` |

Der Config Builder verwendet einen gemischten Port und erlaubt Anpassungen. Bewahren Sie persönliche Abonnement-URLs, Node-Zugangsdaten und Zugriffstokens in einem lokalen oder privaten Workflow auf.

## Bereitstellung

Der Config Builder und der Abonnement-Dienst werden gemeinsam auf Cloudflare Pages bereitgestellt. Siehe [Bereitstellungsanleitung](../../config-builder/docs/DEPLOYMENT.md) und [Implementierungsübersicht](../../config-builder/docs/IMPLEMENTATION.md).

---

<p align="center"><sub>Yggdrasil × Ratatoskr · Konfigurationstool und Kernvorlage arbeiten zusammen.</sub></p>
