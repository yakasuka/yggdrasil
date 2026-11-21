# Pertanyaan Umum

<p align="center">
  <a href="README.id.md">Pengantar</a> ·
  <a href="QUICKSTART.id.md">Mulai cepat</a> ·
  <a href="CONTRIBUTING.id.md">Berkontribusi</a> ·
  <a href="CONTRIBUTORS.id.md">Kontributor</a> ·
  <a href="FAQ.id.md">Pertanyaan umum</a>
</p>

---

## Mengapa konfigurasinya sangat kecil tetapi mencakup banyak layanan?

Ratatoskr mereferensikan kategori data Geo; data domain dan IP konkret dibawa oleh database. Konfigurasi hanya menyimpan referensi kategori, urutan pencocokan, dan orkestrasi outbound. Database Geo tetap harus dimuat dan diperbarui oleh klien.

## Bisakah satu YAML digunakan di semua klien?

Konfigurasi ini ditujukan untuk Mihomo. Klien harus mendukung sintaks yang relevan dan menyertakan kategori Geo yang direferensikan. Fitur DNS, TUN, dan fitur penangkapan jaringan lainnya bergantung pada templat yang dipilih dan lingkungan perangkat.

## Apakah pemeliharaan memerlukan penulisan ulang seluruh konfigurasi setiap kali?

Kategori Geo, sumber aturan tambahan, langganan node, dan strategi outbound dikelola secara terpisah. Perbarui data melalui mekanisme klien dan sesuaikan aturan atau proxy group yang relevan hanya saat diperlukan; nama kategori dan referensi harus tetap valid.

## Bagaimana aturan pemblokiran iklan diperbarui?

GitHub Actions memeriksa upstream resmi AdGuard setiap hari dan hanya mengambil pembaruan saat konten berubah, mengikuti pendekatan pembaruan malas yang hemat sumber daya.

## Apa hubungan antara Config Builder dan konfigurasi utama?

Config Builder (aplikasi Yggdrasil) membaca definisi aplikasi, wilayah, dan strategi dalam templat Ratatoskr dan merakit konfigurasi personal dari pilihan Anda di halaman web. Yang satu mengatur dan membuat; yang lain mendefinisikan routing dan strategi node yang sebenarnya.

## Apakah penggunaannya gratis? Apakah diperlukan izin?

Proyek ini menggunakan lisensi **All Rights Reserved**. Penggunaan, pengoperasian, modifikasi, redistribusi, deployment publik, dan penggunaan komersial atas materi orisinal memerlukan izin tertulis terlebih dahulu dari pemegang hak; penggunaan pribadi dan non-komersial juga termasuk. Lihat [LICENSE](../../LICENSE). Minta izin melalui [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues).
