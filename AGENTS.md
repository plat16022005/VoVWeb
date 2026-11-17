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
- **Phân tách thẩm quyền hiển thị (Tuyệt đối KHÔNG hiển thị Logs ở phân hệ Manager)**:
  - **Nhật ký hoạt động (Audit Logs) là tính năng bảo mật độc quyền dành riêng cho Quản Trị Viên (Admin)**.
  - **Tuyệt đối KHÔNG hiển thị tab, nút bấm hoặc bảng tra cứu logs trong bất kỳ trang nào của phân hệ Manager** (`/manager/*`). Phân hệ Manager là khu vực tác nghiệp vận hành, không được phép xem lịch sử kiểm toán hệ thống. Mọi bảng nhật ký chỉ được phép hiển thị tại trang tập trung `/admin/logs` và các phân hệ nội bộ của Admin.
- **Mô hình 2 cấp độ (Hybrid Architecture)**:
  - **Cấp độ 1: Log cục bộ (Contextual Logs)**: Tích hợp tab nhật ký trực tiếp bên trong từng phân hệ nghiệp vụ thuộc quyền Admin (như Sub-tab trong *Quản lý Tài khoản*, *Quản lý Điều khoản & Chính sách*...). Giúp Admin tra cứu nhanh lịch sử liên quan mà không phải chuyển trang.
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

---

## 8. Quy chuẩn Phân Quyền Quản Trị (Manager RBAC & Fine-grained Permissions)
- **Nguyên tắc Đồng Bộ Bắt Buộc (MANDATORY)**:
  - Bất cứ khi nào xây dựng một **Chức Năng Lớn** (Module) hoặc một **Cụm Chức Năng Nhỏ** (Sub-features/Actions) mới cho phân hệ **Manager**, **BẮT BUỘC PHẢI CẬP NHẬT ĐỒNG THỜI HỆ THỐNG PHÂN QUYỀN CHO ADMIN**:
    1. **Khai báo cấu hình**: Khai báo Nhóm lớn (`PermissionGroup`) và danh sách các quyền con (`SubPermission`) trong `src/data/permissions.ts`.
    2. **Cập nhật giao diện Admin**: Phân hệ Phân Quyền Quản Trị được **tách riêng độc lập tại `/admin/permissions`** (`AdminPermissionsView.tsx`), tách biệt hoàn toàn khỏi Quản Lý Tài Khoản (`/admin/accounts`). Đảm bảo hiển thị nhóm lớn và danh mục quyền nhỏ trong bảng Quản Lý (`ManagerPermissionsTable.tsx`), Modal phân quyền (`AccountPermissionsModal.tsx`), và danh mục quyền hệ thống (`PermissionsGroupsDirectory.tsx`).
    3. **Ràng buộc kiểm soát phía Manager**: Kiểm tra quyền hiển thị trên `ManagerSidebar.tsx` (`hasPermissionGroup`), chặn route trái phép ở cấp trang (`ManagerPortalView.tsx`), và ẩn/vô hiệu hóa các nút thao tác nhỏ tương ứng (`hasPermission`).
- **Quy chuẩn Lưu Trữ Dữ Liệu Phân Quyền Firestore**:
  - **CHỈ LƯU TRONG SUBCOLLECTION `Users/{userId}/Permissions/{groupId}`**:
    - Mỗi document con đại diện cho một Nhóm chức năng lớn (ID document là `{groupId}`, ví dụ: `content_management`).
    - Chứa các trường: `GroupId`, `GroupName`, `GroupCode`, `IsEnabled: true`, `SubPermissions: string[]`, `GrantedBy`, `UpdatedAt`.
  - **TUYỆT ĐỐI KHÔNG lưu các mảng `PermissionGroups` hay `Permissions` trong Document cha `Users/{userId}`** nhằm bảo vệ document cha luôn gọn nhẹ, sạch sẽ và tuân thủ đúng kiến trúc Subcollection.

---

## 9. Quy chuẩn Bảo Mật Thông Tin Giao Diện Quản Trị (UI Information Security & Anonymization)
- **Tuyệt đối KHÔNG làm lộ chi tiết công nghệ, hạ tầng lưu trữ và mã nội bộ trên giao diện Quản Lý/Người Dùng**:
  - Không hiển thị tên cơ sở dữ liệu hoặc cơ chế lưu trữ như: `Firestore`, `Subcollection`, `Firebase`, `Firestore Rules`, `Collection`, `Document ID`.
  - Không hiển thị các mã định danh kỹ thuật nhạy cảm: `Page ID: 1422359914290932`, raw UIDs, API Tokens, `Token vĩnh viễn`, `Access Token`...
  - Thay thế toàn bộ bằng ngôn ngữ quản trị chuẩn mực, trung lập và thân thiện với người vận hành:
    - Thay vì *"Lưu Subcollection an toàn"* -> Hiển thị *"Phân quyền tài khoản bảo mật"*.
    - Thay vì *"Cloud Firestore"* -> Hiển thị *"Hệ Thống Dữ Liệu: Đã Kết Nối"*.
    - Thay vì *"Page ID: 1422359914290932"* -> Hiển thị *"Kênh Truyền Thông Chính Thức"*.
    - Thay vì *"Token vĩnh viễn"* -> Hiển thị *"Đã Kết Nối Chính Thức"*.
    - Thay vì *"Lỗi Firestore Rules"* -> Hiển thị *"Vui lòng kiểm tra quyền truy cập hoặc thử lại sau"*.

---

## 10. Quy chuẩn Tách Biệt Frontend Hiển Thị & Backend Nghiệp Vụ (Zero Frontend Business Logic)
- **Nguyên tắc bắt buộc (MANDATORY)**:
  - **Frontend (`frontend/`) chỉ đóng vai trò hiển thị UI và gọi API Backend**: Tuyệt đối **KHÔNG đặt logic nghiệp vụ, validate quy tắc hệ thống, tính toán/xử lý dữ liệu nhạy cảm hay thao tác ghi/xóa Database trực tiếp ở phía Frontend (Client JS)** nhằm tránh lộ toàn bộ logic khi người dùng mở DevTools (F12).
  - **Backend (`backend/`) nắm toàn bộ logic xử lý**: Mọi quy trình validate dữ liệu đầu vào, kiểm tra quyền (Admin/Manager & Sub-permissions từ Firebase ID Token), CRUD cơ sở dữ liệu, ký URL/xóa file lưu trữ (Cloudflare R2) và ghi Nhật ký Kiểm toán (`Logs`) phải thực thi tập trung ở NestJS Backend (`/api/*`).
  - Các dữ liệu chưa công khai (ví dụ mùa Banner ở trạng thái bản nháp) phải được bảo vệ chặt chẽ ở tầng Security Rules và API Backend để tránh rò rỉ dữ liệu chưa phát hành.






