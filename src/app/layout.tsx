import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { GOOGLE_SITE_VERIFICATION, SITE_NAME, publicSiteUrl } from "@/lib/site";
import { MIME_BY_EXT } from "@/lib/uploads";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  // The favicon is uploaded on the admin Dashboard. If the database can't be read, carry on without it.
  const s = await getSettings().catch(() => null);
  const faviconUrl = s?.faviconUrl ?? "";
  const type = MIME_BY_EXT[faviconUrl.split(".").pop() ?? ""];
  return {
    // The real domain, so relative links in metadata (canonical, link previews) become full addresses.
    metadataBase: new URL(publicSiteUrl()),
    title: { default: "TruthPitch — Merch", template: "%s — TruthPitch" },
    description: "Official TruthPitch merch. Clean essentials, printed on demand.",
    openGraph: { siteName: SITE_NAME, type: "website", locale: "en_GB" },
    ...(faviconUrl && {
      icons: { icon: [{ url: faviconUrl, ...(type && { type }) }], shortcut: faviconUrl, apple: faviconUrl },
    }),
  };
}

// Runs before the page is painted so there's no white flash in dark mode:
// a saved choice wins, otherwise follow the device setting.
const themeScript = `(function(){try{var t=localStorage.getItem("tp-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Ownership codes for Google Search Console and Bing Webmaster Tools (admin → SEO & Traffic).
  // Written straight into <head> (not via metadata, which Next.js may stream into the body),
  // so every search engine crawler finds them where it expects them.
  const s = await getSettings().catch(() => null);
  const google = s?.googleVerification.trim() || GOOGLE_SITE_VERIFICATION;
  const bing = s?.bingVerification.trim() ?? "";
  return (
    // suppressHydrationWarning: the theme script and Google's translator change attributes on <html>.
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content={google} />
        {bing && <meta name="msvalidate.01" content={bing} />}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">{children}</body>
    </html>
  );
}
