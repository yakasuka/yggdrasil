<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Yggdrasil proje simgesi" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Mihomo yapılandırma ve abonelik araçları · Ratatoskr şablonu temel alınarak geliştirilmiştir
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="Çekirdek: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="Son sürüm" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="İzin gereklidir" /></a>
</p>

<p align="center">
  <a href="README.tr.md">Giriş</a> ·
  <a href="QUICKSTART.tr.md">Hızlı başlangıç</a> ·
  <a href="CONTRIBUTING.tr.md">Katkıda bulunma</a> ·
  <a href="CONTRIBUTORS.tr.md">Katkıda bulunanlar</a> ·
  <a href="FAQ.tr.md">SSS</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## Yggdrasil nedir?

**Yggdrasil uygulama ve araçlar bütünüdür; Ratatoskr ise onun çekirdek yapılandırmasıdır.** Yggdrasil; Config Builder, şablon ayrıştırma, YAML üretimi ve abonelik teslimini sağlar. Ratatoskr ise yönlendirme kurallarını, bölge kataloğunu, düğüm filtrelerini ve proxy gruplarını tanımlar.

Config Builder, Ratatoskr şablonundaki kataloğu ve kuralları okur; kullanıcının seçtiği düğümleri ve çıkış stratejilerini kişisel bir YAML içinde birleştirir. Böylece şablon hem doğrudan kullanılabilir bir yapılandırma temeli hem de katalog ve builder için ortak veri kaynağı işlevi görür.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil düzenler, üretir ve teslim eder; Ratatoskr kullanıcıya ulaşan yapılandırmadır.**

## Temel özellikler

- **Masaüstü düzeyinde reklam engelleme.** Yaklaşık 316.000 engellenen alan adı içeren AdGuard Windows masaüstü kural aboneliğini barındırır; resmi upstream'i izler ve yalnızca değişiklik olduğunda tembel (lazy) güncellemeyle alır.
- **Geo tabanlı hafif yönlendirme.** GeoSite ve GeoIP sınıflandırma verilerini taşır; ana yapılandırma yaklaşık 28 KB'tır ve yönlendirme amacı açık ve okunabilirdir.
- **Beş çıkış stratejisi.** Manuel seçim, URL-test, failover, tutarlı karma (consistent-hashing) yük dengeleme ve sıralı (round-robin) indirme dengeleme.
- **Uygulama ve bölge kataloğu.** ChatGPT, Claude, Telegram, Spotify, Steam ve daha fazlası için proxy grupları; Hong Kong, Tayvan, Japonya, Kore, Singapur ve ABD için bölge grupları, özel simgelerle birlikte.
- **Otomatik teslimat.** Kural gövdeleri yalnızca içerik değiştiğinde alınır — düşük kaynak kullanımı ve deterministik çıktı. Sürümler sabit bir indirme bağlantısı ve SHA-256 sağlama toplamı sunar.

## Bir yapılandırma seçin

Ana yapılandırmayı [Releases](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) adresinden indirin veya depodaki [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) dosyasını kullanın.

| İhtiyaç | Giriş noktası |
| :--- | :--- |
| Günlük ana yapılandırma | Sabit Release bağlantısı / depo şablonu |
| Kişisel yapılandırmayı görsel olarak üretme | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| Tam belgeler | [Hızlı başlangıç](QUICKSTART.tr.md) |

## Lisans ve geri bildirim

**All Rights Reserved · Önceden yazılı izin gereklidir.** Özgün içeriklerin kullanımı, çalıştırılması, değiştirilmesi, yeniden dağıtımı, herkese açık dağıtımı ve ticari kullanımı hak sahibinden önceden yazılı izin alınmasını gerektirir; kişisel ve ticari olmayan kullanım da kapsam dahilindedir. Tam koşullar için [LICENSE](../../LICENSE) dosyasına bakın. Üçüncü taraf materyaller kendi lisanslarına tabidir.

Sorunları bildirmek veya izin talep etmek için [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues) sayfasını kullanın. Raporlarda abonelik token'larını ve düğüm kimlik bilgilerini kaldırın.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · yapılandırma aracı ve çekirdek şablon birlikte çalışır.</sub></p>
