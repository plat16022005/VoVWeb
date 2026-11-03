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
  title: "Valkyria of Veyra — Sát Cánh Cùng Các Valkyria | Trang Chủ Chính Thức",
  description: "Khám phá vùng đất Veyra huyền bí cùng Valkyria of Veyra. Game anime nhập vai chiến thuật theo lượt (Turn-Based RPG). Sát cánh cùng các nữ chiến binh Valkyria chiến đấu và chinh phục mọi miền đất kỳ ảo.",
  keywords: ["Valkyria of Veyra", "VoV", "Valkyrie", "Valkyria", "Turn-Based RPG", "Chiến Thuật Theo Lượt", "Game Anime", "RPG Kỳ Ảo", "Vùng Đất Veyra"],
  openGraph: {
    title: "Valkyria of Veyra — Game Nhập Vai Chiến Thuật Theo Lượt",
    description: "Tựa game anime nhập vai chiến thuật theo lượt (Turn-Based RPG). Đăng ký trước nhận ngay 80 lượt triệu hồi và đồng hành cùng các Valkyria huyền thoại!",
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
