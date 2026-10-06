---
description: Quy chuẩn kiến trúc, UI/UX và bài học dự án VoVWeb (Valkyria of Veyra)
globs: **/*
---

# Quy chuẩn phát triển dự án VoVWeb

1. **Phạm vi & Yêu cầu công nghệ**:
   - Frontend: Next.js 15+ (App Router), TypeScript, Tailwind CSS.
   - Backend: NestJS, TypeScript (prefix: `/api`).
   - Chưa tích hợp Authentication và Database trong giai đoạn hiện tại (theo yêu cầu của người dùng). Không tự ý thêm Firebase Auth hay Firestore/Supabase trừ khi được yêu cầu.

2. **Quy chuẩn UI/UX**:
   - Mọi container và section phải được căn giữa hoàn toàn (`max-w-7xl mx-auto px-4`), không để nội dung lệch về bên trái.
   - Giữ hiệu ứng 3D card tilt trên các card nhân vật và thế giới.
   - Giữ phong cách Cosmic Anime / Sci-Fi với nền hạt sao `StarCanvas` và nhạc nền BGM.

3. **Cấu trúc Code (Modularization)**:
   - Tuyệt đối không dồn code vào `page.tsx`. Phải tách thành các component nhỏ tại `src/components/`, mock data tại `src/data/`, hooks tại `src/hooks/`, và services tại `src/services/`.

4. **Next.js App Router**:
   - File hiển thị route bắt buộc mang tên `page.tsx`.
   - Các trang mới (như Admin) tổ chức dưới `src/app/admin/`.

5. **Biến môi trường**:
   - Frontend kết nối backend qua `NEXT_PUBLIC_API_URL`.
   - File `.env.local` phải nằm trong `.gitignore`. File `.env.example` phải luôn được duy trì trên git.
