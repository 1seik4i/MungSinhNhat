# Landing page và giao diện tài khoản

- `/` là trang giới thiệu công khai, không gọi API hoặc tạo dữ liệu tài khoản. Lời giới thiệu ngắn về thiệp, ảnh/nhạc, vòng quay quà và chia sẻ QR 3 ngày; các CTA dẫn tới `/register` và `/login` bằng React Router.
- Landing tái sử dụng ảnh bánh kem/hộp quà của dự án, với nền kem, hồng phấn, phong thư và thẻ giấy; không thay theme/component của thiệp chuẩn ZIP.
- `/login`, `/register` dùng layout mới có minh họa và form tách riêng; responsive desktop/mobile, tab tài khoản, hiện/ẩn mật khẩu, thông báo lỗi, CAPTCHA bắt buộc khi đăng ký. Luồng email/reset giữ tương thích và chỉ hiện tùy chọn khi có cấu hình.
- Link xác minh/reset cũ trên `/#verify=...` hoặc `/#reset=...` vẫn mở form tương ứng thay vì landing.
- Đăng nhập thành công vẫn vào thẳng editor riêng; không thay đổi dữ liệu, quyền sở hữu hay thời hạn QR.

Kiểm thử DOM với API giả lập: CTA landing dẫn đúng URL; đăng ký bị chặn khi thiếu CAPTCHA và gửi đủ payload khi hoàn thành; nút hiện/ẩn không mất mật khẩu, lỗi đăng nhập hiển thị. Các kiểm thử luồng tạo thiệp/QR tiếp tục chạy. Chưa kiểm tra ảnh chụp trình duyệt thật trong đợt này.
