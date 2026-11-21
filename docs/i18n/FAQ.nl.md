# Veelgestelde vragen

<p align="center">
  <a href="README.nl.md">Introductie</a> ·
  <a href="QUICKSTART.nl.md">Snel starten</a> ·
  <a href="CONTRIBUTING.nl.md">Bijdragen</a> ·
  <a href="CONTRIBUTORS.nl.md">Bijdragers</a> ·
  <a href="FAQ.nl.md">Veelgestelde vragen</a>
</p>

---

## Waarom is de configuratie zo klein terwijl deze veel diensten dekt?

Ratatoskr verwijst naar Geo-datacategorieën; de concrete domein- en IP-gegevens zitten in de database. De configuratie bewaart alleen categorie-verwijzingen, matchvolgorde en outbound-orkestratie. De Geo-database moet nog steeds door de client worden geladen en bijgewerkt.

## Kan één YAML in elke client worden gebruikt?

De configuratie is gericht op Mihomo. De client moet de betreffende syntaxis ondersteunen en de gebruikte Geo-categorieën bevatten. DNS, TUN en andere netwerkovernamefuncties hangen af van het gekozen sjabloon en de apparaatomgeving.

## Moet bij onderhoud telkens de hele configuratie worden herschreven?

Geo-categorieën, aanvullende regelbronnen, node-abonnementen en outbound-strategieën worden afzonderlijk onderhouden. Werk gegevens bij via het clientmechanisme en pas alleen waar nodig de betreffende regels of proxygroepen aan; categorienamen en verwijzingen moeten geldig blijven.

## Hoe worden advertentieblokkeringsregels bijgewerkt?

GitHub Actions controleert dagelijks de officiële AdGuard-upstream en haalt alleen bij wijzigingen updates op, volgens een zuinig lui-updatebeginsel.

## Hoe verhouden de Config Builder en de hoofdconfiguratie zich tot elkaar?

De Config Builder (de Yggdrasil-applicatie) leest de applicatie-, regio- en strategiedefinities in het Ratatoskr-sjabloon en stelt op basis van uw keuzes in de browser een persoonlijke configuratie samen. De ene organiseert en genereert; de andere definieert de werkelijke routing en node-strategieën.

## Is gebruik gratis? Is toestemming nodig?

Het project gebruikt een **All Rights Reserved**-licentie. Gebruik, uitvoering, wijziging, redistributie, publieke implementatie en commerciële toepassing van origineel materiaal vereisen voorafgaande schriftelijke toestemming van de rechthebbende; persoonlijk en niet-commercieel gebruik is inbegrepen. Zie [LICENSE](../../LICENSE). Vraag toestemming aan via [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues).
