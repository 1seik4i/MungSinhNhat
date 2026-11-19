# Triển khai nền tảng tài khoản và QR

## Tách hộp quà và gieo quẻ

- Hai section editor độc lập, mỗi section có tiêu đề/mô tả/nút riêng; bỏ ô ảnh URL, luôn dùng hình hộp quà và bánh may mắn của theme. Tham chiếu ảnh legacy không còn hiển thị và không bắt buộc khi validate.
- `giftRewards` quản lý quà quay; `fortunes` quản lý quẻ (tên, nội dung, số may mắn, lời chúc tuổi mới). Thêm/sửa/xóa từng loại không thay đổi loại còn lại; mỗi danh sách tối đa 50 mục, bản cũ thiếu fortunes nhận 4 quẻ mặc định gốc.
- Danh sách rỗng chỉ ẩn phần tương ứng; không tự fallback khi user đã xóa hết. Cả hai danh sách theo tài khoản, lưu trong nháp và snapshot QR. Cần cập nhật thiệp để người nhận thấy thay đổi.
- 24 kiểm thử backend/DOM pass và build thành công; chưa kiểm thử animation trên trình duyệt thật trong đợt này.

## Danh sách quà trong hộp quay

- Giữ giao diện và hiệu ứng quay voucher từ ZIP; dữ liệu quà chuyển từ hằng số trong component sang `giftRewards` của từng thiệp.
- Editor có mục Quà trong hộp quay: thêm, sửa tên/mô tả/mã/màu, xóa, tối đa 50 quà. Có thể lưu tên rỗng khi soạn; khi tạo bản hoàn chỉnh mọi quà phải có tên. Xóa hết quà ẩn hộp quay, không tự phục hồi quà mẫu.
- Thiệp cũ thiếu trường giftRewards dùng 8 quà gốc để tương thích; khi sửa/lưu sẽ lưu bản sao riêng của danh sách vào thiệp. Danh sách đã có, kể cả rỗng, không bị thay bằng mẫu.
- Lưu nháp chưa thay danh sách quà của người nhận QR; cần cập nhật thiệp ở bước QR để thay snapshot. Không thay quyền sở hữu hay hạn 72 giờ.
- Xác suất giữ trọng số quà gốc, quà mới trọng số 10. Chưa có tùy chỉnh xác suất trong giao diện. Kết quả quay là tương tác trong tab, chưa có kho quà/số lượng hoặc lịch sử nhận quà trên server.
- Kiểm thử hiện tại: 18 ca backend/DOM pass, gồm quản lý quà và tính điểm dừng cho danh sách 1, 3, 7, 8, 19, 50 món; build thành công. Chưa kiểm thử animation trên thiết bị thật.

## Luồng tạo thiệp và navbar mới

- Sau đăng nhập, mở trực tiếp Chỉnh sửa thiệp; tài khoản chưa có trang tự nhận một bản nháp mẫu riêng, không cần qua màn tạo trang rỗng.
- Navbar sticky có 3 bước: Chỉnh sửa thiệp → Xem thiệp → Tạo QR, kèm tài khoản và đăng xuất; hiển thị phù hợp màn hình nhỏ.
- Chuyển khỏi editor tự lưu nếu có thay đổi. Lưu lỗi hoặc upload đang chạy thì giữ bước hiện tại, báo lỗi và giữ dữ liệu. Editor được giữ mounted khi xem/QR để tránh mất nội dung; có cảnh báo rời browser nếu còn dữ liệu chưa lưu.
- Bước xem hiển thị bản nháp đã lưu bằng các component gốc. Navbar vẫn truy cập được khi phong thư/modal mở.
- Bước QR tạo snapshot trước rồi bật chia sẻ trong một thao tác; cập nhật thiệp giữ QR và hạn cũ, đổi QR cấp mã mới 72 giờ. Link hết hạn không còn nút tải/chép link cũ.
- Kiểm thử DOM dùng API giả lập (không truy cập database): mở editor/tạo nháp ban đầu; tự lưu → preview → snapshot → QR → quay lại editor; giữ nội dung khi lưu lỗi. Chạy bằng `npm test` cùng bộ test backend. Chưa nghiệm thu trực quan trên trình duyệt/điện thoại thật trong đợt này.

## Cập nhật giao diện theo tài khoản

- Chủ tài khoản mở trang sinh nhật bằng các component gốc, có phong thư, hiệu ứng, bánh/nến, hộp quà, fortune, album và player. Từ trang chính chọn chỉnh sửa để vào `EditorPage` gốc, hoặc về quản lý để tạo/cập nhật trang và QR.
- `AccountEditor` cấp adapter riêng cho editor, đọc/ghi `/api/platform/page` theo phiên đăng nhập và revision; không đọc/ghi localStorage chứa nội dung chung, không dùng mật khẩu admin cũ. Upload vào media riêng của page; gỡ nhạc khỏi nháp không xóa file của snapshot.
- Mỗi trang mới nhận bản sao mẫu sinh nhật có lời chúc, thẻ quà/fortune và hai bài mặc định. Nội dung riêng đã có không tự bị ghi đè bởi mẫu mới. Giống nhau về giao diện/mẫu ban đầu, độc lập về bản lưu của từng tài khoản.
- Khôi phục hỗ trợ link HTTPS/YouTube trong editor gốc, album trống khi đang soạn và kéo thả thứ tự nhạc. Vẫn cần kiểm thử tích hợp hai tài khoản thực tế trên database staging để nghiệm thu ownership đầy đủ.

