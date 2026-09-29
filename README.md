# 🎂 CMSN - Interactive Birthday Celebration Web App

> **Dự án Web chúc mừng sinh nhật tương tác cao cấp, kết hợp hiệu ứng âm thanh Synthesizer, xử lý âm thanh Micro thời gian thực, hoạt họa Framer Motion và thiết kế Glassmorphism lãng mạn.**

---

## 🌟 1. Tổng Quan Dự Án

**CMSN Birthday Celebration** là một món quà công nghệ độc đáo, mang đến trải nghiệm chúc mừng sinh nhật tương tác trọn vẹn và giàu cảm xúc. Thay vì một tấm thiệp tĩnh đơn điệu, ứng dụng dẫn dắt người nhận qua từng cung bậc cảm xúc: từ lúc hồi hộp mở phong thư sáp niêm phong, thổi nến bằng micro thực tế, đến bẻ bánh may mắn và ngắm nhìn những bức ảnh kỷ niệm Polaroid.

---

## 🎯 2. Các Tính Năng Nổi Bật

### ✉️ 1. Mở màn với Phong Thư Bí Mật (`EnvelopeModal`)
- Phong thư 3D với con dấu sáp niêm phong sang trọng.
- Hiệu ứng mở nắp phong bì, lồng ghép bức thư tay bay bổng và pháo hoa rực rỡ từ hai bên mép màn hình (`launchSideCannons`).
- Hoàn toàn tối ưu co giãn, không bị thanh cuộn thừa trên thiết bị di động.

### 🎂 2. Bánh Kem Tương Tác & Thổi Nến Bằng Micro (`InteractiveCake`)
- Bánh kem sinh nhật dâu tây 3D với 5 ngọn nến lung linh.
- **Thổi nến bằng Micro thông minh**: 
  - Phân tích phổ tần số âm thanh thời gian thực (FFT 512) để nhận diện chính xác xung luồng gió thổi vật lý vào màng mic (< 180Hz), loại bỏ hoàn toàn tiếng ồn môi trường và giọng nói.
  - Tự động tạm dừng nhạc nền khi bật micro để tránh hiện tượng lặp âm và tiếp tục phát nhạc sau khi thổi nến xong.
  - Tích hợp khoảng trễ an toàn (Grace period 750ms) giúp nến không bị tắt đột ngột khi vừa kích hoạt micro.
- Hiệu ứng pháo hoa (`blastConfetti`), mưa sao vàng (`blastStars`) và gửi điều ước bí mật lên vũ trụ.

### 🎵 3. Trình Phát Nhạc Nền Thông Minh (`MusicPlayer`)
- Phát nhạc nền mượt mà (hỗ trợ cả bài hát tùy chỉnh và YouTube Audio).
- **Tự động ẩn/hiện thông minh theo chiều cuộn trang**: 
  - Cuộn trang xuống dưới: Trình phát nhạc tự động trượt hạ xuống và thu gọn thành một thanh mini nổi (pill) tinh tế.
  - Cuộn trang lên trên: Tự động trồi lên hiển thị đầy đủ.
- Có nút bấm thủ công hạ xuống (`ChevronDown`) và mở lên (`ChevronUp`) với hoạt họa mượt mà.

### 🎁 4. Hộp Quà Bí Ẩn & Bánh Quy May Mắn (`GiftBoxModal` & `MiniGamesModal`)
- Hộp quà mở nắp trao gửi thông điệp yêu thương bất ngờ.
- Bánh quy may mắn (Fortune Cookie) tương tác bẻ bánh nhận lời chúc tương lai.

### 📸 5. Triển Lãm Ảnh Kỷ Niệm Polaroid (`PhotoGallery`)
- Trưng bày các khoảnh khắc đáng nhớ dưới dạng ảnh chụp lấy liền Polaroid kèm lời nhắn ngọt ngào.

### 🛠️ 6. Trình Chỉnh Sửa Trực Quan (`EditorPage`)
- Cho phép người tặng cá nhân hóa toàn bộ tên người nhận, ngày sinh, lời chúc, danh sách ảnh kỷ niệm và danh sách bài hát mà không cần sửa code.

---

## 🎤 3. Kịch Bản MC / Lời Dẫn Trải Nghiệm (Presentation Script)

