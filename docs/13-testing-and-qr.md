# Playwright, Swagger và QR

## Chạy kiểm thử

```powershell
npm install
npm test
npm run test:e2e
npm run test:report
```

Playwright mở server riêng ở 3002 và frontend ở 5175, proxy API tới 3002, chạy Chrome desktop và viewport iPhone. Không dùng cổng phiên local 3001/5173. `flows.spec.js` giả lập dữ liệu giao diện đăng nhập/editor/generate/QR. Các ca OpenAPI, catalogue, khách chưa đăng nhập, sai origin và Execute qua Swagger gọi API thật.

`public-sharing.spec.js` kiểm tra chia sẻ bằng API và database thật: tạo chủ sở hữu/phiên thử riêng, tạo thiệp và link từ giao diện, rồi mở link trong browser context mới không có cookie tài khoản. Xác minh xem thiệp và ảnh, tải lại, không gọi API đăng nhập, không được sửa; chặn mã sai và link hết hạn. Dữ liệu thử được xóa trong `finally`. Không sửa thiệp của tài khoản hiện có. Dùng DATABASE_URL staging khi chạy test trong môi trường riêng.

Chưa bao phủ tự động: CAPTCHA Cloudflare thật, gửi email thật, cookie hai tài khoản thật và kiểm tra chéo toàn bộ media, mic vật lý, camera quét QR bản in. Không xem pass test mock là chứng minh phân quyền database thực tế đầy đủ.

## Swagger UI

Playwright mặc định dùng Google Chrome đã cài trên máy. Nếu chưa có Chrome, chạy `npx playwright install chromium`, đặt `$env:PW_CHANNEL="chromium"` trong PowerShell rồi chạy test. Bộ kiểm thử hiện có 12 ca E2E (desktop/mobile), gồm cả luồng người nhận dùng backend thật; 37 ca nghiệp vụ/DOM. Chưa kiểm thử camera quét QR vật lý.

Chạy `npm run dev`, mở **http://localhost:5173/api/docs/**. OpenAPI JSON tại `/api/openapi.json`. Chỉ bật ngoài production.

1. Thử GET `/api/platform/config` và `/fortune-catalog` → Try it out → Execute.
2. Đăng nhập tài khoản staging tại giao diện cùng origin `http://localhost:5173`; Swagger sử dụng cookie HttpOnly cùng origin. Không nhập cookie/token vào tài liệu hoặc ảnh chụp.
3. GET `/api/platform/page` lấy `draft` và `revision`.
4. PUT `/api/platform/page` gửi `{ "content": <draft lấy từ GET>, "revision": <revision> }`. Không gửi ví dụ content rỗng: ví dụ chỉ mô tả envelope, server sẽ từ chối nội dung thiếu.
5. POST `/generate` gửi `{ "revision": <revision mới sau PUT> }`.
6. POST `/share` gửi `{ "rotate": false }`, GET `/page` lấy `shareUrl` và `share_expires`.
7. DELETE `/share` để thu hồi trên dữ liệu staging; không thử DELETE page trên dữ liệu cần giữ.

Lưu ý: Swagger mở trực tiếp ở cổng backend 3001 vẫn đọc được GET, nhưng POST có thể bị 403 vì SITE_ORIGIN là 5173. Dùng đường dẫn qua frontend như trên. API registration cần CAPTCHA thật từ widget, không có bypass trong Swagger.

## QR đã tích hợp sẵn

Thư viện `qrcode` đã cài. `CreatorWorkspace` dùng `QRCode.toDataURL(shareUrl, {width:512,margin:4,errorCorrectionLevel:'M'})`, hiển thị PNG và cho tải xuống. QR chứa URL có mã xem; không chứa quyền sửa hay mật khẩu tài khoản. Không cần đăng ký dịch vụ tạo QR ngoài.

Để dùng thực tế:

1. Deploy frontend/backend trên cùng domain HTTPS, ví dụ `https://birthday.example.com`.
2. Đặt `SITE_ORIGIN=https://birthday.example.com` (không có dấu `/` cuối); giữ `DATABASE_URL` và `EDITOR_SESSION_SECRET` hợp lệ, ổn định.
3. Thêm hostname production vào Cloudflare Turnstile; cập nhật environment variables và redeploy/restart backend.
4. Đăng nhập → sửa và lưu → xem thiệp → Tạo QR. Tải PNG hoặc gửi kèm liên kết cho người nhận.
5. Dùng điện thoại chưa đăng nhập quét QR: đúng thiệp, không có quyền sửa. QR hết hạn sau 72 giờ, đổi QR vô hiệu mã cũ; cập nhật nội dung không gia hạn.
6. Thử ngừng chia sẻ và quét lại mã cũ để kiểm tra thu hồi.

QR chứa `localhost` không dùng được trên điện thoại khác, vì nó trỏ vào chính điện thoại. Sau khi đổi SITE_ORIGIN/domain hãy đổi QR và tải mã mới; ảnh QR đã tải trước đó không tự cập nhật URL. Giữ toàn bộ URL gồm fragment `#key=...` khi gửi; không chia sẻ ảnh chụp QR/token công khai nếu muốn giới hạn người biết link.
