# Contributing

<p align="center">
  <a href="README.en.md">Introduction</a> ·
  <a href="QUICKSTART.en.md">Quick start</a> ·
  <a href="CONTRIBUTING.en.md">Contributing</a> ·
  <a href="CONTRIBUTORS.en.md">Contributors</a> ·
  <a href="FAQ.en.md">FAQ</a>
</p>

---

## Ways to contribute

Issues are welcome for bug reports, permission requests, and suggestions. Include your client and core versions, the configuration in use, and the expected routing result — and remove subscription tokens and node credentials.

## Development commands

The Config Builder front end and shared template compiler are in `config-builder/`:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

The local service runs at `http://localhost:8788/config-builder/`.

## Repository structure

| Path | Purpose |
| :--- | :--- |
| `resources/template/` | Core configuration template |
| `resources/rules/` | Rule data grouped by source (adguard / aethersailor / download) |
| `config-builder/` | Config Builder front end, shared compiler, subscription service |
| `scripts/rules/` | Rule fetching and sync scripts (lazy updates) |
| `scripts/endpoints/` | Legacy `/merge` and `/sub` endpoints |
| `docs/i18n/` | Multilingual wiki documentation |

## Adding an application or region

Edit the static catalog at [catalog.json](../../config-builder/shared/catalog.json). After a rebuild, the page catalog and backend template update accordingly. See the [implementation map](../../config-builder/docs/IMPLEMENTATION.md) for the full data flow.

## Rule updates

Rule scripts follow a lazy-update principle: ETag / Last-Modified conditional probes fetch the body only when content changes. Two GitHub Actions workflows handle AdGuard desktop rules and Aethersailor rule sync respectively. See the [deployment guide](../../config-builder/docs/DEPLOYMENT.md).

## Documentation

Multilingual docs live in `docs/i18n/`. Each language has five chapters: README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS, and FAQ. To add a language, copy a full set and rename with the language code:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

Language codes follow BCP 47, e.g. `zh-CN`, `en`, `pt-BR`.
