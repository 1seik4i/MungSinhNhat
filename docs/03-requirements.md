# Requirements và thiết kế khung

Mức ưu tiên: P0 = bắt buộc trước khi phát hành; P1 = hoàn thiện sau P0. Toàn bộ giới hạn và chỉ tiêu số dưới đây là đề xuất v0.1, cần chốt theo D-07.

## 1. Functional requirements

| ID | Ưu tiên | Requirement và tiêu chí chấp nhận | Business rule |
|---|---|---|---|
| FR-01 | P0 | Đăng ký email, mật khẩu, xác nhận mật khẩu và CAPTCHA; validate tại client và server; thành công tạo đúng một user pending, gửi link xác minh và hướng dẫn bước tiếp theo | BR-A01–A05 |
| FR-02 | P0 | Xác minh email một lần, gửi lại email có giới hạn; link hết hạn được xin lại; xác minh thành công chuyển active | BR-A05,A06 |
| FR-03 | P0 | Đăng nhập đúng tài khoản active mở dashboard; pending chỉ vào màn xác minh; sai thông tin báo lỗi chung; khóa tài khoản chặn đăng nhập | BR-A06,A07 |
| FR-04 | P0 | Đăng xuất, hết phiên, đổi/reset mật khẩu, thu hồi phiên; không truy cập lại bằng cookie đã thu hồi; link reset một lần và có hết hạn | BR-A07,A08 |
| FR-05 | P0 | Dashboard chỉ trả trang của user hiện tại; hiển thị trạng thái, lần lưu/tạo, thay đổi chưa tạo lại và hành động tạo/sửa/xem trước/mở/xóa; trạng thái rỗng hướng dẫn tạo mới | BR-P01–P03,P05 |
| FR-06 | P0 | Tạo nháp từ mẫu trắng theo phiên bản và hai bài nhạc mặc định; giới hạn một trang hoạt động ở cả API/database | BR-P02,P03,M01 |
| FR-07 | P0 | Editor có nhóm người nhận, lời chúc, quà/bánh may mắn, album, playlist; load/lưu toàn bộ từ dữ liệu riêng; báo lỗi theo trường; không có ảnh vẫn hợp lệ | BR-P04,P11,P12 |
| FR-08 | P0 | Lưu nháp với revision; chỉ báo thành công sau server commit; tab dùng revision cũ nhận 409 và lựa chọn tải lại hoặc giữ nội dung để sao chép thủ công | BR-P05,P08,P11 |
| FR-09 | P0 | Preview của chủ trang render đúng nháp đã lưu, có nhãn xem trước; không có URL public hay fallback sang nội dung hệ thống | BR-P05,S01–S03 |
| FR-10 | P0 | Generate nhận revision đã lưu và idempotency key, validate dữ liệu/media, tạo snapshot đầy đủ trong transaction, trả URL riêng; thất bại không làm hỏng phiên bản đang dùng | BR-P06–P08 |
| FR-11 | P0 | Chủ trang mở URL chính nhận đúng snapshot hiện hành; sửa nháp không đổi bản đang xem; tạo lại giữ URL và cập nhật toàn bộ nội dung đồng bộ | BR-P05–P07 |
| FR-12 | P0 | User khác/khách không có quyền chia sẻ không đọc nội dung riêng; người có QR hợp lệ chỉ xem snapshot/media được cấp qua API viewer. Mọi thao tác quản lý vẫn chỉ owner, xử lý thống nhất route cũ | BR-P01,S01–S04,Q09 |
| FR-13 | P0 | Upload/gắn/gỡ/sắp xếp ảnh và nhạc; kiểm tra quota, loại file, ownership; file đang được phiên bản dùng không bị mất khi sửa nháp | BR-M03–M07 |
| FR-14 | P0 | Hai bài mặc định vẫn phát; user bật/tắt/sắp xếp/khôi phục playlist riêng; chỉnh playlist không đổi thư viện hoặc playlist user khác | BR-M01,M02 |
| FR-15 | P0 | Giữ phong thư, bánh, nến, micro, quà, bánh may mắn, album và hiệu ứng; điều ước chỉ lưu đúng trang/user; micro bị từ chối có thao tác chạm thay thế | BR-P10,M08 |
| FR-16 | P0 | Xóa trang bằng hộp xác nhận ghi tên trang; thu hồi truy cập ngay, dọn liên quan theo chính sách; sau xóa user được tạo trang mới | BR-P02,P09,M05 |
| FR-17 | P0 | Admin khóa/mở tài khoản, cập nhật mẫu và metadata nhạc dùng chung; có audit; không có quyền đọc trang riêng mặc định; không xóa hai file nhạc gốc qua chức năng quản trị | BR-P12,M01,S05 |
| FR-18 | P0 | Migration có dry-run, báo cáo số lượng, mapping owner, kiểm tra file, rollback; vô hiệu phiên/route/cache cũ trước khi mở hệ thống nhiều user | BR-S06 |
| FR-19 | P1 | Xóa tài khoản theo xác nhận lại mật khẩu: khóa truy cập ngay, xóa toàn bộ trang/media theo hạn lưu giữ; không tự xóa dữ liệu của user khác | BR-A07,P09 |
| FR-20 | P0 | Owner bật chia sẻ sau generate, nhận link HTTPS và QR tải PNG/sao chép link; thử QR không login; không gửi token ra dịch vụ tạo QR ngoài | BR-Q01–Q03,Q06–Q08 |
| FR-21 | P0 | Người nhận quét QR mở snapshot hiện hành không đăng nhập/CAPTCHA; xem lời chúc, quà, album, phát nhạc, thổi nến; không thấy editor/nháp hoặc nút quản lý; điều ước chỉ xử lý trong tab | BR-Q04,Q09; BR-P10 |
| FR-22 | P0 | Owner ngừng chia sẻ, đổi mã, tùy chọn hết hạn; link/phiên xem cũ mất quyền; dashboard hiển thị trạng thái chia sẻ độc lập với trạng thái generate | BR-Q03–Q06,Q10 |
| FR-23 | P0 | Media viewer kiểm tra share còn hiệu lực, owner active và asset thuộc version cố định của phiên; hỗ trợ HEAD/Range cho nhạc; cấm media chỉ có trong nháp/phiên bản không được cấp | BR-M03,Q04,Q05,Q09 |