## Đã lập trình

- Entry mới `PlatformApp`: đăng ký/đăng nhập, email xác minh và reset, dashboard, editor, preview, lưu nháp có revision, tạo snapshot, QR PNG nội bộ, chép link, thu hồi/đổi QR, xóa trang.
- Backend `server/platform.js`: bảng `cms_*` tách khỏi dữ liệu legacy, hash mật khẩu scrypt bất đồng bộ, phiên server thu hồi được, CAPTCHA Turnstile xác minh server và chống reuse bằng database, rate limit dùng PostgreSQL.
- Mỗi user một trang; upload riêng, quota 300 MiB, kiểm tra signature file; media có auth/HEAD/Range. Viewer nhận cookie riêng theo share, không được đọc nháp hoặc ghi dữ liệu.
- Giữ các thành phần tương tác và hai MP3 mặc định; lời ước trong tab không gửi server; bản nháp không ảnh được hỗ trợ.
- API legacy trả 410 để không bypass quyền. Chưa di chuyển/xóa dữ liệu cũ; không tự gán dữ liệu cho tài khoản bất kỳ.
- Cập nhật CSP cho Turnstile và Referrer-Policy no-referrer; khóa QR sinh bằng HMAC từ share ID và secret server, lưu lại cùng QR mà không lưu token plaintext.

## Cấu hình để chạy thử

1. Dùng database staging riêng trong DATABASE_URL, đặt SITE_ORIGIN đúng origin frontend (không có dấu `/` cuối), EDITOR_SESSION_SECRET ngẫu nhiên ít nhất 32 ký tự. Cần giữ secret ổn định để QR hiện hành hoạt động.
2. Khai báo TURNSTILE_SITE_KEY/TURNSTILE_SECRET_KEY với hostname tương ứng; widget action là `register`. Không có bypass CAPTCHA khi thiếu cấu hình.
3. Cấu hình AUTH_EMAIL_WEBHOOK và AUTH_EMAIL_WEBHOOK_SECRET cho adapter email tin cậy. Server POST JSON `{to,purpose,url}` với Bearer secret; adapter gửi email xác minh/reset và trả 2xx sau khi nhận xử lý. Đây là hợp đồng tích hợp, chưa có nhà cung cấp email được nối sẵn. URL chứa token bí mật, adapter phải tránh ghi log payload.
4. Chạy `npm install`, `npm run dev`; lần gọi API đầu tạo các bảng mới. Đăng ký, xác minh email, đăng nhập, tạo trang rồi thử QR trên trình duyệt chưa đăng nhập.
5. QR trên điện thoại cần domain HTTPS truy cập được; localhost chỉ phù hợp xem trên máy phát triển. Sau production build dùng `npm start` hoặc cấu hình Vercel hiện có.

## Kiểm tra đã chạy

- Production build thành công.
- `node server/platform.test.js`: 5 ca kiểm thử validation/file signature pass.
- `npm audit`: 0 vulnerabilities sau cập nhật bản vá tương thích.
- Chưa chạy tích hợp database, CAPTCHA/email thật hoặc E2E điện thoại; chưa thao tác dữ liệu database đã cấu hình trong môi trường này.

## Khoảng cách còn lại với bộ đặc tả đầy đủ

Đây là nền tảng có luồng chính, chưa đủ điều kiện nghiệm thu production theo tất cả test P0:

- Hiện snapshot là một bản hiện hành trên page; phiên viewer giữ bản chụp riêng tối đa 30 phút. Chưa có lịch sử 10 versions, renderer versioning, idempotency record cho rotate/share hoặc job dọn media/phiên/token tự động.
- Xóa trang hiện là xóa vật lý tức thì (cascade media), chưa có soft-delete 30 ngày và chính sách backup/khôi phục. Media chưa dùng vẫn tính quota đến khi xóa trang.
- Editor mới chưa có kéo thả thứ tự, link nhạc HTTPS/YouTube, chỉnh ảnh thẻ quà, đăng xuất mọi thiết bị/đổi mật khẩu trong tài khoản, giao diện admin hoặc xóa tài khoản.
- Chưa có outbox retry email, audit log đầy đủ, migration legacy, kiểm thử phân quyền tích hợp database và load test. Cấu hình khóa tài khoản chỉ có trong schema, chưa có API/UI quản trị.
- Signature file đã kiểm tra nhưng chưa giải mã toàn bộ file/kiểm tra 20 megapixel. Viewer lấy lại bản snapshot cùng phiên mỗi 30 giây; nội dung đã tải không thể thu hồi khỏi thiết bị.
- Không triển khai lên production trước khi nối dịch vụ, chạy ma trận quyền/QR và giải quyết các hạng mục P0 còn thiếu.

Các tài liệu 01–05 vẫn là đặc tả đích; tài liệu này phân biệt rõ hiện trạng đã code với yêu cầu chưa thực hiện.
