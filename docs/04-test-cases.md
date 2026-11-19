# Test cases và nghiệm thu

Trạng thái tất cả: **Not run**. Đây là bộ ca kiểm thử thiết kế trước triển khai, không phải kết quả chạy trên ứng dụng hiện tại.

## 1. Tiền điều kiện và dữ liệu

- Staging có database/media riêng, cấu hình email/CAPTCHA thử nghiệm. Có thể giả lập provider lỗi trong test, production không cho bypass.
- A và B là user active đã xác minh; P pending; S suspended; AD admin không sở hữu trang A. Chuẩn bị trang A/B với tên, ảnh, nhạc và điều ước khác biệt dễ nhận biết.
- A có nháp revision r1 và snapshot v1; trình duyệt A có hai tab. Có client API độc lập sửa path/body/header và cookie.
- Chuẩn bị người nhận R không có tài khoản, QR A/B khác nhau, share active/expired/revoked, phiên viewer theo từng share. Các ca TC-A/TC-S cũ mặc định không có QR/cookie viewer hợp lệ và đang gọi khu vực quản lý; quyền xem qua QR kiểm tra riêng ở TC-Q. User pending/suspended không có quyền owner nhưng có thể xem share hợp lệ của một owner active khác như khách.
- Chuẩn bị file hợp lệ, sai MIME/đuôi, file hỏng; ảnh 5 MiB và +1 byte, audio 15 MiB và +1 byte, ảnh 20 megapixel và vượt mức. Byte dưới đây dùng MiB như requirements.
- Mỗi ca độc lập, reset fixture khi thay đổi trạng thái. Dùng test clock cho timeout/token; không chờ thời gian thật. Ghi actual result, pass/fail, môi trường, build và bằng chứng khi chạy.

## 2. Tài khoản và CAPTCHA

| ID | P | Liên kết | Bước thực hiện | Kết quả mong đợi |
|---|---|---|---|---|
| TC-A01 | P0 | FR-01,02 | Đăng ký email mới, password hợp lệ, CAPTCHA hợp lệ; mở email xác minh; đăng nhập | Một user pending rồi active; dashboard rỗng; không có dữ liệu A/B |
| TC-A02 | P0 | FR-01 | Đăng ký hai lần với email khác hoa/thường/khoảng trắng đầu cuối, gồm hai request đồng thời | Tối đa một user; thông báo chung, không lộ email tồn tại |
| TC-A03 | P0 | FR-01 | Thử password dài 11/12/128/129 code point; Unicode và khoảng trắng; confirmation khác | Chấp nhận 12/128 và giữ nguyên giá trị; từ chối 11/129/không khớp; không trim password |
| TC-A04 | P0 | FR-01 | Gửi register trực tiếp với CAPTCHA thiếu/sai/hết hạn/hostname sai/action sai/tái sử dụng | Tất cả bị từ chối; không user/session mới; không chỉ kiểm tra frontend |
| TC-A05 | P0 | FR-01; NFR-10 | Giả lập provider CAPTCHA timeout/mất kết nối | Không tạo tài khoản, lỗi thử lại rõ ràng; không bypass |
| TC-A06 | P0 | FR-02 | Dùng link verify đúng, dùng lại, dùng link hết 24 giờ, xin link mới | Chỉ lần đầu hợp lệ đổi trạng thái; link cũ không dùng lại; gửi lại có giới hạn |
| TC-A07 | P0 | FR-03,12 | Đăng nhập P/S rồi gọi dashboard/page/media trực tiếp | P chỉ được xác minh; S không có quyền; không có payload riêng |
| TC-A08 | P0 | FR-03 | Login sai password và email không tồn tại | Cùng mã/trạng thái thông báo lỗi; không trả chi tiết định danh |
| TC-A09 | P0 | FR-01–04 | Vượt từng hạn mức đăng ký/login sai/resend/reset, gọi từ hai instance | 429 + Retry-After nhất quán; hết cửa sổ được thử lại; không khóa vĩnh viễn |
| TC-A10 | P0 | FR-04 | Logout, dùng lại cookie cũ; mô phỏng idle 30 phút và tuổi phiên 7 ngày | Cookie cũ/hết hạn bị 401; UI về login, không hiện trang đã cache |
| TC-A11 | P0 | FR-04 | Xin reset email có/không tồn tại; dùng token hợp lệ, dùng lại/hết 30 phút; thử phiên cũ | Thông báo xin reset chung; token một lần; phiên cũ bị thu hồi, mật khẩu cũ không login được |
| TC-A12 | P0 | FR-04 | Đổi mật khẩu với mật khẩu cũ sai rồi đúng; thử mọi phiên trên thiết bị khác | Sai không đổi; đúng thu hồi mọi phiên, yêu cầu login lại |
| TC-A13 | P0 | FR-01,02; NFR-10 | Email provider lỗi sau tạo user; retry gửi rồi đăng ký lại | Không nhân đôi user; có trạng thái chờ/retry; user nhận được hướng dẫn gửi lại |

