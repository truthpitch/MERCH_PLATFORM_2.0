import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono, Nunito, Space_Grotesk } from "next/font/google";
import { getSettings } from "@/lib/settings";
import { GOOGLE_SITE_VERIFICATION, SITE_NAME, publicSiteUrl } from "@/lib/site";
import { isThemeSetting, themeCss, themeScript } from "@/lib/themes";
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

// Fonts for the themes (src/lib/themes.ts). next/font serves them from this website itself,
// so visitors never contact Google. preload: false = a font is only downloaded when the active
// theme actually uses it.
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-fraunces" });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-space-grotesk" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-jetbrains-mono" });
const nunito = Nunito({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-nunito" });
const fontVars = [fraunces, inter, spaceGrotesk, jetbrainsMono, nunito].map((f) => f.variable).join(" ");

// Same for every page, so build it once.
const THEME_CSS = themeCss();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Ownership codes for Google Search Console and Bing Webmaster Tools (admin → SEO & Traffic).
  // Written straight into <head> (not via metadata, which Next.js may stream into the body),
  // so every search engine crawler finds them where it expects them.
  const s = await getSettings().catch(() => null);
  const google = s?.googleVerification.trim() || GOOGLE_SITE_VERIFICATION;
  const bing = s?.bingVerification.trim() ?? "";
  // Theme: chosen in admin → Theme. The script sets data-theme on <html> before the page is
  // painted, so there's never a flash of the wrong colours.
  const themeDefault = isThemeSetting(s?.themeDefault) ? s.themeDefault : "auto";
  return (
    // suppressHydrationWarning: the theme script and Google's translator change attributes on <html>.
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content={google} />
        {bing && <meta name="msvalidate.01" content={bing} />}
        <script dangerouslySetInnerHTML={{ __html: themeScript(themeDefault, Boolean(s?.themeLocked)) }} />
        <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">{children}</body>
    </html>
  );
}
