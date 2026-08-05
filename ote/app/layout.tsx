import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE } from "../lib/content";

export const metadata: Metadata = {
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.about,
  metadataBase: new URL(`https://${SITE.domain}`),
  openGraph: {
    title: SITE.name,
    description: SITE.tagline,
    url: `https://${SITE.domain}`,
    siteName: SITE.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#070910",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
