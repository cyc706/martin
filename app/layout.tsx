import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Martin - 金融行情查看系统",
  description: "Martin 金融行情查看系统，帮助你快速了解市场行情与资产表现。",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
