# Berkontribusi

<p align="center">
  <a href="README.id.md">Pengantar</a> ·
  <a href="QUICKSTART.id.md">Mulai cepat</a> ·
  <a href="CONTRIBUTING.id.md">Berkontribusi</a> ·
  <a href="CONTRIBUTORS.id.md">Kontributor</a> ·
  <a href="FAQ.id.md">Pertanyaan umum</a>
</p>

---

## Cara berkontribusi

Issues dipersilakan untuk laporan bug, permintaan izin, dan saran. Sertakan versi klien dan core, konfigurasi yang digunakan, serta hasil routing yang diharapkan — dan hapus token langganan serta kredensial node.

## Perintah pengembangan

Front end Config Builder dan compiler templat bersama ada di `config-builder/`:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

Layanan lokal berjalan di `http://localhost:8788/config-builder/`.

## Struktur repositori

| Path | Tujuan |
| :--- | :--- |
| `resources/template/` | Templat konfigurasi inti |
| `resources/rules/` | Data aturan, dikelompokkan berdasarkan sumber (adguard / aethersailor / download) |
| `config-builder/` | Front end Config Builder, compiler bersama, layanan langganan |
| `scripts/rules/` | Skrip pengambilan dan sinkronisasi aturan (pembaruan malas) |
| `scripts/endpoints/` | Endpoint lama `/merge` dan `/sub` |
| `docs/i18n/` | Dokumentasi wiki multibahasa |

## Menambahkan aplikasi atau wilayah

Edit katalog statis di [catalog.json](../../config-builder/shared/catalog.json). Setelah build ulang, katalog halaman dan templat backend akan diperbarui sesuai kebutuhan. Lihat [peta implementasi](../../config-builder/docs/IMPLEMENTATION.md) untuk alur data lengkap.

## Pembaruan aturan

Skrip aturan mengikuti prinsip pembaruan malas: proba kondisional ETag / Last-Modified hanya mengambil isi saat konten berubah. Dua workflow GitHub Actions menangani aturan desktop AdGuard dan sinkronisasi aturan Aethersailor. Lihat [panduan deployment](../../config-builder/docs/DEPLOYMENT.md).

## Dokumentasi

Dokumen multibahasa ada di `docs/i18n/`. Setiap bahasa memiliki lima bab: README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS, dan FAQ. Untuk menambah bahasa, salin satu set lengkap dan ganti namanya dengan kode bahasa:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

Kode bahasa mengikuti BCP 47, misalnya `zh-CN`, `en`, `pt-BR`.
