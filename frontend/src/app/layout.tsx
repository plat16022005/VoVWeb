import type { Metadata } from "next";
import { Inter, Space_Grotesk, Rajdhani, Chakra_Petch } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3002"),
  title: "VoV: Star Odyssey — Game Nhập Vai Vũ Trụ Kỳ Ảo | Trang Chủ Chính Thức",
  description: "Khám phá dải ngân hà vô tận cùng VoV: Star Odyssey. Lên chuyến tàu Astral, kết bạn cùng các nhân vật độc đáo, bước vào cuộc phiêu lưu chiến thuật nhập vai không gian kỳ ảo.",
  keywords: ["VoV", "Star Odyssey", "Honkai Star Rail", "Game Anime", "RPG Vũ Trụ", "Game Nhập Vai", "Chuyến Tàu Ngân Hà"],
  openGraph: {
    title: "VoV: Star Odyssey — Vạn Giới Khởi Hành, Dạo Bước Ngân Hà",
    description: "Tựa game phiêu lưu nhập vai thám hiểm ngân hà thế hệ mới. Đăng ký trước nhận ngay 80 lượt quay và nhân vật 4 sao độc quyền!",
    type: "website",
    locale: "vi_VN",
    images: [
      {
        url: "/images/hero_bg.jpg",
        width: 1920,
        height: 1080,
        alt: "VoV Star Odyssey Key Visual",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${spaceGrotesk.variable} ${rajdhani.variable} ${chakraPetch.variable} w-full min-h-full antialiased dark`}
    >
      <body className="w-full min-h-screen flex flex-col items-center bg-[#05060f] text-[#e8eaf6] m-0 p-0 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
