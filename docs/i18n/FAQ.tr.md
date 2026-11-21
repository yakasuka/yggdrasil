# SSS

<p align="center">
  <a href="README.tr.md">Giriş</a> ·
  <a href="QUICKSTART.tr.md">Hızlı başlangıç</a> ·
  <a href="CONTRIBUTING.tr.md">Katkıda bulunma</a> ·
  <a href="CONTRIBUTORS.tr.md">Katkıda bulunanlar</a> ·
  <a href="FAQ.tr.md">SSS</a>
</p>

---

## Yapılandırma bu kadar küçükken nasıl bu kadar çok hizmeti kapsıyor?

Ratatoskr Geo veri kategorilerine başvurur; somut alan adı ve IP verileri veritabanı tarafından taşınır. Yapılandırma yalnızca kategori referanslarını, eşleşme sırasını ve çıkış düzenlemesini tutar. Geo veritabanının yine de istemci tarafından yüklenmesi ve güncellenmesi gerekir.

## Tek bir YAML her istemcide kullanılabilir mi?

Yapılandırma Mihomo'yu hedefler. İstemcinin ilgili sözdizimini desteklemesi ve başvurulan Geo kategorilerini içermesi gerekir. DNS, TUN ve diğer ağ yakalama özellikleri seçilen şablona ve cihaz ortamına bağlıdır.

## Bakım, her seferinde yapılandırmanın tamamını yeniden yazmayı gerektirir mi?

Geo kategorileri, ek kural kaynakları, düğüm abonelikleri ve çıkış stratejileri ayrı ayrı sürdürülür. Verileri istemci mekanizmasıyla güncelleyin ve ilgili kuralları veya proxy gruplarını yalnızca gerektiğinde ayarlayın; kategori adları ve referansları geçerli kalmalıdır.

## Reklam engelleme kuralları nasıl güncellenir?

GitHub Actions resmi AdGuard upstream'ini her gün sorgular ve yalnızca içerik değiştiğinde kural dosyasını alıp günceller; bu, düşük kaynaklı tembel güncelleme yaklaşımını izler.

## Config Builder ile ana yapılandırma nasıl ilişkilidir?

Config Builder (Yggdrasil uygulaması), Ratatoskr şablonundaki uygulama, bölge ve strateji tanımlarını okur ve web üzerindeki seçimlerinize göre kişisel bir yapılandırma oluşturur. Biri düzenler ve üretir; diğeri gerçek yönlendirmeyi ve düğüm stratejilerini tanımlar.

## Kullanım ücretsiz mi? İzin gerekiyor mu?

Proje **All Rights Reserved** lisansını kullanır. Özgün materyallerin kullanımı, çalıştırılması, değiştirilmesi, yeniden dağıtımı, herkese açık dağıtımı ve ticari kullanımı hak sahibinden önceden yazılı izin gerektirir; kişisel ve ticari olmayan kullanım da kapsam dahilindedir. Tam koşullar için [LICENSE](../../LICENSE) dosyasına bakın. İzni [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues) üzerinden talep edin.
