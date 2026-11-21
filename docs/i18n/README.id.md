<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Logo proyek Yggdrasil" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Alat konfigurasi dan langganan Mihomo · Dibangun di sekitar templat Ratatoskr
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="Inti: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="Rilis terbaru" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="Izin diperlukan" /></a>
</p>

<p align="center">
  <a href="README.id.md">Pengantar</a> ·
  <a href="QUICKSTART.id.md">Mulai cepat</a> ·
  <a href="CONTRIBUTING.id.md">Berkontribusi</a> ·
  <a href="CONTRIBUTORS.id.md">Kontributor</a> ·
  <a href="FAQ.id.md">Pertanyaan umum</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## Apa itu Yggdrasil

**Yggdrasil adalah kumpulan aplikasi dan perangkat; Ratatoskr adalah konfigurasi intinya.** Yggdrasil menyediakan config builder, penguraian templat, pembuatan YAML, dan pengiriman langganan. Ratatoskr mendefinisikan aturan routing, katalog wilayah, filter node, dan proxy group.

Config builder membaca katalog dan aturan dari templat Ratatoskr, menggabungkan node yang dipilih dan strategi outbound menjadi sebuah YAML personal. Dengan demikian templat berfungsi baik sebagai dasar konfigurasi siap pakai maupun sebagai sumber data bersama bagi katalog dan builder.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil mengatur, membuat, dan mengirimkan; Ratatoskr adalah konfigurasi yang sampai ke pengguna.**

## Fitur utama

- **Pemblokiran iklan setara desktop.** Menyertakan langganan aturan desktop AdGuard Windows dengan sekitar 316.000 domain yang diblokir, mengikuti upstream resmi dengan pembaruan malas saat konten berubah.
- **Routing ringan berbasis Geo.** GeoSite dan GeoIP membawa data klasifikasi; konfigurasi utama berukuran sekitar 28 KB dengan maksud routing yang jelas.
- **Lima strategi outbound.** Seleksi manual, URL-test, failover, load balancing consistent-hashing, dan penyeimbangan unduhan round-robin.
- **Katalog aplikasi dan wilayah.** Proxy group untuk ChatGPT, Claude, Telegram, Spotify, Steam, dan lainnya; group wilayah untuk Hong Kong, Taiwan, Jepang, Korea, Singapura, dan AS, dengan ikon khusus.
- **Pengiriman otomatis.** Isi aturan hanya diambil saat konten berubah — penggunaan sumber daya rendah dan keluaran deterministik. Rilis menyediakan tautan unduhan tetap dan checksum SHA-256.

## Memilih konfigurasi

Unduh konfigurasi utama dari [Releases](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) atau gunakan [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) di repositori.

| Kebutuhan | Titik masuk |
| :--- | :--- |
| Konfigurasi utama sehari-hari | Tautan tetap rilis / templat repositori |
| Buat konfigurasi personal secara visual | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| Dokumentasi lengkap | [Mulai cepat](QUICKSTART.id.md) |

## Lisensi dan masukan

**All Rights Reserved · Izin tertulis diperlukan terlebih dahulu.** Penggunaan, pengoperasian, modifikasi, redistribusi, deployment publik, dan penggunaan komersial atas materi orisinal memerlukan izin tertulis terlebih dahulu dari pemegang hak; penggunaan pribadi dan non-komersial juga termasuk. Lihat [LICENSE](../../LICENSE). Materi pihak ketiga tetap tunduk pada lisensi masing-masing.

Laporkan masalah atau minta izin melalui [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues). Hapus token langganan dan kredensial node dari laporan Anda.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · alat konfigurasi dan templat inti bekerja bersama.</sub></p>
