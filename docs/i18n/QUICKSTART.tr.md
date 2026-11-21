<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Yggdrasil proje simgesi" />
</p>

<h1 align="center">Hızlı başlangıç</h1>

<p align="center">
  <a href="README.tr.md">Giriş</a> ·
  <a href="QUICKSTART.tr.md">Hızlı başlangıç</a> ·
  <a href="CONTRIBUTING.tr.md">Katkıda bulunma</a> ·
  <a href="CONTRIBUTORS.tr.md">Katkıda bulunanlar</a> ·
  <a href="FAQ.tr.md">SSS</a>
</p>

---

## Başlamadan önce

Proje **All Rights Reserved** lisansını kullanır. Projenin özgün materyallerini kullanmadan, çalıştırmadan, değiştirmeden, yeniden dağıtmadan, herkese açık dağıtmadan veya ticari olarak kullanmadan önce ilgili hak sahibinden yazılı izin alın. Ayrıntılar için [LICENSE](../../LICENSE) dosyasına bakın.

## Önerilen yöntem: Config Builder

[Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) sayfasını açın ve beş adımı izleyin:

1. **Abonelik kaynağı.** Hizmet sağlayıcı (airport) adını ve bir YAML, Base64 veya yaygın düğüm bağlantısı aboneliğini girin. Düğümler ve sağlayıcı tarafından bildirilen trafik bilgileri ayrıştırılır.
2. **Bölge düğümleri.** Yalnızca abonelikte gerçekten bulunan bölgeler gösterilir; hangi düğümlerin korunacağını seçin.
3. **Düğüm stratejileri.** İhtiyacınız olan otomatik stratejileri koruyun; varsayılan çıkış manuel seçimdir.
4. **Uygulama yönlendirme.** Tüm uygulamalar varsayılan olarak etkindir ve proxy üzerinden geçer. Gerektiğinde her uygulama için korunmuş bir bölge, Direct veya Reject atayın.
5. **Son onay.** Yapılandırmayı önizleyin, `name-ratatoskr.yaml` dosyasını indirin veya kalıcı bir abonelik bağlantısı oluşturun.

Abonelikler YAML, Base64 ve yaygın düğüm bağlantılarını kabul eder. Trafik verileri sağlayıcının `Subscription-Userinfo` alanından gelir. İsteğe bağlı gecikme kontrolü, TCP bağlantı kurma süresini ölçer — ICMP ping veya tam proxy gecikmesini değil.

## Manuel yöntem: şablonu doğrudan kullanma

1. [ratatoskr-template.yaml](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) dosyasını indirin.
2. Abonelik düğümleriyle kendi `proxy-providers` / `proxies` yapınızı yerel olarak koruyun.
3. İstemcinin başvurulan GeoSite / GeoIP verilerine sahip olduğundan emin olun.
4. Mihomo uyumlu bir istemciye aktarın, uygulama veya bölge başına bir çıkış seçin ve gecikme testlerini yeniden çalıştırın.

## Portlar

| Yapılandırma | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| Manuel şablon | `7890` | `7891` |
| Config Builder çıktısı | `7890` | `7890` |

Config Builder karma port (mixed port) kullanır ve özelleştirmeye izin verir. Kişisel abonelik URL'lerini, düğüm kimlik bilgilerini ve erişim token'larını yerel veya özel bir iş akışında tutun.

## Dağıtım

Config Builder ve abonelik hizmeti birlikte Cloudflare Pages üzerine dağıtılır. [Dağıtım kılavuzuna](../../config-builder/docs/DEPLOYMENT.md) ve [uygulama haritasına](../../config-builder/docs/IMPLEMENTATION.md) bakın.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · yapılandırma aracı ve çekirdek şablon.</sub></p>