## 3. Quyền riêng tư và an toàn

| ID | P | Liên kết | Bước thực hiện | Kết quả mong đợi |
|---|---|---|---|---|
| TC-S01 | P0 | FR-12; NFR-01 | Khách mở URL trang A và gọi mọi API riêng | UI login, API 401; không có tên/ảnh/lời chúc trong HTML/metadata |
| TC-S02 | P0 | FR-12 | B thay ID/slug của A ở list/detail/draft/preview/generate/version/wishes/delete | 404 giống ID không tồn tại; không đọc/ghi/xóa được A; list không có A |
| TC-S03 | P0 | FR-12,13 | B hoặc khách đọc media A bằng GET/HEAD/Range và thử DELETE | B 404, khách 401; không byte/metadata nhạy cảm; dữ liệu vẫn nguyên |
| TC-S04 | P0 | FR-06,08,10,13 | B gửi owner_id=A, page_id=A, media_id A, versionId của A trong body | Server từ chối/gỡ trường không cho phép theo schema; không chiếm quyền, không gắn media A |
| TC-S05 | P0 | FR-12,18 | Gọi toàn bộ route cũ với cookie cũ; thử ?edit=1, ?card=A, ?name=... | Không bypass auth/owner; không fallback nội dung chung hoặc lộ dữ liệu legacy |
| TC-S06 | P0 | FR-04,12; NFR-03 | A xem trang rồi logout, Back/Forward, login B trên cùng browser, mất mạng | Không hiện lại nội dung A; không fallback localStorage/IndexedDB cũ; player/object URL bị dọn |
| TC-S07 | P0 | FR-12; NFR-02 | Gửi mutation từ origin ngoài, thiếu/sai CSRF; thử return URL ngoài | Bị chặn, không thay đổi dữ liệu; return URL chỉ chấp nhận nội bộ |
| TC-S08 | P0 | FR-07,13; NFR-02 | Nhập script/HTML trong tên/lời chúc/caption; URL javascript:/data:/file:, localhost/private IP | Văn bản hiển thị an toàn, không chạy code; URL cấm bị 422 |
| TC-S09 | P0 | FR-17 | AD đọc trang/media A; user A gọi API admin; AD khóa A đang online | AD không đọc A; A bị 403 với admin API; phiên A mất quyền ngay request tiếp theo |
| TC-S10 | P0 | NFR-02,03,09 | Kiểm tra cookie/cache/header, HTML source/sitemap/log/error; gây lỗi có chứa token/payload | Cookie đúng cờ, private no-store, không lộ bí mật/nội dung riêng; audit chỉ metadata cho phép |

TC-S02/S03/S05 phải chạy thành ma trận method × endpoint × actor; không chỉ thử một URL mẫu. Đối chiếu snapshot database và hash file trước/sau để chứng minh yêu cầu bị chặn không gây thay đổi.

## 4. Nháp và tạo trang

