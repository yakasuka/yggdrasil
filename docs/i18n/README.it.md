<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Logo del progetto Yggdrasil" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Strumenti di configurazione e sottoscrizione per Mihomo · Basato sul template Ratatoskr
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="Core: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="Ultima release" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="Autorizzazione richiesta" /></a>
</p>

<p align="center">
  <a href="README.it.md">Introduzione</a> ·
  <a href="QUICKSTART.it.md">Avvio rapido</a> ·
  <a href="CONTRIBUTING.it.md">Contribuire</a> ·
  <a href="CONTRIBUTORS.it.md">Collaboratori</a> ·
  <a href="FAQ.it.md">Domande frequenti</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## Che cos'è

**Yggdrasil è l'applicazione e gli strumenti; Ratatoskr è la configurazione principale.** Yggdrasil fornisce il config builder, il parsing dei template, la generazione YAML e la distribuzione delle sottoscrizioni. Ratatoskr definisce le regole di routing, il catalogo delle regioni, i filtri dei nodi e i proxy group.

Il builder legge il catalogo e le regole dal template Ratatoskr e combina i nodi selezionati e le strategie outbound in un YAML personale. Il template funziona quindi sia come base di configurazione pronta all'uso sia come fonte di dati condivisa per il catalogo e il builder.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil organizza, genera e distribuisce; Ratatoskr è la configurazione che arriva all'utente.**

## Funzionalità principali

- **Blocco degli annunci di livello desktop.** Include la sottoscrizione alle regole desktop di AdGuard Windows con circa 316.000 domini bloccati, seguendo l'upstream ufficiale con aggiornamenti pigri al variare del contenuto.
- **Routing leggero basato su Geo.** GeoSite e GeoIP contengono i dati di classificazione; la configurazione principale è di circa 28 KB con intenti di routing chiari.
- **Cinque strategie outbound.** Selezione manuale, URL-test, failover, load balancing con consistent-hashing e bilanciamento del download round-robin.
- **Catalogo di applicazioni e regioni.** Proxy group per ChatGPT, Claude, Telegram, Spotify, Steam e altri; gruppi regionali per Hong Kong, Taiwan, Giappone, Corea, Singapore e USA, con icone dedicate.
- **Distribuzione automatizzata.** I corpi delle regole vengono recuperati solo quando il contenuto cambia — basso consumo di risorse e output deterministico. Le release forniscono un link di download fisso e un checksum SHA-256.

## Scegliere una configurazione

Scarica la configurazione principale da [Releases](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) oppure usa [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) nel repository.

| Esigenza | Punto di accesso |
| :--- | :--- |
| Configurazione principale quotidiana | Link fisso della release / template del repository |
| Generare una configurazione personale visivamente | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| Documentazione completa | [Avvio rapido](QUICKSTART.it.md) |

## Licenza e feedback

**All Rights Reserved · È richiesta un'autorizzazione scritta preventiva.** L'uso, l'esecuzione, la modifica, la ridistribuzione, la distribuzione pubblica e l'uso commerciale dei materiali originali richiedono l'autorizzazione scritta preventiva del titolare dei diritti; sono inclusi l'uso personale e non commerciale. Vedi [LICENSE](../../LICENSE). I materiali di terze parti restano soggetti alle rispettive licenze.

Segnala problemi o richiedi l'autorizzazione tramite [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues). Rimuovi i token di sottoscrizione e le credenziali dei nodi dalle segnalazioni.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · strumento di configurazione e template principale che lavorano insieme.</sub></p>