FR-17 là phạm vi quản trị tối thiểu; có thể triển khai bằng công cụ vận hành nội bộ được bảo vệ, chưa cần dashboard admin đầy đủ. Tạm dừng tài khoản không đồng nghĩa xóa dữ liệu.

## 2. Quy định dữ liệu và hạn mức

| Trường/tài nguyên | Giới hạn đề xuất | Khi không hợp lệ |
|---|---|---|
| Tên người nhận | 1–120 ký tự sau trim khi generate | 422, lỗi tại trường |
| Ngày sinh | YYYY-MM-DD, ngày lịch hợp lệ, cho phép ngày trong tương lai để chuẩn bị thiệp trước | 422; gồm kiểm tra năm nhuận |
| Tiêu đề / lời chúc | 1–200 / 1–5.000 ký tự sau trim khi generate | 422; nháp cho phép rỗng |
| Tiêu đề album / chú thích ảnh | Tối đa 200 / 1.000 ký tự | 422 |
| Ngày kỷ niệm | Không bắt buộc; YYYY-MM-DD nếu nhập | 422; khác chuỗi tự do “Hôm nay” ở editor cũ |
| Thẻ quà/fortune | Hai loại cố định; tiêu đề 200, mô tả 2.000, nhãn hành động 80 ký tự; ảnh không bắt buộc | 422; action là loại hành vi cho phép, không là code |
| Album | 0–100 ảnh; mỗi mục khi generate phải có ảnh hợp lệ; góc xoay -15 đến 15 độ | 422; album rỗng ẩn khu vực album |
| Playlist | 0–100 mục, bao gồm bài mặc định; ID không trùng; thứ tự được lưu; bật/tắt bằng trạng thái rõ ràng | 422; không tự chèn nhạc khi user đã chọn tắt |
| Ảnh upload | JPEG, PNG, WebP, GIF; tối đa 5 MiB/file gốc; ảnh giải mã được, tối đa 20 megapixel | 413 nếu quá byte; 415 nếu sai định dạng; 422 nếu hỏng/quá pixel |
| Nhạc upload | MP3, WAV, M4A; tối đa 15 MiB/file | 413/415/422 tương ứng |
| Quota riêng | 300 MiB/user gồm media còn giữ bởi nháp/snapshot; không tính nhạc hệ thống | 409 QUOTA_EXCEEDED; kiểm soát upload đồng thời |
| URL ngoài | HTTPS, tối đa 2.048 ký tự; YouTube chỉ host/ID hợp lệ; cấm javascript:, data:, file:, localhost và địa chỉ mạng riêng | 422; không fetch URL tùy ý ở server |
| Điều ước | 1–500 ký tự sau trim | 422 |
| Phiên bản | Giữ 10 snapshot gần nhất/trang gồm current; bản cũ còn viewer session được giữ tạm đến hết phiên, tối đa 30 phút; không có UI xem/restore lịch sử ở MVP | Sau hết phiên dọn bản thừa và media không còn dùng theo job |
| Quyền chia sẻ | Một share đang active/page; token 32 byte ngẫu nhiên; expires_at tùy chọn phải ở tương lai | 409 nếu chưa generate; 422 nếu thời hạn sai |
| Phiên xem | 30 phút tuyệt đối, không tự gia hạn; luôn kiểm tra share generation/status, expiry, page và owner ở request mới | Hết quyền yêu cầu mở lại QR; không chuyển sang login |

