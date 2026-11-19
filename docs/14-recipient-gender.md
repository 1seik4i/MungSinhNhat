# Câu chữ theo giới tính người nhận

- Thông tin thiệp có lựa chọn Nam/Nữ dưới dạng radio hai ô, hỗ trợ bàn phím và label.
- Lưu `cardData.gender` là `male`/`female` trong nháp và snapshot. API từ chối giá trị không hợp lệ; thiệp cũ chưa có lựa chọn dùng cách xưng hô trung tính “bạn”.
- Context và hook `useRecipientCopy` dùng thống nhất cách gọi “anh” với Nam, “em” với Nữ cho nhãn ngày sinh, lời dẫn quà/quẻ, thông báo thổi nến và gợi ý lời chúc.
- Lời chúc, tên quà, mô tả quà và nội dung user tự viết không bị thay khi đổi lựa chọn. Mô tả quà mặc định chỉ được đổi cách gọi khi vẫn nguyên nội dung mẫu. Không sửa nghĩa 100 quẻ nguồn theo giới tính.
- Chọn giới tính → lưu → xem thiệp; thiệp đã chia sẻ phải được cập nhật ở bước QR để người nhận thấy thay đổi.

Kiểm thử: radio không ghi đè lời chúc, render đúng nhãn anh/em; API chấp nhận Nam/Nữ, tương thích dữ liệu cũ và từ chối giá trị khác. Build và hồi quy Playwright desktop/mobile được chạy lại.
