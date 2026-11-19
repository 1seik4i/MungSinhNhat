# Business rules

Các quy tắc dưới đây là đề xuất cho hệ thống đích. Quyền riêng tư và nhạc mặc định là yêu cầu trực tiếp từ người dùng; hạn mức và chính sách tài khoản là thiết kế đề xuất.

## 1. Vai trò và quyền

| Hành động | Khách | User chưa xác minh | Chủ trang đã xác minh | User khác | Admin |
|---|---|---|---|---|---|
| Đăng ký/đăng nhập/khôi phục mật khẩu | Có | Có | Có | Có | Có |
| Xác minh/gửi lại email của mình | Không | Có | Không cần | Không | Theo tài khoản mình |
| Dashboard/trang/nháp/media/điều ước riêng | Không | Không | Có | Không | Không mặc định |
| Sửa/tạo/xóa trang và media riêng | Không | Không | Có | Không | Không mặc định |
| Xem mẫu trắng và nhạc mặc định | Có | Có | Có | Có | Có |
| Quản lý tài khoản, mẫu, nhạc hệ thống | Không | Không | Không | Không | Có |

Ma trận trên áp dụng khu vực quản lý, URL chủ trang và API riêng. Người bất kỳ có QR/link hợp lệ được xem snapshot được chia sẻ cùng media của snapshot đó, không cần tài khoản; không xem nháp/lịch sử phiên bản/điều ước lưu server và không có quyền chỉnh sửa. Admin có QR hợp lệ cũng chỉ nhận quyền xem này. Admin có tài khoản user thì thao tác nội dung của chính mình theo quyền chủ sở hữu.

## 2. Tài khoản

| Mã | Quy tắc |
|---|---|
| BR-A01 | Email được trim và chuẩn hóa chữ thường, duy nhất tại database; không tự loại dấu chấm hoặc hậu tố `+`. Email tối đa 254 ký tự. |
| BR-A02 | Mật khẩu 12–128 ký tự, cho phép Unicode/khoảng trắng, không tự trim; xác nhận mật khẩu phải khớp. Chỉ lưu hash có salt bằng thuật toán chuyên dụng. |
| BR-A03 | Mọi lần đăng ký phải được backend xác minh CAPTCHA đúng ngữ cảnh đăng ký, hostname cho phép và thời hạn của nhà cung cấp; token không dùng lại. Backend không tin cờ thành công từ frontend. |
| BR-A04 | CAPTCHA sai, hết hạn, thiếu hoặc dịch vụ không khả dụng: không tạo tài khoản/phiên; thông báo thử lại. Không có chế độ bỏ qua CAPTCHA ở production. |
| BR-A05 | Tài khoản mới ở trạng thái pending; link xác minh dùng một lần, hết hạn sau 24 giờ. Chỉ active đã xác minh mới vào khu vực nội dung. |
| BR-A06 | Sai email/mật khẩu trả cùng thông báo. Đăng ký/khôi phục không tiết lộ tài khoản tồn tại; gửi email phù hợp nếu cần. Áp dụng hạn mức theo IP và định danh, tránh khóa vĩnh viễn do người khác cố tình thử sai. |
| BR-A07 | Phiên gắn định danh user, được thu hồi ở server; idle timeout 30 phút, tuyệt đối 7 ngày. Đăng xuất thu hồi phiên hiện tại; đổi/reset mật khẩu thu hồi mọi phiên. Khóa/xóa tài khoản làm mất quyền ở yêu cầu tiếp theo. |
| BR-A08 | Reset password bằng token một lần hết hạn 30 phút; không tự đăng nhập sau reset. Token được lưu dưới dạng hash, không ghi log. |

## 3. Trang và nội dung

