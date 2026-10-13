import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { default: "Trabajo Ya", template: "%s · Trabajo Ya" },
  description: "Mira qué buscan las empresas y aplica con un clic.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F6F9" },
    { media: "(prefers-color-scheme: dark)", color: "#0F131A" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${schibsted.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