Đếm ký tự văn bản theo Unicode code point thống nhất giữa client/server, không cắt theo byte. Server là nơi quyết định hợp lệ cuối cùng. Upload phải kiểm tra dung lượng gốc trước tối ưu phía client; nếu dùng upload file đã nén thì giới hạn áp dụng cho file thực sự gửi server, UI phải nói rõ. Không tin trường khai báo kích thước gốc từ client.

Hạn mức chống lạm dụng ban đầu: đăng ký 5 lần/15 phút/IP; đăng nhập sai 5 lần/15 phút/định danh và 30 lần/15 phút/IP; gửi email xác minh/reset 3 lần/giờ/định danh và 20 lần/giờ/IP. Hết hạn mức trả 429 + Retry-After, lưu bộ đếm dùng chung giữa các instance. Đăng nhập thành công reset bộ đếm sai theo định danh, không reset hạn mức IP.

## 3. Non-functional requirements

| ID | Yêu cầu và cách nghiệm thu |
|---|---|
| NFR-01 | 100% trường hợp truy cập chéo trái phép bị chặn; viewer QR chỉ nhận snapshot/media được cấp. Rà soát mọi method, cả HEAD/Range, admin và API cũ. Không đặt media cá nhân trong public. |
| NFR-02 | TLS production; password hash có salt, token ngẫu nhiên đủ mạnh; cookie an toàn, CSRF, kiểm tra dữ liệu và truy vấn tham số hóa; secrets chỉ ở server. Cấu hình CSP cho nhà cung cấp CAPTCHA đã chọn và kiểm tra thực tế. |
| NFR-03 | API riêng trả private,no-store; không dùng localStorage chứa payload riêng ở MVP; nếu có cache sau này phải scope theo user/page và purge. Logout, hết phiên, Back/Forward và đổi tài khoản không hiện payload cũ. Không thể thu hồi nội dung chủ sở hữu đã tự lưu/chụp trên thiết bị. |
| NFR-04 | Ở staging với 50 phiên đồng thời, dữ liệu mỗi trang 100 ảnh/100 tracks, API metadata đạt p95 ≤ 1 giây, generate p95 ≤ 3 giây trong 10 phút; không tính truyền file hoặc nhà cung cấp email/CAPTCHA. Tỷ lệ lỗi nội bộ < 1%. |
| NFR-05 | Không mất lần lưu đã xác nhận; transaction và revision/idempotency được kiểm thử với lỗi giữa chừng và ghi đồng thời. |
| NFR-06 | Màn hình 360px, tablet, desktop dùng được; các luồng đăng ký/editor/phát nhạc dùng bàn phím, có label, focus, trạng thái lỗi; CAPTCHA có phương án tiếp cận được của provider. Tôn trọng reduced-motion. |
| NFR-07 | Xác minh thủ công trên hai bản ổn định gần nhất tại thời điểm nghiệm thu của Chrome/Edge/Firefox và Safari iOS; micro/autoplay từ chối không khóa luồng sinh nhật. |
| NFR-08 | Backup hằng ngày, RPO ≤ 24 giờ, RTO ≤ 4 giờ; diễn tập restore trước phát hành; backup luân chuyển tối đa 35 ngày. Sau restore áp dụng lại danh sách xóa trước khi cho truy cập. |
| NFR-09 | Audit các lần đăng nhập, chặn ownership, lưu, generate, xóa và quản trị; giữ 90 ngày, quyền đọc hạn chế. Có request ID và cảnh báo lỗi API/email/CAPTCHA; không log nội dung riêng. |
| NFR-10 | Provider email lỗi: lưu trạng thái chờ gửi và retry có giới hạn, không tạo user trùng; provider CAPTCHA lỗi không bypass. Database lỗi trả lỗi dịch vụ rõ ràng, không fallback dữ liệu user trước. |
| NFR-11 | Quét QR PNG tải từ hệ thống trên điện thoại Android/iOS thực tế, camera và trình duyệt trong ứng dụng nhắn tin; mở được không login. QR có nền trắng, vùng trống tối thiểu 4 module, kích thước xuất tối thiểu 512×512, không chèn logo MVP; có link chữ thay thế. |
| NFR-12 | Token không có trong log/analytics/Referer; trang viewer private,no-store và noindex. Tách cookie viewer khỏi cookie tài khoản; nhiều trang ở nhiều tab không cấp nhầm quyền. Rate limit exchange đề xuất 60 request/phút/IP, trả 429, không áp CAPTCHA người nhận. |

