import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TruthPitch — Merch", template: "%s — TruthPitch" },
  description: "Official TruthPitch merch. Clean essentials, printed on demand.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">{children}</body>
    </html>
  );
}
