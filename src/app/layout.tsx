import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { Toolbar } from "@/components/Toolbar";

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
    <html>
      <body className={`${clashDisplay.variable} ${jetbrainsMono.variable} antialiased`}>
        <AppProviders>
          {children}
          <Toolbar />
        </AppProviders>
      </body>
    </html>
  );
}
