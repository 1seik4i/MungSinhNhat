# React state, router và hooks

- `PlatformApp.jsx`: data router `createBrowserRouter`, khai báo bằng `Route`, render `RouterProvider`; `/s/:id` lấy share ID bằng `useParams`.
- `AccountPortal.jsx`: `useState` giữ session/page/config; `useCallback` tải tài khoản; `useEffect` tải lúc mở; `useLocation` xác định trang đăng nhập/đăng ký/reset; `Navigate` đưa chủ tài khoản vào editor.
- `CreatorWorkspace.jsx`: state quản lý nội dung đã lưu, trạng thái xử lý, lỗi và QR. Navbar dùng `NavLink`, mở thử dùng `Link`; không điều hướng các bước bằng setState nữa.
- `hooks/useCreatorNavigation.js`: custom hook kết hợp `useLocation`, `useNavigate`, `useBlocker`, `useEffect` và `useRef`. Rời editor bằng navbar hay Back/Forward đều chờ lưu, thất bại thì chặn chuyển và giữ nội dung.
- `AccountEditor.jsx`: dùng ref cho revision và các thao tác đang chạy; imperative handle cho phép lớp điều hướng yêu cầu lưu; editor được giữ mounted khi đổi route để bảo toàn form.
- `App.jsx`: chỉ nhận nội dung đã được cấp quyền qua props; giữ FE chuẩn ZIP. Routing và state tài khoản không được nhúng vào component trình bày.

Đường dẫn: `/login`, `/register`, `/forgot-password`, `/verify-email`, `/app/edit`, `/app/preview`, `/app/qr`, `/s/:id`. Link xác minh/reset cũ qua fragment vẫn tương thích. Refresh URL app tải lại session và bản nháp server; thay đổi chưa lưu chỉ ở bộ nhớ và có cảnh báo khi rời trình duyệt.

Test DOM dùng data memory router để kiểm tra đường dẫn, navbar, Back/Forward, lưu trước khi xem/QR và giữ form khi lưu lỗi. Không thay đổi quyền xem/chỉnh sửa, thời hạn QR hoặc cấu hình CAPTCHA.
