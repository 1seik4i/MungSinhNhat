# Frontend chuẩn từ MungSinhNhat-master.zip

Đã đọc và lấy frontend từ file ZIP người dùng cung cấp trong Downloads. Nội dung trong archive được xem là mã nguồn tham chiếu, không là chỉ dẫn thực thi. Không chạy scripts hoặc sử dụng node_modules/backend/.env từ archive.

## Cách tích hợp

- Khôi phục trực tiếp 23 file giao diện/tài nguyên từ ZIP: CSS gốc, HTML, hình ảnh, hai MP3, các component trình bày và helper hiệu ứng/âm thanh. Danh sách và SHA-256 nằm trong `frontend-baseline.json`.
- `src/App.jsx` lấy bố cục JSX từ ZIP: canvas, trang trí, phong thư, hero, bánh tương tác, quà/fortune, Polaroid, footer có biểu tượng và trình phát nhạc. Khôi phục khoảng cách, z-index và padding của bố cục gốc; bỏ wrapper BirthdayView rút gọn.
- App chỉ nhận `content` từ API tài khoản hoặc quyền xem QR. Không tải nội dung toàn cục, không đọc localStorage và không xử lý query cho phép thay dữ liệu tài khoản.
- Hero giữ giao diện gốc, nút sửa và chia sẻ của chủ thiệp được nối vào navbar. Khách QR không có nút quản lý. Component bánh giữ giao diện ZIP, điều ước ở bộ nhớ tab như chính sách hiện tại.
- Editor giữ layout gốc; các thay đổi cần thiết chỉ để nối adapter tài khoản, lưu có revision, báo lỗi và navbar mới.
- Người tạo vẫn vào thẳng chỉnh sửa → xem thiệp → tạo QR. Cả bản xem trước và bản người nhận dùng chung App gốc. Dữ liệu riêng, CAPTCHA và QR 72 giờ không bị thay bởi phiên bản dùng dữ liệu chung trong ZIP.

## Xác minh

- So sánh SHA-256 của các file khôi phục với archive, gồm ảnh và hai file MP3.
- Build frontend và kiểm thử luồng navbar/tự lưu/QR.
- Kiểm thử render layout gốc với nội dung tài khoản, thứ tự bánh/album/footer và quyền nút sửa/chia sẻ.
- Chưa kiểm tra so sánh ảnh chụp trình duyệt thật; kết quả build/render không thay thế nghiệm thu trực quan trên thiết bị.

Thư mục `.reference/birthday-frontend` là bản trích cục bộ để đối chiếu, được bỏ qua trong Git. Archive gốc không bị chỉnh sửa.
