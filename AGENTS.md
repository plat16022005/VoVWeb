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
