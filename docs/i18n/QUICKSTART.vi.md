<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Biểu trưng dự án Yggdrasil" />
</p>

<h1 align="center">Bắt đầu nhanh</h1>

<p align="center">
  <a href="README.vi.md">Giới thiệu</a> ·
  <a href="QUICKSTART.vi.md">Bắt đầu nhanh</a> ·
  <a href="CONTRIBUTING.vi.md">Đóng góp</a> ·
  <a href="CONTRIBUTORS.vi.md">Người đóng góp</a> ·
  <a href="FAQ.vi.md">Câu hỏi thường gặp</a>
</p>

---

## Trước khi bắt đầu

Dự án sử dụng giấy phép **All Rights Reserved**. Hãy xin sự cho phép bằng văn bản trước từ chủ thể quyền liên quan trước khi sử dụng, vận hành, sửa đổi, phân phối lại, triển khai công khai hoặc sử dụng thương mại tài liệu gốc của dự án. Xem chi tiết tại [LICENSE](../../LICENSE).

## Cách được khuyến nghị: Config Builder

Mở [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) và thực hiện năm bước:

1. **Nguồn đăng ký.** Nhập tên nhà cung cấp (airport) và một đăng ký YAML, Base64 hoặc liên kết nút phổ biến. Các nút và thông tin lưu lượng do nhà cung cấp báo cáo sẽ được phân tích.
2. **Nút theo khu vực.** Chỉ các khu vực thực sự có trong đăng ký mới được hiển thị; chọn những nút cần giữ lại.
3. **Chiến lược nút.** Giữ lại các chiến lược tự động cần thiết; đầu ra mặc định là lựa chọn thủ công.
4. **Định tuyến ứng dụng.** Tất cả ứng dụng được bật và đi qua proxy theo mặc định. Khi cần, gán cho mỗi ứng dụng một khu vực đã giữ, Direct hoặc Reject.
5. **Xác nhận cuối.** Xem trước cấu hình, tải tệp `name-ratatoskr.yaml` hoặc tạo liên kết đăng ký cố định.

Đăng ký chấp nhận YAML, Base64 và liên kết nút phổ biến. Dữ liệu lưu lượng đến từ `Subscription-Userinfo` của nhà cung cấp. Kiểm tra độ trễ tùy chọn đo thời gian thiết lập kết nối TCP — không phải ICMP ping hay độ trễ proxy đầy đủ.

## Cách thủ công: dùng trực tiếp mẫu

1. Tải [ratatoskr-template.yaml](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml).
2. Tự duy trì `proxy-providers` / `proxies` của riêng bạn với các nút đăng ký.
3. Đảm bảo ứng dụng khách có dữ liệu GeoSite / GeoIP được tham chiếu.
4. Nhập vào ứng dụng khách tương thích Mihomo, chọn đầu ra cho từng ứng dụng hoặc khu vực và chạy lại kiểm tra độ trễ.

## Cổng

| Cấu hình | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| Mẫu thủ công | `7890` | `7891` |
| Đầu ra Config Builder | `7890` | `7890` |

Config Builder dùng cổng hỗn hợp (mixed port) và cho phép tùy chỉnh. Hãy giữ URL đăng ký cá nhân, thông tin xác thực nút và token truy cập trong quy trình cục bộ hoặc riêng tư.

## Triển khai

Config Builder và dịch vụ đăng ký được triển khai chung trên Cloudflare Pages. Xem [hướng dẫn triển khai](../../config-builder/docs/DEPLOYMENT.md) và [sơ đồ triển khai](../../config-builder/docs/IMPLEMENTATION.md).

---

<p align="center"><sub>Yggdrasil × Ratatoskr · công cụ cấu hình và mẫu lõi.</sub></p>
