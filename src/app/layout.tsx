import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Productivity OS",
  description: "A personal operating system for focus and control.",
  applicationName: "Productivity OS",
  // Icon resolved automatically from src/app/icon.svg (App Router convention).
};

export const viewport: Viewport = {
  themeColor: "#0a0a10",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`}>
      <body className="ambient-bg min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
