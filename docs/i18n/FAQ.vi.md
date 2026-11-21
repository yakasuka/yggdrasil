# Câu hỏi thường gặp

<p align="center">
  <a href="README.vi.md">Giới thiệu</a> ·
  <a href="QUICKSTART.vi.md">Bắt đầu nhanh</a> ·
  <a href="CONTRIBUTING.vi.md">Đóng góp</a> ·
  <a href="CONTRIBUTORS.vi.md">Người đóng góp</a> ·
  <a href="FAQ.vi.md">Câu hỏi thường gặp</a>
</p>

---

## Tại sao cấu hình lại nhỏ trong khi bao phủ nhiều dịch vụ?

Ratatoskr tham chiếu các danh mục dữ liệu Geo; dữ liệu tên miền và IP cụ thể do cơ sở dữ liệu đảm nhiệm. Cấu hình chỉ giữ các tham chiếu danh mục, thứ tự khớp và sắp xếp đầu ra. Cơ sở dữ liệu Geo vẫn cần được ứng dụng khách tải và cập nhật.

## Có thể dùng một YAML cho mọi ứng dụng khách không?

Cấu hình hướng đến Mihomo. Ứng dụng khách cần hỗ trợ cú pháp tương ứng và có các danh mục Geo được tham chiếu. Các tính năng như DNS, TUN và các cơ chế chiếm quyền mạng khác tùy thuộc vào mẫu đã chọn và môi trường thiết bị.

## Bảo trì có cần viết lại toàn bộ cấu hình mỗi lần không?

Danh mục Geo, nguồn quy tắc bổ sung, đăng ký nút và chiến lược đầu ra được bảo trì riêng biệt. Hãy cập nhật dữ liệu qua cơ chế của ứng dụng khách và chỉ điều chỉnh quy tắc hoặc nhóm proxy tương ứng khi cần; tên và tham chiếu danh mục phải luôn hợp lệ.

## Quy tắc chặn quảng cáo được cập nhật thế nào?

GitHub Actions kiểm tra nguồn AdGuard chính thức mỗi ngày và chỉ tải và cập nhật tệp quy tắc khi nội dung thay đổi, tuân theo cách tiếp cận cập nhật lười, tiêu thụ tài nguyên thấp.

## Config Builder và cấu hình chính liên quan thế nào với nhau?

Config Builder (ứng dụng Yggdrasil) đọc các định nghĩa ứng dụng, khu vực và chiến lược trong mẫu Ratatoskr, rồi lắp ráp cấu hình cá nhân dựa trên lựa chọn của bạn trên trang web. Một bên tổ chức và tạo ra; bên kia định nghĩa định tuyến và chiến lược nút thực tế.

## Sử dụng có miễn phí không? Có cần cấp phép không?

Dự án dùng giấy phép **All Rights Reserved**. Việc sử dụng, vận hành, sửa đổi, phân phối lại, triển khai công khai và sử dụng thương mại tài liệu gốc cần sự cho phép bằng văn bản trước từ chủ thể quyền; sử dụng cá nhân và phi thương mại cũng không ngoại lệ. Xem điều khoản đầy đủ tại [LICENSE](../../LICENSE) và yêu cầu cấp phép qua [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues).