## 4. Mô hình dữ liệu logic

Đây là thiết kế định hướng, chưa phải SQL migration.

| Entity | Trường/quan hệ chính | Ràng buộc |
|---|---|---|
| users | id, normalized_email, password_hash, status, email_verified_at, role, timestamps | UNIQUE email; pending/active/suspended/deleted |
| sessions | id/token_hash, user_id, created_at, last_seen_at, expires_at, revoked_at | Thu hồi server; luôn kiểm tra status user |
| auth_tokens | token_hash, user_id, purpose, expires_at, consumed_at | Xác minh/reset một lần, consume atomically |
| page_templates | id, version, renderer_version, default_content | Bất biến theo version; không chứa dữ liệu riêng |
| birthday_pages | id, owner_id, slug, status, current_version_id, deleted_at | Owner bất biến; unique slug; unique owner cho trang chưa xóa |
| page_drafts | page_id, content JSON, revision, template_version, updated_at | Một nháp/page; compare-and-swap revision |
| page_versions | id, page_id, source_revision, content_snapshot, renderer_version, created_at | Bất biến; snapshot đầy đủ, không ghép global runtime |
| system_tracks | id, title, asset_path, active | Hai ID mặc định được bảo vệ |
| media_assets | id, owner_id, page_id, mime, bytes, storage_key, status | Storage private; upload staged/attached/deleted |
| media_references | asset_id, draft_id hoặc version_id | Kiểm tra cùng page/owner; dùng để dọn file an toàn |
| birthday_wishes | id, page_id, user_id, content, created_at | Chỉ chủ trang; cascade/chính sách xóa |
| idempotency_records | user_id, page_id, key, request_hash, result_version_id | UNIQUE theo user/page/key; giữ tối thiểu 24 giờ |
| audit_events | actor_id, action, resource_id, result, request_id, created_at | Không lưu payload riêng |
| page_shares | id, page_id, token_hash, token_ciphertext, key_version, generation, expires_at, revoked_at | Một active/page; token mã hóa để owner tải lại cùng QR, khóa mã hóa ở server; hash dùng kiểm tra; không trả ciphertext cho viewer |
| viewer_sessions | id_hash, share_id, share_generation, version_id, expires_at | Phiên opaque, không user role; kiểm tra share/page/owner mỗi request; nhiều grant tách theo share ID |

