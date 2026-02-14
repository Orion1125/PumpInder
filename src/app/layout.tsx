import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { PageTransition } from "@/components/PageTransition";
import { CursorParticles } from "@/components/CursorParticles";
import { GlobalTicker } from "@/components/GlobalTicker";

const clashDisplay = Inter({
  variable: "--font-clash-display",
  weight: "700",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: "500",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PumpInder",
  description: "Pumpfun-style Tinder experience powered by PINDER tokens.",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('appearance-settings');if(s){var t=JSON.parse(s).theme;if(t==='dark')document.documentElement.classList.add('dark');else if(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${clashDisplay.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} antialiased`}>
        <AppProviders>
          <CursorParticles />
          <PageTransition>
            {children}
          </PageTransition>
          <GlobalTicker />
        </AppProviders>
      </body>
    </html>
  );
}