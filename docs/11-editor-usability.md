# Trình chỉnh sửa theo từng mục

- Mở đầu bằng thông tin người nhận/lời chúc; 5 tab nội bộ gồm Thông tin thiệp, Ảnh kỷ niệm, Nhạc nền, Hộp quà và Gieo quẻ. Desktop có thanh bên, mobile có thanh mục cuộn ngang.
- Chỉ hiện một mục, vẫn giữ các component mounted để không mất nội dung khi chuyển mục. Các tab có nhãn, trạng thái chọn, hỗ trợ phím mũi tên/Home/End.
- Hướng dẫn những trường chính còn thiếu, nút Bổ sung đưa tới trường cần nhập; đếm ký tự, giới hạn độ dài, ngày sinh không ở tương lai và gợi ý lời chúc có xác nhận trước khi thay văn bản đang viết. Lưu nháp vẫn cho phép thiếu thông tin.
- Thanh lưu cố định hiển thị có thay đổi/đã lưu/đang xử lý; hỗ trợ Ctrl hoặc Cmd + S, nút Lưu và xem thiệp dùng guard của router để chờ lưu thành công. Shortcut không chạy khi editor đã ẩn ở bước preview/QR.
- Playlist mới: chọn file, mục URL mở rộng, sửa tên, đổi thứ tự bằng nút, gỡ và hoàn tác, khôi phục hai bài mặc định có xác nhận. Không tự ghi server sau từng thao tác; tất cả thay đổi lưu cùng bản nháp khi bấm lưu hoặc rời bước editor.
- Upload ảnh/nhạc khóa chuyển mục và lưu cho đến khi hoàn tất. Không thay đổi quyền sở hữu, snapshot hoặc thời hạn QR.

Kiểm thử: 29 ca backend/DOM pass, bao gồm đổi tab giữ form, hướng dẫn ngày sinh thiếu và focus, Ctrl+S, playlist reorder/remove/undo và toàn bộ hồi quy tài khoản/album/quà/quẻ/QR. Build thành công; chưa nghiệm thu trực quan trên thiết bị thật trong đợt này.
