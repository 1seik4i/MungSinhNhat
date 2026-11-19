# Khung đặc tả hệ thống CMSN

Chính sách QR mới nhất: QR/link hết hạn sau đúng 72 giờ kể từ lúc tạo hoặc đổi mã, không cho chọn thời hạn hoặc để vô hạn. Xem/tải lại QR và cập nhật nội dung không gia hạn. Hết hạn phải đổi mã mới; mã cũ không sống lại. Quy định này thay thế các đề xuất thời hạn tùy chọn ở bản đặc tả trước. QR legacy không hạn hoặc còn hạn quá 3 ngày được giới hạn về 3 ngày từ lần chạy bản nâng cấp đầu tiên; mã đã hết hạn giữ nguyên.

Ngày lập: 19/11/2026. Phiên bản: 0.2 — bổ sung người nhận xem qua QR theo yêu cầu mới.

Đọc theo thứ tự:

1. [Hiện trạng và phạm vi](./01-scope.md).
2. [Business rules](./02-business-rules.md).
3. [Requirements và thiết kế khung](./03-requirements.md).
4. [Test cases và điều kiện nghiệm thu](./04-test-cases.md).
5. [Phân tích luồng tạo, chia sẻ QR và người nhận xem](./05-user-flows.md).
6. [Hiện trạng triển khai và cấu hình chạy thử](./06-implementation-status.md).
7. [Frontend chuẩn được lấy từ ZIP](./07-frontend-baseline.md).
8. [Cấu trúc React, router và hooks](./08-react-architecture.md).
9. [Landing page và giao diện tài khoản](./09-landing-and-auth.md).
10. [Góc kỷ niệm mới](./10-memories-editor.md).
11. [Trình chỉnh sửa thân thiện theo từng mục](./11-editor-usability.md).
12. [Bộ 100 quẻ hệ thống và sửa luồng thổi nến](./12-system-fortunes.md).
13. [Chạy Playwright, Swagger và tích hợp QR](./13-testing-and-qr.md).
14. [Giới tính người nhận và câu chữ trong thiệp](./14-recipient-gender.md).
15. [Gửi thiệp bằng liên kết và QR](./15-share-panel.md).

Các tài liệu 01–05 mô tả hệ thống đích. Hiện đã có mã nền tảng tài khoản/QR; xem tài liệu 06 để phân biệt phần đã triển khai và phần còn thiếu. Bộ test case nghiệp vụ đầy đủ chưa được thực thi; kiểm thử tự động hiện tại có 5 ca validation/file signature.

Yêu cầu đã xác định: có đăng ký/đăng nhập, CAPTCHA khi đăng ký, tùy chỉnh nội dung, tạo trang sinh nhật riêng, chỉ chủ sở hữu được chỉnh sửa; người nhận quét QR để xem không cần tài khoản; giữ nhạc mặc định. Quyền xem qua QR thay thế giả định chỉ chủ sở hữu được xem ở v0.1.

Các lựa chọn đề xuất cần chốt trước khi lập trình: một trang đang hoạt động/user ở MVP; email và mật khẩu kèm xác minh email; sinh trang bằng bản nội dung đã lưu trên cùng ứng dụng; “các thay đổi có sẵn” được hiểu là các mục tùy chỉnh đang có. QR chứa liên kết có mã chia sẻ: ai giữ QR/link đều xem được bản đã tạo, không được sửa. Mặc định link dùng nhiều lần, không hết hạn, có thể thu hồi/đổi mã. Chi tiết nằm trong tài liệu phạm vi và phân tích luồng.
