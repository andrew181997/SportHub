import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CookieConsent } from "@/components/public/cookie-consent";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "SportHub — Конструктор сайтов для спортивных турниров",
  description:
    "Платформа для организаторов любительских спортивных турниров. Создайте сайт лиги за 5 минут.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
