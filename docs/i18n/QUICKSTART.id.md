<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Logo proyek Yggdrasil" />
</p>

<h1 align="center">Mulai Cepat</h1>

<p align="center">
  <a href="README.id.md">Pengantar</a> ·
  <a href="QUICKSTART.id.md">Mulai cepat</a> ·
  <a href="CONTRIBUTING.id.md">Berkontribusi</a> ·
  <a href="CONTRIBUTORS.id.md">Kontributor</a> ·
  <a href="FAQ.id.md">Pertanyaan umum</a>
</p>

---

## Sebelum memulai

Proyek ini menggunakan lisensi **All Rights Reserved**. Dapatkan izin tertulis terlebih dahulu dari pemegang hak terkait sebelum menggunakan, menjalankan, memodifikasi, mendistribusikan ulang, menyebarkan secara publik, atau menggunakan secara komersial materi orisinal proyek. Lihat [LICENSE](../../LICENSE).

## Direkomendasikan: Config Builder

Buka [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) dan ikuti lima langkah:

1. **Sumber langganan.** Masukkan nama airport dan langganan YAML, Base64, atau tautan node umum. Node dan informasi lalu lintas yang dilaporkan provider akan diurai.
2. **Node wilayah.** Hanya wilayah yang benar-benar ada dalam langganan yang ditampilkan; pilih node mana yang akan disimpan.
3. **Strategi node.** Simpan strategi otomatis yang Anda butuhkan; outbound default adalah seleksi manual.
4. **Routing aplikasi.** Semua aplikasi diaktifkan dan diproksikan secara default. Tetapkan wilayah yang disimpan, Direct, atau Reject per aplikasi sesuai kebutuhan.
5. **Konfirmasi akhir.** Pratinjau konfigurasi, unduh `name-ratatoskr.yaml`, atau buat tautan langganan persisten.

Langganan menerima YAML, Base64, dan tautan node umum. Data lalu lintas berasal dari `Subscription-Userinfo` provider. Pemeriksaan delay opsional mengukur waktu pembentukan koneksi TCP — bukan ICMP ping atau latensi proxy penuh.

## Manual: menggunakan templat secara langsung

1. Unduh [ratatoskr-template.yaml](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml).
2. Kelola sendiri `proxy-providers` / `proxies` dengan node langganan.
3. Pastikan klien memiliki data GeoSite / GeoIP yang direferensikan.
4. Impor ke klien yang kompatibel dengan Mihomo, pilih outbound per aplikasi atau wilayah, dan jalankan kembali uji delay.

## Port

| Konfigurasi | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| Templat manual | `7890` | `7891` |
| Keluaran Config Builder | `7890` | `7890` |

Config Builder menggunakan port campuran dan mengizinkan penyesuaian. Simpan URL langganan pribadi, kredensial node, dan token akses dalam alur kerja lokal atau pribadi.

## Deployment

Config Builder dan layanan langganan di-deploy bersama di Cloudflare Pages. Lihat [panduan deployment](../../config-builder/docs/DEPLOYMENT.md) dan [peta implementasi](../../config-builder/docs/IMPLEMENTATION.md).

---

<p align="center"><sub>Yggdrasil × Ratatoskr · alat konfigurasi dan templat inti bekerja bersama.</sub></p>
