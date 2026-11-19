# Bộ 100 quẻ hệ thống và luồng sau thổi nến

## Nguồn và ý nghĩa dữ liệu

Nguồn đối chiếu: [Chinese Temples Committee — bộ Quan Âm](https://www.ctc.org.hk/chim-search/), đủ trang quẻ 1–100. Mỗi bản ghi giữ số quẻ, tên gốc, cấp thượng/trung/hạ và URL chính xác của trang đó. Đây là một phiên bản xác định; không trộn số quẻ của các bộ Quan Thánh, Quan Âm hoặc phiên bản khác.

Danh mục: `shared/data/guanyin100.json`, phiên bản `ctc-guanyin-100-v1`. Tên tiếng Việt được chuyển từ tên điển tích; phần nghĩa là **diễn giải tiếng Việt do ứng dụng biên soạn**, không phải bản dịch chính thức hay lời giải sao chép từ website. Không sao chép bài thơ hoặc lời giải hiện đại vào ứng dụng; phần tham chiếu đọc nguồn chỉ lưu cục bộ trong `.reference/` được bỏ qua bởi Git. Không tự tạo số may mắn rồi gán cho nguồn. Quẻ hạ vẫn được giữ đúng cấp, lời diễn giải dùng ngôn ngữ định hướng và thận trọng.

Hai script phục vụ đối chiếu và xây danh mục: `scripts/import-fortune-sources.py`, `scripts/build-fortune-catalog.py`. Nguyên liệu tiếng Việt nằm trong `shared/fortune-interpretations.txt`. Đã xác minh 100 trang nguồn, 100 số liên tiếp, 100 ID riêng.

## Tích hợp hệ thống

- PostgreSQL có bảng dùng chung `cms_fortune_catalog(number, version, data)`, seed idempotent 100 bản ghi từ danh mục kiểm soát trong mã. API GET `/api/platform/fortune-catalog` chỉ trả catalogue công khai, không có API sửa quẻ của người dùng.
- Modal lấy catalogue từ database, có đủ 100 quẻ đi kèm ứng dụng làm fallback khi lỗi mạng. Rút ngẫu nhiên đồng đều trong 100 mục, không lọc bỏ quẻ hạ để làm sai bản gốc.
- Editor bỏ toàn bộ tab, danh sách và nút sửa quẻ. PUT nội dung bỏ trường `fortunes` do client gửi, cố định thẻ giới thiệu quẻ và phiên bản hệ thống. Snapshot cũ có quẻ tự nhập cũng không thể thay bộ quẻ hệ thống ở phía xem.
- Kết quả hiển thị số/tên quẻ, cấp quẻ, tên gốc, diễn giải và link tham chiếu mở tab mới không gửi referrer. Không cần người nhận gửi dữ liệu riêng cho website xem quẻ.

## Sửa lỗi giao diện

- Nút quay quà và gieo quẻ xuất hiện ngay khi tất cả nến tắt, bao gồm thổi bằng nút, chạm từng nến hoặc mic (cùng trạng thái candles).
- Các thẻ phía dưới có nội dung fallback; dữ liệu legacy trống không làm ẩn cả hai phần. Quà bị xóa hết vẫn được tôn trọng: chỉ ẩn quay quà, gieo quẻ hệ thống tiếp tục hoạt động.
- Modal quẻ có vùng cuộn, tự giãn nội dung để không cắt nghĩa dài.

## Kiểm tra

- API database thực tế đã trả HTTP 200, đúng phiên bản, 100 bản ghi/100 ID khác nhau.
- Kiểm thử DOM mô phỏng âm thanh và canvas: tắt nến xuất hiện hai nút, callback mở đúng phần; quẻ không còn chỉnh sửa; dữ liệu cũ không tắt bộ hệ thống; fallback hoạt động khi fetch catalogue lỗi.
- Không kiểm thử trực quan hiệu ứng canvas hoặc mic trên điện thoại thật trong đợt này.
