import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omni AI",
  description: "Futuristic AI interface for chat, images, and voice",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-gray-950">{children}</body>
    </html>
  );
}
