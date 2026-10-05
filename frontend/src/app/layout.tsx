import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VoVWeb — Modern Full-Stack Platform",
  description: "A powerful platform built with Next.js and NestJS, delivering fast, scalable and beautiful web experiences.",
  keywords: ["Next.js", "NestJS", "TypeScript", "Full-Stack"],
  openGraph: {
    title: "VoVWeb — Modern Full-Stack Platform",
    description: "A powerful platform built with Next.js and NestJS.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-animated">{children}</body>
    </html>
  );
}
