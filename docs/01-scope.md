# Hiện trạng và phạm vi

## 1. Kết quả đọc dự án

| Thành phần | Bằng chứng trong mã | Ý nghĩa khi nâng cấp |
|---|---|---|
| Frontend React/Vite | `src/App.jsx`, `package.json` | Có thể tái sử dụng giao diện sinh nhật và thành phần tương tác |
| Trình sửa | `src/components/EditorPage.jsx`, URL `?edit=1` | Sửa tên, ngày sinh, tiêu đề, lời chúc, thẻ quà/bánh may mắn, ảnh và playlist |
| Backend Express/PostgreSQL | `server/index.js`, `server/db.js`, `api/index.js` | Có nền lưu trữ và triển khai server/serverless |
| Nội dung chung | `birthday_profile` khóa cố định `id=1`; memories/tracks không có owner | Chưa tách dữ liệu theo user/trang |
| Đăng nhập editor | `/api/editor-session`, `admin_users` | Dùng mật khẩu admin cấu hình; cookie chỉ ký thời hạn, không mang định danh user; chưa có đăng ký người dùng |
| Đọc nội dung công khai | GET `/api/content-settings`, `/api/tracks`, `/api/card/:id?`, `/api/content-media/:id` | Phải đóng đường truy cập nội dung riêng; media hiện có cache public dài hạn |
| Tạo thiệp | POST `/api/card` lưu JSON; App đọc `?card=` | Thiệp chỉ thay cardData; ảnh/nhạc còn lấy nguồn chung. Chưa phải trang độc lập hoàn chỉnh |
| Điều ước | POST `/api/wishes`, `InteractiveCake.jsx` | Chưa gắn trang/chủ sở hữu, cần định phạm vi lại |
| Cache trình duyệt | `src/utils/contentSettings.js`: localStorage/IndexedDB dùng khóa chung | Có nguy cơ hiện nội dung tài khoản trước trên thiết bị dùng chung |
| Nhạc mặc định | Hai MP3 trong `public/audio`, khai báo tại `DEFAULT_CONTENT` và `EMPTY_CONTENT` | Phải giữ nguyên file, ID và khả năng phát |
| Kiểm thử | `package.json` chưa khai báo script test | Cần xây kiểm thử API/quyền truy cập khi triển khai |

Đây là đánh giá tĩnh từ mã nguồn, chưa xác minh môi trường triển khai hay dữ liệu thật. Không đọc thông tin bí mật hoặc truy cập database production.

## 2. Hệ thống đích

Luồng người tạo: đăng ký + CAPTCHA → xác minh email → đăng nhập → dashboard → tạo nháp → tùy chỉnh → lưu → xem trước → tạo trang → bật chia sẻ và nhận QR/link → gửi QR cho người nhận. Sau đó có thể sửa nháp và tạo lại, ngừng chia sẻ hoặc đổi QR.

Luồng người nhận: quét QR hoặc bấm link → hệ thống kiểm tra quyền chia sẻ → mở phong thư → xem lời chúc/ảnh/quà, nghe nhạc, thổi nến. Không cần đăng ký, đăng nhập hay CAPTCHA để xem.

“Generate” là lưu một snapshot hoàn chỉnh gồm nội dung, ảnh tham chiếu, cấu hình quà và playlist; cung cấp URL riêng trong cùng ứng dụng. Không cần tạo repository, build hay deployment riêng cho từng user. Snapshot phải sử dụng renderer/template có phiên bản để tránh thay đổi ngoài ý muốn khi nâng cấp giao diện.

Tách hai quyền: chủ tài khoản được quản lý/sửa nháp; người có QR/link hợp lệ chỉ xem snapshot đã tạo. Liên kết chia sẻ không xuất hiện trong danh sách công khai hay công cụ tìm kiếm. QR không xác minh danh tính người nhận: bất kỳ ai được chuyển tiếp QR/link đều xem được. Nếu sau này cần chỉ đúng một cá nhân được xem, phải thêm PIN/OTP hoặc tài khoản người nhận; chưa thuộc MVP.

