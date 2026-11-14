import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TruthPitch — Merch", template: "%s — TruthPitch" },
  description: "Official TruthPitch merch. Clean essentials, printed on demand.",
};

// Runs before the page is painted so there's no white flash in dark mode:
// a saved choice wins, otherwise follow the device setting.
const themeScript = `(function(){try{var t=localStorage.getItem("tp-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the theme script and Google's translator change attributes on <html>.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">{children}</body>
    </html>
  );
}