*Dành cho người dẫn chương trình hoặc người tặng khi trình chiếu/hướng dẫn người nhận trải nghiệm trang web:*

```text
[BẮT ĐẦU - MÀN HÌNH HIỂN THỊ PHONG THƯ NIÊM PHONG SÁP ĐỎ]
MC: "Chào em! Hôm nay là một ngày vô cùng đặc biệt — ngày mà một thiên thần đã xuất hiện trên thế giới này. 
Chúng mình có một bức thư bí mật dành riêng cho em. Hãy chạm tay vào dấu sáp đỏ để mở ra điều bất ngờ đầu tiên nhé..."

[KHI PHONG THƯ MỞ RA - PHÁO GIẤY BẮN TƯNG BỪNG]
MC: "Chúc mừng sinh nhật! Bức thư chứa chan những tình cảm ấm áp nhất đã được mở ra. 
Bây giờ, hãy cùng bước vào bữa tiệc sinh nhật nào!"

[CUỘN ĐẾN KHU VỰC BÁNH KEM 3D]
MC: "Trước mắt em là chiếc bánh kem dâu tây ngọt ngào với những ngọn nến đang thắp sáng lung linh. 
Hãy nhắm mắt lại, nghĩ về điều ước tuyệt vời nhất trong tuổi mới của mình... 
Và em có thể bấm 'Bật Micro' để ghé sát và thổi một hơi thật mạnh, hoặc chạm vào từng ngọn nến để dập tắt chúng nhé!"

[KHI NẾN TẮT HẾT - PHÁO HOA VÀ SAO VÀNG BAY LÊN]
MC: "Tuyệt vời! Ngọn nến đã tắt, điều ước của em đã chính thức được gửi lên các vì sao trên bầu trời vũ trụ! 
Chúc cho mọi ước mơ của em trong tuổi mới đều sẽ sớm trở thành hiện thực!"

[KHI XEM ẢNH KỶ NIỆM VÀ MỞ QUÀ]
MC: "Hãy cùng nhìn lại những khoảnh khắc tuyệt đẹp mà chúng ta đã cùng nhau trải qua trong cuốn album Polaroid này, 
và đừng quên mở hộp quà bí mật cũng như bẻ chiếc bánh quy may mắn để xem vũ trụ nhắn nhủ điều gì đến em nhé. 
Chúc em một ngày sinh nhật thật hạnh phúc và rực rỡ!"
```

---

## 💻 4. Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Môi Trường
- **Node.js** >= 18.x
- **npm** >= 9.x

### Cài Đặt & Chạy
```bash
# 1. Cài đặt thư viện phụ thuộc
npm install

# 2. Khởi chạy chế độ phát triển (cả client và server song song)
npm run dev

# 3. Build sản phẩm tối ưu cho production
npm run build
```

### Kết nối Supabase và bảo vệ trang chỉnh sửa

1. Sao chép `.env.example` thành `.env`.
2. Điền `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `EDITOR_SESSION_SECRET` và `SITE_ORIGIN`.
3. Khi chạy trên Vercel, lấy **Transaction pooler** trong Supabase → Connect (cổng `6543`) vì địa chỉ direct `db.*:5432` dùng IPv6. Thêm `?sslmode=require&uselibpqcompat=true` vào cuối URL.
4. Khai báo các giá trị trên trong Vercel → Project Settings → Environment Variables rồi triển khai lại.

Backend tự tạo các bảng `birthday_profile`, `birthday_surprise_cards`, `birthday_memories`, `birthday_tracks`, `birthday_media`, `birthday_cards`, `birthday_wishes` và `admin_users` trong lần kết nối đầu tiên. Nội dung, nhạc tải lên, điều ước và tài khoản quản trị được giữ trong PostgreSQL. Trang `?edit=1` đăng nhập bằng tài khoản ADMIN đã được seed vào Supabase.

---

## 🛠️ 5. Công Nghệ Sử Dụng (Tech Stack)
- **Frontend**: React 19, Vite 6, Framer Motion, Lucide React, Canvas-Confetti, Web Audio API.
- **Backend**: Express.js, CORS (Node.js).
- **Styling**: Vanilla CSS, Glassmorphism, CSS Custom Properties Theme.
