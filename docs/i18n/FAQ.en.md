# FAQ

<p align="center">
  <a href="README.en.md">Introduction</a> ·
  <a href="QUICKSTART.en.md">Quick start</a> ·
  <a href="CONTRIBUTING.en.md">Contributing</a> ·
  <a href="CONTRIBUTORS.en.md">Contributors</a> ·
  <a href="FAQ.en.md">FAQ</a>
</p>

---

## Why is the configuration so small while covering many services?

Ratatoskr references Geo data categories; the concrete domain and IP data is carried by the database. The configuration keeps only category references, match order, and outbound orchestration. The Geo database must still be loaded and updated by the client.

## Can one YAML be used in every client?

The configuration targets Mihomo. The client must support the relevant syntax and include the referenced Geo categories. DNS, TUN, and other network-capture features depend on the chosen template and device environment.

## Does maintenance require rewriting the whole configuration every time?

Geo categories, supplemental rule sources, node subscriptions, and outbound strategies are maintained separately. Update data through the client mechanism and adjust the relevant rules or proxy groups only when needed; category names and references must stay valid.

## How are ad-blocking rules updated?

GitHub Actions probes the official AdGuard upstream daily and fetches updates only when content changes, following a low-resource lazy-update approach.

## How do the Config Builder and main configuration relate?

The Config Builder (the Yggdrasil application) reads the application, region, and strategy definitions in the Ratatoskr template and assembles a personal configuration from your web selections. One organizes and generates; the other defines the actual routing and node strategies.

## Is it free to use? Is permission required?

The project uses an **All Rights Reserved** license. Use, operation, modification, redistribution, public deployment, and commercial use of original materials require prior written permission from the rights holder; personal and non-commercial use is included. See [LICENSE](../../LICENSE). Request permission through [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues).
