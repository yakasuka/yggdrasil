# Đóng góp

<p align="center">
  <a href="README.vi.md">Giới thiệu</a> ·
  <a href="QUICKSTART.vi.md">Bắt đầu nhanh</a> ·
  <a href="CONTRIBUTING.vi.md">Đóng góp</a> ·
  <a href="CONTRIBUTORS.vi.md">Người đóng góp</a> ·
  <a href="FAQ.vi.md">Câu hỏi thường gặp</a>
</p>

---

## Cách đóng góp

Rất hoan nghênh việc dùng Issues để báo lỗi, yêu cầu cấp phép hoặc đưa ra gợi ý. Khi báo cáo sự cố, hãy kèm phiên bản ứng dụng khách và lõi, cấu hình đang dùng và kết quả định tuyến mong đợi — đồng thời xóa token đăng ký và thông tin xác thực nút.

## Lệnh phát triển

Giao diện Config Builder và trình biên dịch mẫu dùng chung nằm trong `config-builder/`:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

Dịch vụ cục bộ chạy tại `http://localhost:8788/config-builder/`.

## Cấu trúc kho mã nguồn

| Đường dẫn | Chức năng |
| :--- | :--- |
| `resources/template/` | Mẫu cấu hình lõi |
| `resources/rules/` | Dữ liệu quy tắc, nhóm theo nguồn (adguard / aethersailor / download) |
| `config-builder/` | Giao diện Config Builder, trình biên dịch dùng chung, dịch vụ đăng ký |
| `scripts/rules/` | Tập lệnh tải và đồng bộ quy tắc (cập nhật lười) |
| `scripts/endpoints/` | Điểm cuối cũ `/merge` và `/sub` |
| `docs/i18n/` | Tài liệu wiki đa ngôn ngữ |

## Thêm ứng dụng hoặc khu vực

Chỉnh sửa danh mục tĩnh tại [catalog.json](../../config-builder/shared/catalog.json). Sau khi xây dựng lại, danh mục trên trang và mẫu phía máy chủ sẽ được cập nhật tương ứng. Xem [sơ đồ triển khai](../../config-builder/docs/IMPLEMENTATION.md) để biết luồng dữ liệu đầy đủ.

## Cập nhật quy tắc

Các tập lệnh quy tắc tuân theo nguyên tắc cập nhật lười: các truy vấn điều kiện ETag / Last-Modified chỉ tải nội dung khi có thay đổi. Hai quy trình GitHub Actions xử lý riêng quy tắc máy tính để bàn AdGuard và đồng bộ quy tắc Aethersailor. Xem [hướng dẫn triển khai](../../config-builder/docs/DEPLOYMENT.md).

## Tài liệu

Tài liệu đa ngôn ngữ nằm trong `docs/i18n/`. Mỗi ngôn ngữ có năm chương: README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS và FAQ. Để thêm một ngôn ngữ mới, hãy sao chép một bộ đầy đủ và đổi tên theo mã ngôn ngữ như sau:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

Mã ngôn ngữ tuân theo chuẩn BCP 47, ví dụ `zh-CN`, `en`, `pt-BR`.
