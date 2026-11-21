<div align="center">

<img src="../assets/favicon.png" width="88" alt="Yggdrasil app icon" />

# Yggdrasil

### Modular Mihomo configuration and subscription tools

Yggdrasil is the application and tooling around **Ratatoskr**, its core Mihomo configuration and shared builder template.

[中文指南](zh-CN.md)　·　[Open Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/)　·　[Back to project cover](../README.md)

</div>

---

## Contents

| Guide | Description |
| :--- | :--- |
| [Architecture](#architecture) | How Yggdrasil and Ratatoskr work together |
| [Configuration options](#configuration-options) | Geo rules, application routing, and node strategies |
| [Getting started](#getting-started) | Build a personal configuration |
| [Configuration files](#configuration-files) | Choose a template for your use case |
| [Development and deployment](#development-and-deployment) | Build commands and maintenance documentation |
| [Contributors](#contributors) | AI assistants involved in the project |
| [License](#license) | Usage terms and feedback |

## Architecture

**Yggdrasil is the application and tooling; Ratatoskr is its core configuration.** Yggdrasil provides the configuration builder, template parsing, YAML generation, and optional subscription service. Ratatoskr defines the routing rules, region catalog, node filters, and proxy groups.

The builder reads the same Ratatoskr template used as the configuration source. It combines a user's selected subscription nodes, regions, and application routes into a Mihomo YAML file. The template therefore keeps the builder catalog and generated configuration aligned.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

## Configuration options

- **Application routing:** Choose separate outbound groups for AI, messaging, social, streaming, gaming, and other services.
- **Geo classification:** GeoSite matches domain categories; GeoIP matches IP ranges. Additional domain, IP, or port rules can be added.
- **Node strategies:** Manual selection, URL-test selection, failover, consistent-hashing load balancing, and round-robin download balancing.
- **Region groups:** Filter subscription nodes into region-specific groups. Actual group membership depends on provider node names and the configured filters.
- **Compact configuration:** Ratatoskr keeps rules and strategy orchestration in YAML while Geo databases are loaded and updated separately by the client or core.

Rules are evaluated in order. Results depend on rule priority, Geo data, Mihomo version, and client support. Load balancing assigns new connections; it does not combine bandwidth for a single connection.

The main repository cover includes a visual preview of app, region, and strategy icons. Attribution and image sources are listed in [asset documentation](../assets/README.md) and the [macOSicons source list](../assets/icons/macosicons/README.md).

## Getting started

Open the **[Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/)**, import a subscription or node file, select regions and strategies, choose application routes, then review and download the generated YAML.

The builder accepts subscription YAML, Base64 content, and common node links. Subscription traffic information comes from the provider. Optional delay checks measure TCP connection setup time; they are not ICMP ping or full proxy latency measurements.

Without a deployed service, local node-file import, preview, and download remain available. Subscription fetching through a cross-origin proxy and persistent subscription links require the corresponding service to be deployed. See the [deployment guide](../config-builder/docs/DEPLOYMENT.md).

## Configuration files

The repository ships one main template: **[Ratatoskr](../resources/template/ratatoskr-template.yaml)**, a Geo-driven compact configuration with common region groups and general node strategies. Get it from the file link or the pinned [Release download](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml).

Network takeover features such as DNS, TUN, and sniffing are configured per client environment. The template targets Mihomo; make sure your client supports the fields and has the referenced Geo data.

## Development and deployment

The front end and shared template compiler are in `config-builder/`. Legacy `/merge` and `/sub` endpoints are in `scripts/endpoints/`. See the [implementation map](../config-builder/docs/IMPLEMENTATION.md) for code paths and the [deployment guide](../config-builder/docs/DEPLOYMENT.md) for Pages, Worker, and KV setup.

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

The local service is available at `http://localhost:8788/config-builder/`. To add an application or region to the builder, edit the static [catalog.json](../config-builder/shared/catalog.json), then rebuild and review the generated catalog.

## Contributors

The project is led and maintained by [yakasuka](https://github.com/yakasuka). The following collaborators contributed to configuration work, scripts, documentation, and automation:

| Contributor | Role |
| :--- | :--- |
| [yakasuka](https://github.com/yakasuka) | Project lead and maintenance |
| [Codex](https://github.com/codex) | Configuration organization and scripting |
| [Claude](https://github.com/claude) | Code and documentation collaboration |
| [Eaibee Kitajima](https://github.com/EaibeeKitajima) | Early rules and configuration contributions |
| [github-actions[bot]](https://github.com/apps/github-actions) | Automated rules and catalog sync |
| [dependabot[bot]](https://github.com/apps/dependabot) | Dependency updates |

GitHub's sidebar Contributors list is aggregated from commit authors and `Co-authored-by` co-authors. AI assistants and bots use the signature emails of their official accounts, so their avatars and profile links display correctly.

## License

**All Rights Reserved · Prior Written Permission Required**

Use, operation, modification, redistribution, public deployment, and commercial use of original project materials require prior written permission from the relevant rights holder. See the [LICENSE](../LICENSE) for the full terms and exceptions. Third-party materials remain subject to their own licenses.

Report issues or request permission through [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues). Remove subscription tokens and node credentials from reports.
