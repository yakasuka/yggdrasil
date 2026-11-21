<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Logo van het Yggdrasil-project" />
</p>

<h1 align="center">Snel starten</h1>

<p align="center">
  <a href="README.nl.md">Introductie</a> ·
  <a href="QUICKSTART.nl.md">Snel starten</a> ·
  <a href="CONTRIBUTING.nl.md">Bijdragen</a> ·
  <a href="CONTRIBUTORS.nl.md">Bijdragers</a> ·
  <a href="FAQ.nl.md">Veelgestelde vragen</a>
</p>

---

## Voordat u begint

Het project gebruikt een **All Rights Reserved**-licentie. Vraag vooraf schriftelijke toestemming aan de betreffende rechthebbende voordat u origineel projectmateriaal gebruikt, uitvoert, wijzigt, redistribueert, publiek implementeert of commercieel toepast. Zie [LICENSE](../../LICENSE).

## Aanbevolen: Config Builder

Open de [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) en volg vijf stappen:

1. **Abonnementsbron.** Voer de naam van de provider in en een YAML-, Base64- of gangbaar node-linkabonnement. Nodes en door de provider gerapporteerde verkeersinformatie worden geparseerd.
2. **Regio-nodes.** Alleen regio's die daadwerkelijk in het abonnement aanwezig zijn worden getoond; kies welke nodes u wilt behouden.
3. **Node-strategieën.** Behoud de automatische strategieën die u nodig heeft; de standaard outbound is handmatige selectie.
4. **Applicatierouting.** Alle applicaties zijn standaard ingeschakeld en worden via de proxy geleid. Wijs per applicatie desgewenst een behouden regio, Direct of Reject toe.
5. **Eindbevestiging.** Bekijk een voorbeeld van de configuratie, download `name-ratatoskr.yaml`, of genereer een permanente abonnementslink.

Abonnementen accepteren YAML, Base64 en gangbare node-links. Verkeersgegevens komen van de `Subscription-Userinfo` van de provider. Optionele vertragscontroles meten de tijd voor het tot stand brengen van een TCP-verbinding — geen ICMP ping of volledige proxy-latentie.

## Handmatig: het sjabloon direct gebruiken

1. Download [ratatoskr-template.yaml](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml).
2. Onderhoud uw eigen `proxy-providers` / `proxies` met abonnementsnodes.
3. Zorg ervoor dat de client de benodigde GeoSite / GeoIP-gegevens heeft.
4. Importeer in een Mihomo-compatibele client, kies per applicatie of regio een outbound en voer de vertragingscontroles opnieuw uit.

## Poorten

| Configuratie | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| Handmatig sjabloon | `7890` | `7891` |
| Uitvoer van Config Builder | `7890` | `7890` |

De Config Builder gebruikt een gemengde poort en staat aanpassing toe. Bewaar persoonlijke abonnements-URL's, node-credentials en toegangstokens in een lokale of private workflow.

## Implementatie

De Config Builder en abonnementsservice worden samen geïmplementeerd op Cloudflare Pages. Zie de [implementatiehandleiding](../../config-builder/docs/DEPLOYMENT.md) en het [implementatieoverzicht](../../config-builder/docs/IMPLEMENTATION.md).

---

<p align="center"><sub>Yggdrasil × Ratatoskr · configuratietool en kernsjabloon die samenwerken.</sub></p>
