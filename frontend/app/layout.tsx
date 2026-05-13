import type { Metadata } from "next";
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
  title: "Research Assistant | Intelligence Terminal",
  description: "Ultra-premium graphite-based research assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-primary/20`}>
        {/* Layer 1: Global Background Intelligence */}
        <div className="fixed inset-0 bg-noise z-[9999] opacity-[0.03] pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 pointer-events-none" />
        
        {/* Ambient Breathing Light */}
        <div className="fixed top-1/4 left-1/4 w-[40vw] h-[40vh] bg-primary/10 rounded-full blur-[120px] animate-breathing pointer-events-none" />
        <div className="fixed bottom-1/4 right-1/4 w-[30vw] h-[30vh] bg-secondary/10 rounded-full blur-[100px] animate-breathing delay-2000 pointer-events-none" />

        <main className="relative z-10 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