| Mã | Quy tắc |
|---|---|
| BR-P01 | Mỗi trang có owner_id bất biến do server lấy từ phiên. Không nhận owner_id từ client; UUID/slug khó đoán không thay thế kiểm tra quyền. |
| BR-P02 | MVP tối đa một trang chưa xóa/user; kiểm soát cả tạo đồng thời tại database. Người nhận được ghi trên thiệp không phải chủ tài khoản. |
| BR-P03 | Khởi tạo nháp từ mẫu hệ thống sạch và hai bài mặc định; tuyệt đối không sao chép nội dung riêng của user khác hoặc dữ liệu legacy chưa gán owner. |
| BR-P04 | Nháp được lưu khi thiếu trường bắt buộc nhưng mọi giá trị có mặt vẫn phải đúng kiểu/giới hạn. Generate yêu cầu tên người nhận, ngày sinh, tiêu đề và lời chúc hợp lệ; không có ảnh vẫn được tạo trang. |
| BR-P05 | Lưu nháp không thay đổi trang đã tạo. Xem trước dùng nháp; URL trang chính đọc snapshot hiện hành. Generate không tự lấy thay đổi chưa lưu: giao diện yêu cầu lưu thành công trước. |
| BR-P06 | Generate chụp toàn bộ cấu hình từ đúng revision đã lưu trong một transaction, chỉ đổi con trỏ phiên bản hiện hành khi thành công. Không trộn tên mới với album/nhạc cũ hoặc nội dung dùng chung. |
| BR-P07 | Sau lần generate đầu, URL chính ổn định. Generate lại tạo phiên bản mới, URL vẫn giữ nguyên. Gửi lặp cùng idempotency key và payload phải trả cùng kết quả; khác payload cùng key bị từ chối. |
| BR-P08 | Hai tab sửa cùng revision: lần lưu sau dùng revision cũ nhận conflict, không ghi đè âm thầm; generate revision cũ cũng bị từ chối. |
| BR-P09 | Xóa trang cần xác nhận rõ tại UI; mọi nháp, snapshot, điều ước và media của trang lập tức mất quyền truy cập. Xóa vật lý trong 30 ngày; bản backup luân chuyển tối đa 35 ngày, không phục vụ dữ liệu đã xóa khi restore. |
| BR-P10 | Điều ước lưu server gắn page_id và user_id từ phiên, chỉ chủ trang được gửi/xem. Người nhận QR được nhập điều ước và xem hiệu ứng ở bộ nhớ của tab, không gửi/lưu server, không dùng localStorage; UI nói rõ “Điều ước chỉ hiển thị trên thiết bị này và không được lưu”. Không ghi âm/lưu âm thanh micro. |
| BR-P11 | Hệ thống chỉ hiển thị đã lưu/đã tạo sau xác nhận server; lỗi mạng không được hiển thị thành công hoặc thay đổi snapshot hiện hành. |
| BR-P12 | Thay đổi mẫu hệ thống không tự sửa nháp hay snapshot cũ. User mới nhận phiên bản mẫu mới. Không có nút sửa HTML/JavaScript tùy ý. |

Trạng thái trang: `DRAFT` (chưa có phiên bản) → `GENERATED` (có snapshot hiện hành) → `DELETED`. Khi đã generate mà tiếp tục sửa, vẫn `GENERATED` kèm cờ “có thay đổi chưa tạo lại”, tính từ draft revision và source revision của snapshot. Generate lỗi giữ nguyên trạng thái trước đó.

## 4. Nhạc và media

| Mã | Quy tắc |
|---|---|
| BR-M01 | Giữ hai bản `default-hieuthuhai-sinh-nhat` và `default-phan-dinh-tung-khuc-hat-mung-sinh-nhat`, nguồn MP3 như hiện tại; mỗi trang mới có cả hai. |
| BR-M02 | User được sắp xếp/bật/tắt bài trong playlist riêng, không xóa/sửa bản nhạc trong thư viện hệ thống. Tắt hết bài đồng nghĩa im lặng, không tự fallback làm nhạc phát lại. Có thao tác khôi phục playlist mặc định. |
| BR-M03 | Upload/gắn/xóa media phải kiểm tra owner. Đọc/HEAD/Range được phép với owner hoặc quyền xem QR hợp lệ nếu media thuộc snapshot mà phiên xem được cấp; không cấp quyền đọc mọi file của cùng owner/page. Không được tham chiếu media user khác. |
| BR-M04 | File mặc định là tài nguyên chung có thể public. Media riêng không dùng URL public vĩnh viễn hoặc cache public; chọn endpoint có auth cho MVP. |
| BR-M05 | Gỡ ảnh/nhạc khỏi nháp không xóa file đang được snapshot hiện hành hoặc phiên bản còn giữ sử dụng. Chỉ dọn file không còn tham chiếu; file upload chưa gắn nội dung được dọn sau 24 giờ. |
| BR-M06 | Giới hạn theo bảng requirements; kiểm tra nội dung file thực tế, không chỉ đuôi/MIME client. Tên file do user cung cấp không trở thành đường dẫn máy chủ. |
| BR-M07 | Giữ hỗ trợ link HTTPS và YouTube; chỉ lưu link, không để server tải URL tùy ý. Link ngoài có thể hỏng và lộ request cho bên cung cấp; UI nêu rõ khi thêm link ngoài. Người muốn media riêng phải upload file. |
| BR-M08 | Phát nhạc theo tương tác người dùng và chính sách trình duyệt; từ chối micro vẫn có thể chạm tắt nến. Bật mic tạm dừng nhạc; kết thúc trả về trạng thái phát trước đó. |

## 5. Bảo vệ dữ liệu

