<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Yggdrasil" />
</p>

<h1 align="center">Quick Start</h1>

<p align="center">
  <a href="README.en.md">Introduction</a> ·
  <a href="QUICKSTART.en.md">Quick start</a> ·
  <a href="CONTRIBUTING.en.md">Contributing</a> ·
  <a href="CONTRIBUTORS.en.md">Contributors</a> ·
  <a href="FAQ.en.md">FAQ</a>
</p>

---

## Before you start

The project uses an **All Rights Reserved** license. Obtain prior written permission from the relevant rights holder before using, running, modifying, redistributing, publicly deploying, or commercially using original project materials. See [LICENSE](../../LICENSE).

## Recommended: Config Builder

Open the [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) and follow five steps:

1. **Subscription source.** Enter the airport name and a YAML, Base64, or common node-link subscription. Nodes and provider-reported traffic information are parsed.
2. **Region nodes.** Only regions actually present in the subscription are shown; choose which nodes to keep.
3. **Node strategies.** Keep the automatic strategies you need; the default outbound is manual selection.
4. **Application routing.** All applications are enabled and proxied by default. Assign a kept region, Direct, or Reject per application as needed.
5. **Final confirmation.** Preview the config, download `name-ratatoskr.yaml`, or generate a persistent subscription link.

Subscriptions accept YAML, Base64, and common node links. Traffic data comes from the provider's `Subscription-Userinfo`. Optional delay checks measure TCP connection setup time — not ICMP ping or full proxy latency.

## Manual: use the template directly

1. Download [ratatoskr-template.yaml](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml).
2. Maintain your own `proxy-providers` / `proxies` with subscription nodes.
3. Ensure the client has the referenced GeoSite / GeoIP data.
4. Import into a Mihomo-compatible client, select an outbound per application or region, and re-run delay tests.

## Ports

| Configuration | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| Manual template | `7890` | `7891` |
| Config Builder output | `7890` | `7890` |

The Config Builder uses a mixed port and allows customization. Keep personal subscription URLs, node credentials, and access tokens in a local or private workflow.

## Deployment

The Config Builder and subscription service deploy together on Cloudflare Pages. See the [deployment guide](../../config-builder/docs/DEPLOYMENT.md) and the [implementation map](../../config-builder/docs/IMPLEMENTATION.md).

---

<p align="center"><sub>Yggdrasil × Ratatoskr · configuration tool and core template.</sub></p>
