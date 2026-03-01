import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPEEK 49er — Suas reuniões viram posts",
  description:
    "Plataforma que transforma reuniões em posts para LinkedIn via IA. Suas reuniões. Seu conteúdo. Automático.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-dm-sans bg-[#F8F7F4] text-[#0A0A0A]">
        {children}
      </body>
    </html>
  );
}