| Mã | Quy tắc |
|---|---|
| BR-S01 | API quản lý, danh sách, nháp, preview, lịch sử và ghi dữ liệu luôn kiểm tra ownership. API xem qua QR dùng quyền chia sẻ riêng, chỉ đọc snapshot/media được cấp. Không có ngoại lệ qua API cũ hoặc query `?card`, `?name`, `?edit`. |
| BR-S02 | API quản lý: không đăng nhập 401, không sở hữu 404, pending 403. UI quản lý chuyển login với return URL nội bộ. Route QR hợp lệ mở trực tiếp không login; link sai/thu hồi/hết hạn trả 404 chung “Liên kết không còn khả dụng”, không tiết lộ tên/ngày sinh hoặc hướng người nhận đi đăng ký. |
| BR-S03 | Không hiện dữ liệu riêng trong HTML khởi tạo, metadata, sitemap, log hay thông báo lỗi. Nội dung riêng dùng Cache-Control private,no-store; logout/đổi user xóa state và cache riêng. Không dùng cache chung hiện tại làm fallback khi auth/network lỗi. |
| BR-S04 | Cookie phiên HttpOnly, Secure ở production và SameSite phù hợp; yêu cầu ghi có bảo vệ CSRF. Nội dung người dùng hiển thị như văn bản an toàn; URL chỉ cho scheme/host được hỗ trợ. |
| BR-S05 | Audit ghi định danh actor, hành động, resource ID, thời gian, kết quả; không ghi mật khẩu, token, lời chúc, điều ước hoặc file riêng. |
| BR-S06 | Dữ liệu cũ phải được gán một owner được chỉ định sau backup/kiểm tra; dữ liệu chưa gán không ai xem được. Cookie admin cũ bị vô hiệu, route public cũ không còn đọc được nội dung riêng. Cache public từng phát ra ngoài không thể thu hồi hoàn toàn; migration phải đổi URL media và ngừng phục vụ URL cũ. |

## 6. Chia sẻ QR

| Mã | Quy tắc |
|---|---|
| BR-Q01 | QR chỉ mã hóa URL HTTPS của ứng dụng với mã chia sẻ ngẫu nhiên tối thiểu 256 bit; không chứa quyền sửa, mật khẩu tài khoản hoặc toàn bộ nội dung. Link và QR cấp cùng quyền xem. |
| BR-Q02 | Chỉ owner active được bật/tắt/đổi mã. Chỉ bật được khi có snapshot hợp lệ. Generate lần đầu không tự bật chia sẻ; UI có nút “Tạo QR để gửi”. |
| BR-Q03 | Một link đang hoạt động/page ở MVP; quét nhiều lần/nhiều thiết bị được, không tiêu thụ một lần. Mặc định không hết hạn; owner có thể đặt ngày hết hạn khi bật. Giao diện ghi rõ ai có link cũng xem được. |
| BR-Q04 | Generate lại giữ QR đang hoạt động, lần mở mới thấy snapshot mới. Phiên đang xem giữ một version cố định để không trộn dữ liệu; phiên xem tối đa 30 phút, sau đó tải lại để lấy bản hiện hành. |
| BR-Q05 | Thu hồi/đổi mã/xóa trang/khóa hoặc xóa tài khoản owner chặn link và mọi phiên xem liên quan ngay ở yêu cầu tiếp theo, cả GET/HEAD/Range. Bật lại sau thu hồi phải sinh mã mới; mã cũ không sống lại kể cả mở khóa tài khoản. Đổi/reset mật khẩu không tự thu hồi QR vì đây là quyền chia sẻ riêng. |
| BR-Q06 | Generate lỗi không đổi QR hoặc snapshot hiện hành. Mất response khi bật/đổi QR không được báo thành công giả; operation dùng idempotency key để retry lấy lại cùng link, không xoay mã liên tiếp. |
| BR-Q07 | QR tạo ngay trong ứng dụng, không gửi link bí mật cho dịch vụ tạo QR bên thứ ba; tải PNG/chép link và thử trên điện thoại thật. Không dùng localhost trong QR gửi người nhận. |
| BR-Q08 | Token chia sẻ không nằm trong access log, analytics, Referer, sitemap hay metadata. Đề xuất URL `/s/:shareId#key=...`, đổi token qua POST lấy cookie viewer HttpOnly; bỏ fragment khỏi thanh địa chỉ sau exchange. Referrer-Policy no-referrer và noindex cho trang xem; không gắn analytics bên thứ ba tại luồng này. |
| BR-Q09 | Quyền viewer chỉ đọc snapshot đã chốt và file được tham chiếu trong snapshot; không nâng thành phiên tài khoản. Không cho viewer sửa, upload, generate, list trang/phiên bản, gọi quản trị hoặc ghi điều ước server. |
| BR-Q10 | Không thể thu hồi ảnh/nhạc/nội dung người nhận đã tải hoặc chụp; thu hồi chỉ chặn yêu cầu tiếp theo. UI đang mở xóa nội dung và dừng media khi phát hiện quyền hết hiệu lực; không tuyên bố xóa dữ liệu đã lưu trên thiết bị. |
