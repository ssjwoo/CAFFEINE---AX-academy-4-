import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "Caffeine Admin",
  description: "Admin dashboard for Caffeine application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-[#f8fafc]">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
