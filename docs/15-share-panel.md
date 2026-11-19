# Gửi thiệp bằng liên kết và QR

Màn hình `/app/qr` dùng `SharePanel`, hiển thị hai cách gửi cùng một bản thiệp: sao chép liên kết hoặc tải ảnh QR. Trên màn hình nhỏ, hai khối xếp dọc.

- Chưa chia sẻ: chỉ hiển thị khung hướng dẫn và nút tạo thiệp/QR.
- Đang có hiệu lực: hiển thị liên kết chỉ đọc, sao chép, mở thử thiệp và tải PNG. Nút chia sẻ mở bảng chia sẻ của thiết bị nếu trình duyệt có Web Share API.
- Hết hạn: ẩn liên kết và ảnh QR cũ; mời tạo mã mới với thời hạn 72 giờ.
- Có thay đổi chưa xuất bản: nhắc cập nhật bản chia sẻ.
- Đổi mã và ngừng chia sẻ nằm trong mục tùy chọn, có xác nhận trước khi thực hiện.

Link được sao chép nguyên vẹn, bao gồm `#key=...` để người nhận mở được thiệp. QR và link dùng chung cơ chế truy cập, thời hạn và thu hồi. Người nhận không cần đăng nhập, chỉ chủ tài khoản được chỉnh sửa. Không thay đổi API hoặc gia hạn khi sao chép/tải lại.

Kiểm chứng: `npm test` kiểm tra sao chép, Web Share và trạng thái hết hạn. `npm run test:e2e` kiểm tra giao diện Chrome ở kích thước desktop/mobile, tạo PNG, sao chép đầy đủ link. `public-sharing.spec.js` dùng API/database thật, xác minh người nhận mở link bằng browser context mới không có tài khoản, xem ảnh, tải lại, bị chặn sửa; mã sai/hết hạn bị chặn. Các ca Swagger/catalogue, chặn khách và CSRF cũng dùng API thật. Chưa kiểm tra camera quét QR hay bảng chia sẻ của thiết bị thật.
