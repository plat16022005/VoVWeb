# Valkyria of Veyra (VoVWeb) - Agent Guidelines & Learnings

Tài liệu này ghi nhận toàn bộ kiến trúc, bài học và quy chuẩn đã được thống nhất từ các phiên làm việc trước:

---

## 1. Công nghệ & Phạm vi hiện tại (Tech Stack & Scope)
- **Frontend**: Next.js 15+ (App Router), TypeScript, Tailwind CSS, Lucide React, HTML5 Canvas (`StarCanvas`). Port mặc định: `3002`.
- **Backend**: NestJS, TypeScript, Node.js (Global prefix: `/api`). Port mặc định: `3001`.
- **Authentication & Database (Quan trọng)**:
  - Dự kiến dùng Firebase Authentication và Firebase Firestore / Supabase PostgreSQL.
  - **Lưu ý tiên quyết**: *Hiện tại chưa cần quan tâm đến authentication và database*. Không tự ý cài đặt hay bắt buộc người dùng tích hợp Firebase/Supabase cho đến khi có yêu cầu rõ ràng. Dữ liệu hiện tại được quản lý qua mock data (`src/data/`) và NestJS API đơn giản.

---

## 2. Tiêu chuẩn UI/UX & Layout
- **Căn giữa toàn bộ giao diện (Center Alignment)**:
  - Tuyệt đối không để nội dung lệch về bên trái.
  - Luôn bọc các section/container trong `max-w-7xl mx-auto px-4` hoặc căn giữa cân đối (`flex justify-center`, `items-center`).
- **Phong cách thiết kế, Cốt truyện & Thể loại (Theme & Genre)**:
  - **Cốt truyện cốt lõi**: Kể về vùng đất/đại lục **Veyra** huyền bí, nơi có các cô gái mang sức mạnh đặc biệt được gọi là các **Valkyria**. Người chơi là **Chỉ Huy**, sát cánh cùng các Valkyria chiến đấu và khám phá vùng đất Veyra.
  - **Game Engine & Thể loại**: Phát triển trên nền tảng **Unity Engine**. Thể loại: **Turn-Based RPG** (Game Nhập Vai Chiến Thuật Theo Lượt). Tuyệt đối KHÔNG nhắc đến Unreal Engine.
  - **Tuyệt đối KHÔNG dùng**: Từ ngữ về "đội tàu", "chuyến tàu", "Astral", "vũ trụ", "ngân hà", "Nhà Khai Phá", "Unreal Engine".
  - **Tông màu**: Dark fantasy violet/black (`#0a0818`, `#060714`), điểm xuyết neon cyan và gold/amber rực rỡ, huyền ảo.
  - Hiệu ứng sao rơi nền (`StarCanvas`), nhạc nền BGM du dương có nút bật/tắt ở Navbar.
- **Card 3D Tilt Effect**:
  - Các thẻ nhân vật (`CharacterShowcase`) và địa điểm (`WorldSection`) phải giữ hiệu ứng 3D hover tilt tương tác theo vị trí chuột (`preserve-3d`, xoay `rotateX`, `rotateY`).

---

## 3. Kiến trúc Code & Modularization (Bài học cốt lõi)
- **Tuyệt đối KHÔNG viết monolithic code trong `page.tsx`**:
  - Không dồn toàn bộ code vào một file lớn gây rối rắm và khó bảo trì.
  - Luôn chia nhỏ thành các thành phần độc lập:
    - `src/components/home/`: `Navbar`, `HeroSection`, `CharacterShowcase`, `WorldSection`, `NewsSection`, `MilestoneSection`, `LeaderboardSection`, `MediaGallery`, `CommunitySection`, `Footer`.
    - `src/components/modals/`: `TrailerModal`, `GiftcodeModal`, `PlayModal`.
    - `src/components/common/`: `StarCanvas` và các component tái sử dụng.
    - `src/data/`: `characters.ts`, `worlds.ts`, `news.ts`.
    - `src/hooks/`: Custom hooks như `usePlayers.ts`.
    - `src/services/`: Dịch vụ như `audio.service.ts`.

---

## 4. Định tuyến & Mở rộng trang (Next.js App Router)
- **Quy tắc đặt tên file**:
  - Endpoint hiển thị route bắt buộc phải là `page.tsx` (ví dụ `src/app/admin/characters/page.tsx` cho URL `/admin/characters`).
  - Đổi tên file `page.tsx` thành tên khác sẽ làm Next.js trả về lỗi 404.
- **Trang quản trị (Admin)**:
  - Tạo thư mục riêng trong `src/app/admin/`.
  - Tạo các sub-component cho admin trong `src/components/admin/` thay vì dồn vào `page.tsx`.

