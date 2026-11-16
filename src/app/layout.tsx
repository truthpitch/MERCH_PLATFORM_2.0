import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { MIME_BY_EXT } from "@/lib/uploads";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  // The favicon is uploaded on the admin Dashboard. If the database can't be read, carry on without it.
  const faviconUrl = await getSettings()
    .then((s) => s.faviconUrl)
    .catch(() => "");
  const type = MIME_BY_EXT[faviconUrl.split(".").pop() ?? ""];
  return {
    title: { default: "TruthPitch — Merch", template: "%s — TruthPitch" },
    description: "Official TruthPitch merch. Clean essentials, printed on demand.",
    ...(faviconUrl && {
      icons: { icon: [{ url: faviconUrl, ...(type && { type }) }], shortcut: faviconUrl, apple: faviconUrl },
    }),
  };
}

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