| ID | P | Liên kết | Bước thực hiện | Kết quả mong đợi |
|---|---|---|---|---|
| TC-P01 | P0 | FR-05,06 | A mới mở dashboard, tạo trang; kiểm tra B | Nháp trắng/mẫu sạch, hai bài mặc định; không lấy nội dung B/legacy |
| TC-P02 | P0 | FR-06 | Gửi hai request tạo trang đồng thời cho cùng user | Một trang hoạt động, request còn lại 409; không orphan nháp/media |
| TC-P03 | P0 | FR-07,08 | Nhập đủ mọi nhóm nội dung, sắp ảnh/nhạc, lưu, tải lại từ thiết bị khác | Các giá trị/thứ tự/flags khớp server; không phụ thuộc cache thiết bị |
| TC-P04 | P0 | FR-07,10 | Lưu nháp thiếu trường; generate với tên trống/ngày sai/năm nhuận sai/ngày tương lai/lời chúc trống | Nháp rỗng lưu được; generate 422 đúng trường, không tạo snapshot |
| TC-P05 | P0 | FR-07 | Với từng trường thử giới hạn N và N+1, Unicode; album/playlist 100 và 101 | Biên hợp lệ được nhận; vượt bị từ chối cả API; không cắt âm thầm |
| TC-P06 | P0 | FR-08; NFR-05 | Hai tab r1, tab 1 lưu r2, tab 2 lưu với r1 | Tab 2 nhận 409, r2 còn nguyên; UI có cách xử lý xung đột |
| TC-P07 | P0 | FR-09–11 | Lưu r2, preview, generate; mở URL bằng tài khoản đúng | Preview khớp r2; snapshot có đủ card/quà/album/playlist, URL riêng hoạt động |
| TC-P08 | P0 | FR-08,10,11 | Từ v1 sửa nháp r2; mở trang, sau đó generate lại | Trước generate vẫn v1; sau generate toàn bộ r2, cùng URL; dashboard bỏ cờ chưa tạo lại |
| TC-P09 | P0 | FR-10 | Generate expectedRevision cũ hoặc sửa chưa lưu ở UI | Request revision cũ 409; UI yêu cầu lưu thành công, không tạo từ dữ liệu chưa lưu |
| TC-P10 | P0 | FR-10; NFR-05 | Nhấp đúp/retry cùng key, rồi dùng key đó với payload khác | Cùng payload chỉ có một version/kết quả; khác payload 409 |
| TC-P11 | P0 | FR-10; NFR-05 | Giả lập lỗi DB giữa insert version và cập nhật current_version | Rollback; URL vẫn v1; không phiên bản nửa vời; retry được |
| TC-P12 | P0 | FR-08,10; NFR-10 | Mất mạng khi lưu/generate và khi response bị mất sau commit; retry | Không báo thành công giả; retry key lấy đúng kết quả đã commit; không trùng version |
| TC-P13 | P0 | FR-17 | Admin cập nhật mẫu, tạo user/trang mới; xem nháp/snapshot đã tồn tại | Trang mới dùng mẫu mới; nội dung/renderer version cũ không đổi ngoài ý muốn |
| TC-P14 | P0 | FR-16 | Hủy rồi xác nhận xóa; mở URL/media/versions cũ; tạo trang mới | Hủy giữ nguyên; xác nhận mất quyền ngay; tạo trang mới được; dọn dữ liệu đúng hạn |
| TC-P15 | P0 | FR-10,16 | Generate đồng thời với lưu hoặc xóa trang | Transaction/locking giữ nhất quán; không hồi sinh trang đã xóa, không publish revision khác yêu cầu |
| TC-P16 | P0 | FR-10,13 | Generate 11 lần không có viewer session cũ; chạy job dọn phiên bản/media | Giữ tối đa 10 bản gồm current; file current/nháp còn nguyên; bản đã dọn không đọc được; ngoại lệ phiên xem kiểm tra tại TC-Q17 |

## 5. Nhạc, upload và trải nghiệm

| ID | P | Liên kết | Bước thực hiện | Kết quả mong đợi |
|---|---|---|---|---|
| TC-M01 | P0 | FR-14 | Tạo trang mới, phát từng bài mặc định; kiểm tra ID/file | Cả hai bài gốc phát được, đúng tên và nguồn, không trùng playlist |
| TC-M02 | P0 | FR-14 | A sắp xếp/tắt hết/khôi phục playlist; kiểm tra B/catalog | Tắt hết thì im lặng, không fallback; khôi phục đủ hai bài; B/catalog không đổi |
| TC-M03 | P0 | FR-13 | Upload ảnh/audio hợp lệ, gắn vào nháp, generate và mở ở thiết bị khác | Phát/hiển thị được qua auth; thứ tự đúng, tài nguyên gắn owner/page chính xác |
| TC-M04 | P0 | FR-13 | Upload file đúng biên và vượt 1 byte, hỏng, MIME giả, ảnh vượt pixel | Nhận biên hợp lệ; trả đúng 413/415/422; không lưu file lỗi hay cộng quota |
| TC-M05 | P0 | FR-13 | Upload đồng thời khi quota gần đầy; upload chưa attach rồi chạy dọn sau 24 giờ | Không vượt 300 MiB; request dư thất bại rõ ràng; orphan được dọn, quota được trả |
| TC-M06 | P0 | FR-13 | Gỡ ảnh/nhạc nháp đang dùng trong v1; thử DELETE file; mở v1 | File vẫn phục vụ v1; DELETE trả 409; chỉ dọn sau hết mọi tham chiếu |
| TC-M07 | P0 | FR-13,14 | Thêm HTTPS/YouTube hợp lệ rồi thử link hỏng; kiểm tra network server | Link hợp lệ được lưu/phát khi provider cho phép; lỗi bài có thông báo/đổi bài; server không fetch URL tùy ý |
| TC-M08 | P0 | FR-15 | Mở phong thư, quà, fortune, album, tắt nến bằng chạm, gửi điều ước | Nội dung đúng snapshot; điều ước lưu đúng A/page A, không global |
| TC-M09 | P0 | FR-15 | Thử mic cho phép/từ chối/không hỗ trợ; đang phát và đang pause trước bật mic | Luôn có chạm nến; tạm dừng/resume đúng trạng thái trước mic; dừng track mic sau dùng; không upload âm thanh |
| TC-M10 | P0 | FR-14,15; NFR-07 | Trình duyệt chặn autoplay, mở trang rồi tương tác, mute/seek/next và thu gọn player | Không lỗi luồng; phát sau tương tác hợp lệ; controls hoạt động |