Thao tác share có idempotency record riêng theo owner/page/action/key. Quyền viewer còn hạn được coi là tham chiếu tạm tới version/media: job dọn không xóa file đang cấp cho phiên xem. Hết 30 phút phải exchange lại để lấy current version. Khi xóa/thu hồi thì không giữ quyền chỉ vì còn tham chiếu tạm.

Content JSON chứa cardData, surpriseCards, memories và playlist (tham chiếu system_track_id/media_id hoặc link ngoài, thứ tự, enabled). Kiểm tra schema và tham chiếu ở server trước commit. Media được quản lý bằng ID, không nhận đường dẫn storage tùy ý từ client.

## 5. Hợp đồng API dự kiến

| Endpoint | Quyền và hành vi |
|---|---|
| POST /api/auth/register | Khách; email/password/confirmation/captchaToken; trả 202 thông báo chung nếu request hợp lệ |
| POST /api/auth/verify-email; POST /api/auth/resend-verification | Consume token; resend trả thông báo chung có rate limit |
| POST /api/auth/login; GET /api/auth/me; POST /api/auth/logout | Tạo/đọc/thu hồi phiên; me có thể trả pending để hiển thị xác minh |
| POST /api/auth/forgot-password; POST /api/auth/reset-password | Thông báo chung khi xin reset; validate và consume token một lần |
| POST /api/auth/change-password | Đăng nhập, mật khẩu cũ, mật khẩu mới; thu hồi mọi phiên, yêu cầu đăng nhập lại |
| GET /api/templates/current; GET /api/system-tracks | Dữ liệu hệ thống sạch, không trả nội dung legacy |
| GET /api/pages; POST /api/pages | User active; list theo owner, tạo nháp một lần; 409 nếu đạt giới hạn |
| GET /api/pages/:id/draft; PUT /api/pages/:id/draft | Owner; PUT có expectedRevision, trả revision mới |
| GET /api/pages/:id/preview | Owner; render/read nháp đã lưu |
| POST /api/pages/:id/generate | Owner; expectedRevision và Idempotency-Key; trả versionId, URL, sourceRevision |
| GET /api/pages/:id; GET /api/pages/:id/versions/:versionId | Owner; snapshot hiện hành hoặc phiên bản còn giữ; không có snapshot trả 409 PAGE_NOT_GENERATED |
| GET /p/:slug | UI có auth gate; chỉ lấy snapshot sau khi API xác nhận owner |
| DELETE /api/pages/:id | Owner; soft delete đồng bộ; API gọi lặp không tạo tác dụng phụ |
| POST /api/pages/:id/media | Owner; upload và giữ quota atomically; nhận media ID |
| GET, HEAD /api/media/:id; DELETE /api/media/:id | Owner; GET hỗ trợ Range sau auth; DELETE đang được tham chiếu trả 409 MEDIA_IN_USE |
| POST, GET /api/pages/:id/wishes | Owner; tạo/list riêng của trang |
| PATCH /api/admin/users/:id/status; PUT /api/admin/templates/current; PUT /api/admin/system-tracks/:id | Chỉ admin; không cho xóa/ghi đè file nhạc gốc; audit |
| GET /api/pages/:id/share | Owner; trạng thái và link/QR hiện hành; giải mã token tại server nếu active, private,no-store |
| POST /api/pages/:id/share | Owner; bật share với expiresAt tùy chọn và idempotency key; chưa generate trả 409; đang active trả lại share hiện tại |
| POST /api/pages/:id/share/rotate; DELETE /api/pages/:id/share | Owner; rotate cấp mã mới, revoke chặn mã/phiên cũ; có CSRF, idempotency; khóa đồng bộ với generate/delete |
| GET /s/:shareId | Shell viewer không chứa nội dung; fragment key do client đọc để exchange; không auth gate tài khoản |
| POST /api/viewer/:shareId/exchange | Nhận token trong body, kiểm tra hash/status/expiry/owner/page; cấp cookie viewer theo path /api/viewer/:shareId, Secure/HttpOnly/SameSite=Lax; không cấp cookie tài khoản |
| GET /api/viewer/:shareId/page | Viewer hợp lệ; trả DTO snapshot chốt tại exchange, không nháp/owner email/lịch sử/token |
| GET, HEAD /api/viewer/:shareId/media/:assetId | Viewer hợp lệ và asset thuộc đúng version cấp; hỗ trợ Range; không cho PUT/POST/DELETE |

