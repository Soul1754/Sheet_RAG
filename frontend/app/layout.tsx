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

import { SettingsProvider } from "@/lib/settings-context";
import { UserProvider } from "@/lib/user-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem('app-settings');
                  const settings = saved ? JSON.parse(saved) : {};
                  const theme = settings.theme || 'system';
                  const root = document.documentElement;
                  
                  if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                  } else {
                    root.classList.add(theme);
                  }

                  if (settings.compactMode) {
                    root.classList.add('compact-mode');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-primary/20`}
        suppressHydrationWarning
      >
        <UserProvider>
          <SettingsProvider>
            {/* Layer 1: Global Background Intelligence */}
            <div className="fixed inset-0 bg-noise z-[9999] opacity-[0.03] pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 pointer-events-none" />
            
            {/* Ambient Breathing Light */}
            <div className="fixed top-1/4 left-1/4 w-[40vw] h-[40vh] bg-primary/10 rounded-full blur-[120px] animate-breathing pointer-events-none" />
            <div className="fixed bottom-1/4 right-1/4 w-[30vw] h-[30vh] bg-secondary/10 rounded-full blur-[100px] animate-breathing delay-2000 pointer-events-none" />

            <main className="relative z-10 min-h-screen">
              {children}
            </main>
          </SettingsProvider>
        </UserProvider>
      </body>
    </html>
  );
}