---

## 5. Môi trường & Triển khai (DevOps / Deployment)
- **Biến môi trường**:
  - Kết nối Frontend -> Backend qua `NEXT_PUBLIC_API_URL` (Local: `http://localhost:3001/api`).
  - `.env.local` nằm trong `.gitignore`, không đưa lên Git.
  - Luôn duy trì file `.env.example` trên Git để các thành viên khác clone về biết các biến cần thiết lập.
- **Deploy**:
  - Frontend triển khai trên Vercel.
  - Backend triển khai trên Railway hoặc Render.

---

## 6. Quy chuẩn Kiến trúc Logs (Audit Logs & Nhật ký Hoạt động)
- **Mô hình 2 cấp độ (Hybrid Architecture)**:
  - **Cấp độ 1: Log cục bộ (Contextual Logs)**: Tích hợp tab nhật ký trực tiếp bên trong từng phân hệ nghiệp vụ cụ thể (như Sub-tab trong *Quản lý Tài khoản*, *Quản lý Điều khoản & Chính sách*...). Giúp người quản trị tra cứu nhanh lịch sử liên quan mà không phải chuyển trang.
  - **Cấp độ 2: Log tổng hợp (Centralized Logs)**: Xây dựng màn hình tổng hợp độc lập tại `/admin/logs` (`Nhật Ký Hoạt Động`).
- **Nguyên tắc cấu trúc bảng Log (Quan trọng)**:
  - **TUYỆT ĐỐI KHÔNG gộp chung tất cả các loại log vào một bảng duy nhất** vì mỗi phân hệ có cấu trúc dữ liệu và trường nghiệp vụ hoàn toàn khác nhau (ví dụ: Log Tài khoản có lý do khóa, tài khoản đích; Log Điều khoản có số hiệu phiên bản, số lượng mục...).
  - Trang Tổng hợp `/admin/logs` phải được tổ chức thành **các Sub-Tabs chuyên biệt cho từng Phân Hệ** (Tab Quản Lý Tài Khoản, Tab Điều Khoản Dịch Vụ, Tab Chính Sách Bảo Mật...). Mỗi tab sử dụng bảng dữ liệu, bộ lọc và cấu trúc cột phù hợp với nghiệp vụ đó, giúp dễ dàng cắm thêm các phân hệ mới (Giao dịch, Máy chủ, Giftcode...) trong tương lai mà không làm vỡ cấu trúc.
- **Tiêu chuẩn dữ liệu & Hiển thị**:
  - Lưu vào Firestore theo cấu trúc phân cấp để tránh giới hạn kích thước document (ví dụ: `Logs/{Module}/{SubModule}/{logId}`).
  - Tuyệt đối không hiển thị các mã nội bộ (như `termId`, `term01`...) lên giao diện người dùng/quản trị.
  - Sử dụng ngôn từ quản lý người dùng chuẩn mực ("Tài khoản", "Người dùng", "Khóa tài khoản", "Mở khóa", "Quản Trị Viên"), không lạm dụng thuật ngữ game/nhập vai trong khu vực quản trị.

---

## 7. Quy chuẩn Quản lý Thông số & Bộ đếm (Collection `Counters`)
- **Document cha `Counters/AccountStats`**:
  - **CHỈ CHỨA DUY NHẤT 3 TRƯỜNG**: `EmailCount`, `GoogleCount`, `GuestCount` (Thống kê tổng hợp phương thức đăng ký tài khoản Người Chơi).
  - **Tuyệt đối KHÔNG lưu các thông số đếm theo ngày trong Document cha này** để tránh dữ liệu bị phình to hoặc lẫn lộn dữ liệu thời gian.
- **Subcollection theo ngày `Counters/AccountStats/DailyStats/{YYYY-MM-DD}`**:
  - Toàn bộ chỉ số biến động theo thời gian được lưu độc lập tại đây (Document ID định dạng `YYYY-MM-DD`, ví dụ: `2026-10-30`).
  - Chứa các trường: `Date` (YYYY-MM-DD), `PlayerCount` (chỉ đếm Người Chơi tạo trong ngày đó), `EmailCount`, `GoogleCount`, `GuestCount`, `LastUpdated`.
  - Phục vụ biểu đồ tăng trưởng, phân tích dữ liệu lịch sử theo chuỗi thời gian (time-series).
- **Lưu ý tiên quyết**: *Chỉ đếm tài khoản Người Chơi (`Role: Player`)*. Tuyệt đối không đếm tài khoản Quản Trị Viên (Admin) hay Quản Lý (Manager) vào các thông số này.