Sau exchange, xóa fragment bằng replaceState; không xóa cookie owner. Request exchange kiểm tra Origin cùng ứng dụng và rate limit; cookie theo shareId tránh mở hai QR ở hai tab ghi đè nhau. Cookie bị chặn: báo hướng dẫn mở bằng Safari/Chrome và quét/bấm lại link gốc, không yêu cầu tạo tài khoản. Refresh cùng tab dùng cookie còn hạn; mở link không có fragment và không có cookie hợp lệ chỉ hiện hướng dẫn quét lại QR.

API viewer lỗi quyền trả 404 chung (share sai/hết hạn/thu hồi/owner khóa/page xóa), phiên viewer thiếu/hết hạn trả 401 VIEWER_SESSION_REQUIRED kèm hướng dẫn quét lại; không dùng redirect login tài khoản. Page và media đều kiểm tra cùng chính sách. Với nội dung đang mở, kiểm tra trạng thái qua request page mỗi 30 giây và khi tab trở lại foreground để dừng player/xóa state nếu mất quyền; khoảng giữa hai lần kiểm tra không bảo đảm thu hồi pixel đã hiển thị.

Phản hồi lỗi thống nhất `{ error: { code, message, fields?, requestId } }`. Mã lỗi: 400 request hỏng, 401 chưa đăng nhập, 403 pending/admin không đủ quyền, 404 không sở hữu/không tồn tại, 409 conflict/quota/trạng thái, 413 quá dung lượng, 415 định dạng không hỗ trợ, 422 dữ liệu nghiệp vụ sai, 429 vượt hạn mức, 503 phụ thuộc tạm lỗi. Request hợp lệ đăng ký trùng email vẫn trả thông báo chung; chưa kiểm tra email trùng trước khi CAPTCHA được xác minh.

Các API cũ `/api/editor-session`, `/api/content-settings`, `/api/tracks`, `/api/card`, `/api/content-media`, `/api/wishes` phải được gỡ hoặc chuyển thành adapter có cùng auth/ownership; không giữ endpoint đọc global làm fallback. `/api/tracks` chỉ được tồn tại công khai nếu trả đúng catalog nhạc hệ thống sạch.

## 6. Chiến lược migration

1. Backup schema, dữ liệu và file; lập inventory, checksum và số lượng; chọn tài khoản nhận dữ liệu legacy bằng mapping tường minh.
2. Tạo schema mới, import trong môi trường staging; tạo trang legacy đầy đủ thay vì chỉ import cardData. Nếu nhiều card cũ, đưa vào báo cáo ngoại lệ để chủ dự án quyết định mapping/lưu trữ, không âm thầm bỏ hoặc vi phạm hạn mức.
3. Tách hai file nhạc hệ thống; chuyển ảnh/nhạc cá nhân khỏi public hoặc URL từng cache công khai; đổi ID/URL và khóa nguồn cũ. Kiểm tra media references, ownership và quota legacy; dữ liệu vượt quota không bị xóa tự động.
4. Chạy bộ test P0, đối chiếu số liệu, thử restore. Khi cutover tạm chặn ghi, chốt dữ liệu lần cuối, vô hiệu cookie editor cũ, đóng API cũ, xóa cache trình duyệt phiên bản cũ rồi mở luồng mới.
5. Nếu rollback, chặn truy cập/ghi trước; khôi phục bản đã kiểm chứng và vẫn khóa endpoint công khai. Không rollback bằng cách mở lại dữ liệu riêng ra public.

6. Dữ liệu legacy mặc định chưa chia sẻ, không tự tạo link QR. Owner kiểm tra bản đã tạo rồi chủ động bật chia sẻ. Giữ HTTPS/domain ổn định sau phát hành vì QR đã in gắn với domain; chuyển domain cần duy trì domain cũ và luồng redirect được kiểm thử bảo toàn fragment, không dùng redirect qua bên thứ ba.
