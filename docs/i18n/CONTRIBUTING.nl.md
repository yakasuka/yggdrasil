# Bijdragen

<p align="center">
  <a href="README.nl.md">Introductie</a> ·
  <a href="QUICKSTART.nl.md">Snel starten</a> ·
  <a href="CONTRIBUTING.nl.md">Bijdragen</a> ·
  <a href="CONTRIBUTORS.nl.md">Bijdragers</a> ·
  <a href="FAQ.nl.md">Veelgestelde vragen</a>
</p>

---

## Manieren om bij te dragen

Issues zijn welkom voor bugmeldingen, verzoeken om toestemming en suggesties. Vermeld uw client- en kernversie, de gebruikte configuratie en het verwachte routeringsresultaat — en verwijder abonnementstokens en node-credentials.

## Ontwikkelopdrachten

De front end van de Config Builder en de gedeelde sjablooncompiler staan in `config-builder/`:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

De lokale service draait op `http://localhost:8788/config-builder/`.

## Repositorystructuur

| Pad | Doel |
| :--- | :--- |
| `resources/template/` | Kernconfiguratiesjabloon |
| `resources/rules/` | Regelgegevens, gegroepeerd per bron (adguard / aethersailor / download) |
| `config-builder/` | Config Builder front end, gedeelde compiler, abonnementsservice |
| `scripts/rules/` | Scripts voor ophalen en synchroniseren van regels (lui updates) |
| `scripts/endpoints/` | Verouderde `/merge`- en `/sub`-endpoints |
| `docs/i18n/` | Meertalige wiki-documentatie |

## Een applicatie of regio toevoegen

Bewerk de statische catalogus in [catalog.json](../../config-builder/shared/catalog.json). Na een nieuwe build worden de paginacatalogus en het backendsjabloon dienovereenkomstig bijgewerkt. Zie het [implementatieoverzicht](../../config-builder/docs/IMPLEMENTATION.md) voor de volledige gegevensstroom.

## Regelupdates

De regelscripts volgen het beginsel van lui bijwerken: ETag / Last-Modified-voorwaardelijke peilingen halen de inhoud alleen op als deze is gewijzigd. Twee GitHub Actions-workflows verzorgen respectievelijk de AdGuard-desktopregels en de Aethersailor-regelsynchronisatie. Zie de [implementatiehandleiding](../../config-builder/docs/DEPLOYMENT.md).

## Documentatie

Meertalige documentatie staat in `docs/i18n/`. Elke taal heeft vijf hoofdstukken: README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS en FAQ. Om een taal toe te voegen, kopieert u een volledige set en hernoemt u deze met de taalcode:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

Taalcodes volgen BCP 47, bijv. `zh-CN`, `en`, `pt-BR`.