## 3. Phạm vi phiên bản đầu

- Đăng ký/đăng nhập/đăng xuất, xác minh email, quên và đổi mật khẩu, CAPTCHA và giới hạn tần suất.
- Dashboard hiển thị trang của tôi, trạng thái, thời điểm lưu/tạo, các mục có thể chỉnh và thư viện nhạc mặc định.
- Một trang đang hoạt động/user; một bản nháp và nhiều phiên bản đã tạo, chỉ phiên bản hiện hành được mở bằng URL chính. Xóa trang rồi được tạo trang khác.
- Giữ trải nghiệm phong thư, bánh/nến/micro, pháo giấy, quà, bánh may mắn, album và trình phát nhạc.
- Lưu server, xem trước, tạo/cập nhật, xóa trang, bảo vệ toàn bộ tài nguyên riêng.
- Bật chia sẻ sau generate; hiển thị QR, tải PNG và sao chép link; khách xem bản đã tạo không cần tài khoản. Chủ trang có thể ngừng chia sẻ hoặc đổi mã QR; ảnh/nhạc đã dùng trong bản chia sẻ được phục vụ theo quyền xem tương ứng.
- Giữ upload ảnh/nhạc và liên kết nhạc/YouTube đang có, với giới hạn và kiểm tra đầu vào.
- Quản trị tài khoản, mẫu mặc định và thư viện dùng chung; không mặc định có quyền xem nội dung riêng của user.
- Migration có kiểm soát từ dữ liệu dùng chung sang chủ sở hữu được chỉ định.

Chưa thuộc phiên bản đầu: danh bạ trang công khai, PIN/OTP cho người nhận, QR dùng một lần, đồng biên tập, nhiều trang/user, thanh toán, AI tạo lời chúc, domain riêng, xuất HTML/ZIP, lịch gửi tự động, lịch sử cập nhật sản phẩm. Khách được xem qua QR hợp lệ nhưng không được sửa hay xem nháp.

## 4. Các quyết định cần xác nhận

| Mã | Nội dung cần chốt | Mặc định đề xuất trong bộ tài liệu |
|---|---|---|
| D-01 | “Các thay đổi có sẵn” là tùy chỉnh hay thông báo cập nhật hệ thống? | Các tùy chỉnh hiện tại; nếu là changelog thì bổ sung requirement riêng |
| D-02 | Ai được xem trang được tạo? | Đã cập nhật theo yêu cầu: chủ sở hữu và người có QR/link hợp lệ. Đề xuất không yêu cầu tài khoản người nhận |
| D-03 | Mỗi user có bao nhiêu trang? | Một trang đang hoạt động ở MVP; schema cho phép mở rộng |
| D-04 | Định danh tài khoản | Email/mật khẩu, xác minh email trước khi dùng nội dung riêng |
| D-05 | Nhà cung cấp CAPTCHA, email và nơi lưu media | Chọn khi thiết kế kỹ thuật; không khóa nhà cung cấp trong nghiệp vụ |
| D-06 | Quyền sửa giao diện | Giữ một mẫu hiện tại; sửa nội dung/cấu hình, chưa có bộ chọn theme mới |
| D-07 | Giới hạn, lưu giữ và SLA | Các con số trong requirements là mốc đề xuất để lập trình/kiểm thử |

## 5. Thứ tự triển khai

1. Chốt các quyết định; thiết kế schema/migration và hợp đồng API.
2. Tài khoản, session, CAPTCHA và kiểm soát ownership, đóng API cũ.
3. Dashboard, editor riêng, lưu nháp và tài nguyên riêng.
4. Snapshot, renderer riêng, playlist mặc định, tương tác và luồng chia sẻ QR/thu hồi/media cho người nhận.
5. Kiểm thử phân quyền/hồi quy, diễn tập migration/khôi phục rồi nghiệm thu.
