# Contribuire

<p align="center">
  <a href="README.it.md">Introduzione</a> ·
  <a href="QUICKSTART.it.md">Avvio rapido</a> ·
  <a href="CONTRIBUTING.it.md">Contribuire</a> ·
  <a href="CONTRIBUTORS.it.md">Collaboratori</a> ·
  <a href="FAQ.it.md">Domande frequenti</a>
</p>

---

## Modi per contribuire

Le Issues sono benvenute per segnalazioni di bug, richieste di autorizzazione e suggerimenti. Includi le versioni del client e del core, la configurazione in uso e il risultato di routing atteso — e rimuovi i token di sottoscrizione e le credenziali dei nodi.

## Comandi di sviluppo

Il front end del Config Builder e il compilatore condiviso dei template si trovano in `config-builder/`:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

Il servizio locale è disponibile all'indirizzo `http://localhost:8788/config-builder/`.

## Struttura del repository

| Percorso | Scopo |
| :--- | :--- |
| `resources/template/` | Template di configurazione principale |
| `resources/rules/` | Dati delle regole, raggruppati per fonte (adguard / aethersailor / download) |
| `config-builder/` | Front end del Config Builder, compilatore condiviso, servizio di sottoscrizione |
| `scripts/rules/` | Script per il recupero e la sincronizzazione delle regole (aggiornamenti pigri) |
| `scripts/endpoints/` | Endpoint legacy `/merge` e `/sub` |
| `docs/i18n/` | Documentazione wiki multilingue |

## Aggiungere un'applicazione o una regione

Modifica il catalogo statico in [catalog.json](../../config-builder/shared/catalog.json). Dopo una nuova build, il catalogo della pagina e il template del backend vengono aggiornati di conseguenza. Vedi la [mappa di implementazione](../../config-builder/docs/IMPLEMENTATION.md) per il flusso di dati completo.

## Aggiornamento delle regole

Gli script delle regole seguono il principio dell'aggiornamento pigro: le sonde condizionali ETag / Last-Modified recuperano il corpo solo quando il contenuto cambia. Due workflow di GitHub Actions gestiscono rispettivamente le regole desktop di AdGuard e la sincronizzazione delle regole Aethersailor. Vedi la [guida alla distribuzione](../../config-builder/docs/DEPLOYMENT.md).

## Documentazione

La documentazione multilingue si trova in `docs/i18n/`. Ogni lingua ha cinque capitoli: README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS e FAQ. Per aggiungere una lingua, copia un set completo e rinominalo con il codice della lingua:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

I codici lingua seguono BCP 47, ad es. `zh-CN`, `en`, `pt-BR`.
