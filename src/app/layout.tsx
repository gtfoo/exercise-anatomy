import type { Metadata, Viewport } from "next";
import { STUDIO } from "@/lib/palette";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Exercise anatomy",
  description: "Which muscles work, and when, through a movement, shown on a 3D figure.",
  // Added to an iPhone's home screen it opens full screen, named as the manifest's short name (src/app/manifest.ts).
  appleWebApp: { capable: true, title: "Anatomy", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: STUDIO,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
