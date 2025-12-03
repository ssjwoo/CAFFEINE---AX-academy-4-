import type { Metadata } from "next";
import "./globals.css";
import SidebarNew from "@/components/SidebarNew";
import Header from "@/components/Header";

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
        <SidebarNew />
        <Header />
        <main className="ml-64 pt-16 min-h-screen">
          <div className="p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
