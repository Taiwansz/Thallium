import type { Metadata } from "next";
import { Sora, Manrope } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thallium — Banco Digital Premium",
  description: "Core Ledger de alto desempenho e banco digital de nível internacional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${sora.variable} ${manrope.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#090909] text-[#F5F2EB] selection:bg-[#D4AF6A] selection:text-[#090909]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
