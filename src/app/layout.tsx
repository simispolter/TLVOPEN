import type { Metadata, Viewport } from "next";
import { Assistant } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "פתוח לציבור",
  description: "מפה ציבורית לשטחים פתוחים וזיקות הנאה בתל אביב.",
};

export const viewport: Viewport = {
  themeColor: "#F7F3EA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={assistant.variable}>{children}</body>
    </html>
  );
}
