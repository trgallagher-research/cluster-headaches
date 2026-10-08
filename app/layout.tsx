import type { Metadata, Viewport } from "next";
import { DM_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/strings";

const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });
const sans = Manrope({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: APP_NAME,
  description: "One-tap cluster headache attack diary. Works offline; your data stays on your phone.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#14121c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mono.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