## 6. Vận hành, hồi quy và nghiệm thu

| ID | P | Liên kết | Bước thực hiện | Kết quả mong đợi |
|---|---|---|---|---|
| TC-O01 | P0 | NFR-04 | Load test 50 phiên, dữ liệu chuẩn lớn, 10 phút; đo metadata và generate | Đạt p95/tỷ lệ lỗi theo yêu cầu; không trộn dữ liệu giữa phiên |
| TC-O02 | P0 | NFR-06,07 | Luồng chính tại 360px/tablet/desktop, keyboard, reduced-motion, các browser đã định | Không mất thao tác/nội dung; label/focus/lỗi đọc được, giảm chuyển động có hiệu lực |
| TC-O03 | P0 | FR-18 | Dry-run import bộ legacy gồm media inline/file/card rời, thiếu owner, vượt quota | Đối chiếu đủ số lượng/checksum; báo ngoại lệ; không import nhầm owner, không tự bỏ dữ liệu |
| TC-O04 | P0 | FR-18; NFR-01 | Cutover thử, dùng cookie/link media/API cũ; thử rollback | Không còn đường public tới dữ liệu riêng; rollback không mở lại nguồn công khai |
| TC-O05 | P0 | NFR-08 | Backup/restore trong môi trường cô lập; có trang đã xóa sau backup | Đạt RPO/RTO; áp lại danh sách xóa, trang đã xóa không xuất hiện lại |
| TC-O06 | P0 | FR-16; NFR-09 | Tăng test clock qua hạn media/phiên bản/xóa/log/backup; chạy job nhiều lần | Dọn đúng chính sách 24h/10 bản/30 ngày/90 ngày/35 ngày; job lặp an toàn; không xóa tài nguyên còn dùng |
| TC-O07 | P1 | FR-19 | Xóa tài khoản A với xác nhận sai/đúng; dùng phiên cũ, kiểm tra B và job dọn | Sai không xóa; đúng thu hồi A và dọn đúng hạn; B nguyên vẹn |

## 7. Điều kiện hoàn thành

- Mọi FR P0 có test tương ứng trong bảng; mọi test P0 phải pass, đặc biệt ma trận quyền và migration. FR-19/TC-O07 có thể để phiên bản sau nếu chưa cung cấp xóa tài khoản.
- Không còn lỗi làm lộ dữ liệu, vượt ownership, mất dữ liệu đã lưu hoặc bypass CAPTCHA. Không nghiệm thu chỉ bằng demo giao diện.
- Chạy build frontend, kiểm thử tích hợp API trên database thật dành cho test, E2E luồng đăng ký → xác minh → sửa → generate → mở riêng → logout; dùng mock cho lỗi provider và một smoke test provider ở staging.
- E2E bổ sung generate → bật QR → người nhận chưa đăng nhập quét xem → cập nhật giữ QR → thu hồi/đổi QR; mọi test TC-Q là P0 bắt buộc, kể cả media HEAD/Range và kiểm tra điện thoại thật.
- Đối chiếu hai file nhạc mặc định trước/sau; diễn tập backup/restore và migration; lưu bằng chứng kết quả theo build.
- Chốt D-01 đến D-07 trong tài liệu phạm vi, cấu hình production, chủ sở hữu dữ liệu legacy và người phụ trách vận hành trước khi phát hành.

Mẫu ghi nhận thực thi: `TC ID | build | môi trường | ngày chạy | người chạy | actual result | pass/fail | bằng chứng | bug ID`. Chỉ chuyển Not run sang Pass sau khi có kết quả thực tế.

## 8. QR và người nhận (bổ sung v0.2)

Tất cả ca dưới đây là **Not run**, ưu tiên P0.

