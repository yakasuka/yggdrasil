<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Biểu trưng dự án Yggdrasil" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Công cụ cấu hình và đăng ký Mihomo · Xây dựng dựa trên mẫu Ratatoskr
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="Lõi: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="Bản phát hành mới nhất" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="Yêu cầu cấp phép" /></a>
</p>

<p align="center">
  <a href="README.vi.md">Giới thiệu</a> ·
  <a href="QUICKSTART.vi.md">Bắt đầu nhanh</a> ·
  <a href="CONTRIBUTING.vi.md">Đóng góp</a> ·
  <a href="CONTRIBUTORS.vi.md">Người đóng góp</a> ·
  <a href="FAQ.vi.md">Câu hỏi thường gặp</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## Yggdrasil là gì?

**Yggdrasil là tập hợp ứng dụng và công cụ; Ratatoskr là cấu hình lõi của nó.** Yggdrasil cung cấp Config Builder, phân tích mẫu, tạo YAML và phân phối đăng ký. Ratatoskr định nghĩa các quy tắc định tuyến, danh mục khu vực, bộ lọc nút và nhóm proxy.

Config Builder đọc danh mục và quy tắc từ mẫu Ratatoskr, kết hợp các nút và chiến lược đầu ra do người dùng chọn thành một YAML cá nhân. Nhờ đó, mẫu vừa là nền tảng cấu hình sẵn sàng sử dụng, vừa là nguồn dữ liệu chung cho danh mục và builder.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil tổ chức, tạo ra và phân phối; Ratatoskr là cấu hình đến tay người dùng.**

## Tính năng chính

- **Chặn quảng cáo cấp độ máy tính để bàn.** Bao gồm đăng ký quy tắc máy tính để bàn AdGuard Windows với khoảng 316.000 tên miền bị chặn, theo dõi nguồn chính thức và cập nhật lười (lazy) khi có thay đổi.
- **Định tuyến nhẹ dựa trên Geo.** GeoSite và GeoIP chứa dữ liệu phân loại; cấu hình chính chỉ khoảng 28 KB với ý định định tuyến rõ ràng, dễ đọc.
- **Năm chiến lược đầu ra.** Lựa chọn thủ công, URL-test, failover, cân bằng tải consistent-hashing và cân bằng tải tải xuống round-robin.
- **Danh mục ứng dụng và khu vực.** Nhóm proxy cho ChatGPT, Claude, Telegram, Spotify, Steam và nhiều hơn nữa; nhóm khu vực cho Hồng Kông, Đài Loan, Nhật Bản, Hàn Quốc, Singapore và Hoa Kỳ, kèm biểu tượng riêng.
- **Phân phối tự động.** Nội dung quy tắc chỉ được tải khi có thay đổi — tài nguyên thấp và đầu ra xác định. Các bản phát hành cung cấp liên kết tải xuống cố định và tổng kiểm SHA-256.

## Chọn một cấu hình

Tải cấu hình chính từ [Releases](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) hoặc dùng [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) trong kho mã nguồn.

| Nhu cầu | Điểm vào |
| :--- | :--- |
| Cấu hình chính hàng ngày | Liên kết Release cố định / mẫu trong kho |
| Tạo cấu hình cá nhân trực quan | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| Tài liệu đầy đủ | [Bắt đầu nhanh](QUICKSTART.vi.md) |

## Giấy phép và phản hồi

**All Rights Reserved · Cần sự cho phép bằng văn bản trước.** Việc sử dụng, vận hành, sửa đổi, phân phối lại, triển khai công khai và sử dụng thương mại các tài liệu gốc đều cần sự cho phép bằng văn bản trước từ chủ thể quyền; sử dụng cá nhân và phi thương mại cũng không ngoại lệ. Xem điều khoản đầy đủ tại [LICENSE](../../LICENSE). Tài liệu của bên thứ ba tuân theo giấy phép riêng của chúng.

Báo cáo sự cố hoặc yêu cầu cấp phép qua [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues). Vui lòng xóa token đăng ký và thông tin xác thực nút khỏi báo cáo.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · công cụ cấu hình và mẫu lõi hoạt động cùng nhau.</sub></p>
