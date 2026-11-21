# Katkıda bulunma

<p align="center">
  <a href="README.tr.md">Giriş</a> ·
  <a href="QUICKSTART.tr.md">Hızlı başlangıç</a> ·
  <a href="CONTRIBUTING.tr.md">Katkıda bulunma</a> ·
  <a href="CONTRIBUTORS.tr.md">Katkıda bulunanlar</a> ·
  <a href="FAQ.tr.md">SSS</a>
</p>

---

## Katkı yolları

Hata bildirimi, izin talebi veya öneri için Issues sayfasını kullanmanız memnuniyet vericidir. Bir sorun bildirirken istemci ve çekirdek sürümlerinizi, kullanılan yapılandırmayı ve beklenen yönlendirme sonucunu ekleyin — ayrıca abonelik token'larını ve düğüm kimlik bilgilerini kaldırın.

## Geliştirme komutları

Config Builder arayüzü ve paylaşılan şablon derleyicisi `config-builder/` dizinindedir:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

Yerel hizmet `http://localhost:8788/config-builder/` adresinde çalışır.

## Depo yapısı

| Yol | Amaç |
| :--- | :--- |
| `resources/template/` | Çekirdek yapılandırma şablonu |
| `resources/rules/` | Kaynağa göre gruplanmış kural verileri (adguard / aethersailor / download) |
| `config-builder/` | Config Builder arayüzü, paylaşılan derleyici, abonelik hizmeti |
| `scripts/rules/` | Kural alma ve senkronizasyon betikleri (tembel güncelleme) |
| `scripts/endpoints/` | Eski `/merge` ve `/sub` uç noktaları |
| `docs/i18n/` | Çok dilli wiki belgeleri |

## Uygulama veya bölge ekleme

Statik kataloğu [catalog.json](../../config-builder/shared/catalog.json) dosyasında düzenleyin. Yeniden derlemeden sonra sayfa kataloğu ve arka uç şablonu buna göre güncellenir. Tam veri akışı için [uygulama haritasına](../../config-builder/docs/IMPLEMENTATION.md) bakın.

## Kural güncellemeleri

Kural betikleri tembel güncelleme ilkesini izler: ETag / Last-Modified koşullu sorguları yalnızca içerik değiştiğinde gövdeyi alır. İki GitHub Actions iş akışı sırasıyla AdGuard masaüstü kurallarını ve Aethersailor kural senkronizasyonunu yönetir. [Dağıtım kılavuzuna](../../config-builder/docs/DEPLOYMENT.md) bakın.

## Belgeler

Çok dilli belgeler `docs/i18n/` dizinindedir. Her dilde README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS ve FAQ olmak üzere beş bölüm bulunur. Yeni bir dil eklemek için eksiksiz bir seti kopyalayın ve aşağıdaki gibi dil koduyla yeniden adlandırın:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

Dil kodları BCP 47 standardını izler; örneğin `zh-CN`, `en`, `pt-BR`.