| ID | Liên kết | Bước thực hiện | Kết quả mong đợi |
|---|---|---|---|
| TC-Q01 | FR-20 | A chưa generate thử bật QR, sau đó generate rồi bật | Chưa có snapshot nhận 409; sau generate có đúng một share/link/QR; generate đơn thuần chưa bật chia sẻ |
| TC-Q02 | FR-20,21; NFR-11 | R dùng Android/iOS chưa đăng nhập quét PNG đã tải và bản in; mở link trên cùng điện thoại | Xem đúng trang A không đăng nhập/CAPTCHA; có link thay thế khi không quét được |
| TC-Q03 | FR-20,21 | Quét một QR nhiều lần, hai thiết bị; chuyển tiếp link cho B đang login | Tất cả xem được nếu share còn hạn; B chỉ có quyền xem, không thành owner |
| TC-Q04 | FR-21,23 | R dùng viewer gọi edit/draft/preview/list/versions/upload/generate/delete/admin và wish POST | Không có quyền quản lý/ghi/list; điều ước khách chỉ trong tab; A không bị sửa |
| TC-Q05 | FR-23 | Viewer A đọc ảnh/audio bằng GET/HEAD/Range; thử asset B, asset chỉ trong nháp A, asset phiên bản khác chưa cấp | File được cấp đọc/phát đúng; file ngoài snapshot bị chặn, không lộ metadata |
| TC-Q06 | FR-20–22 | A lưu nháp r2 chưa generate; R quét; sau đó A generate v2, R quét lại | Ban đầu v1, sau đó v2; QR không đổi; phiên đang xem v1 không trộn với v2 |
| TC-Q07 | FR-22,23 | A thu hồi khi R đang xem/phát nhạc; thử page/HEAD/Range và chờ kiểm tra quyền UI | Request tiếp theo bị chặn, UI dừng nhạc/xóa state khi nhận lỗi; link cũ không mở lại được |
| TC-Q08 | FR-22 | A rotate QR, R dùng mã cũ/cookie cũ và mã mới; A tắt rồi bật lại | Chỉ mã mới hợp lệ; mã và mọi phiên cũ không sống lại |
| TC-Q09 | FR-22 | Share có expiresAt, dùng test clock ngay trước/đúng thời điểm hết hạn | Trước hạn xem được; từ đúng thời điểm hết hạn bị chặn; thông báo không cần login |
| TC-Q10 | FR-22 | A logout/đổi mật khẩu rồi quét; tiếp theo admin khóa/mở khóa A và quét mã cũ | Logout/đổi password không tắt QR; khóa thu hồi, mở khóa không hồi sinh QR cũ |
| TC-Q11 | FR-16,22 | Xóa trang/account A; quét link và gọi media với viewer cookie cũ | Mất quyền ngay; không resurrect share khi tạo lại trang mới |
| TC-Q12 | FR-20; NFR-12 | Kiểm tra payload QR, access/error log, analytics, Referer, metadata và network lúc tạo/mở QR | URL HTTPS đúng domain; không có localhost/quyền sửa; token không tới log hoặc dịch vụ QR/analytics bên thứ ba |
| TC-Q13 | FR-20 | Quay lại dashboard tải QR hiện hành; retry bật/rotate cùng key sau mất response | Link/QR giống hiện hành, không tự xoay; mỗi operation có một kết quả; token không plaintext trong DB |
| TC-Q14 | FR-21; NFR-12 | Mở QR A và B ở hai tab, refresh, hết phiên 30 phút; chặn cookie trong webview | Không ghi đè nhầm grant/nội dung; refresh còn phiên hoạt động; hết phiên/quét lại có hướng dẫn; cookie bị chặn hướng dẫn mở trình duyệt |
| TC-Q15 | FR-21 | R mở phong thư/play/next/seek/quà/album; mic bị chặn; nhập điều ước rồi đóng tab | Trải nghiệm đúng snapshot, autoplay có nút thay thế, chạm tắt nến được; không request lưu điều ước/âm thanh |
| TC-Q16 | FR-20–23 | Exchange token sai, shareId khác, spam vượt hạn mức; gây lỗi DB/mạng | Không lộ trang, rate limit 429; lỗi dịch vụ 503/thử lại không giả thành link bị thu hồi; không fallback trang khác |
| TC-Q17 | FR-22,23 | Đồng thời exchange với rotate/revoke/delete/generate, dọn phiên bản khi v1 còn phiên viewer | Không cấp quyền sau revoke/delete; session version nhất quán; không dọn file đang cấp trước khi hết phiên |
| TC-Q18 | FR-20,21; NFR-11 | Dùng QR tải xuống sau deploy, trong trình duyệt nhắn tin, thử mở bằng Safari/Chrome; nếu đổi domain thử redirect | Giữ fragment/token đến exchange; QR mở đúng ứng dụng, không mất key; không chuyển token qua domain ngoài không được tin cậy |
