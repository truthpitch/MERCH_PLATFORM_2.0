// Storefront themes. One list drives everything: the CSS (themeCss below, put in <head> by
// app/layout.tsx), the visitor's theme menu in the header and the admin → Theme page.
//
// How it works: the shop only uses Tailwind's white, black and neutral greys. A theme swaps
// those colours inside .shop-root (white = background, black = text, greys mixed between them),
// can give buttons an accent colour, and can change fonts, rounding and a few details.
// The admin panel is never themed. Inspired by award-winning web design (awwwards.com):
// editorial serifs, Swiss grids, neo-brutalism, dark luxury, terminal mono, acid neon.

export type ThemeId =
  | "light"
  | "dark"
  | "paper"
  | "noir"
  | "swiss"
  | "brutal"
  | "klein"
  | "terminal"
  | "sand"
  | "lavender"
  | "forest"
  | "acid";

export type Theme = {
  id: ThemeId;
  name: string;
  description: string;
  /** Background, text and (optional) button colour, as #rrggbb. */
  bg: string;
  ink: string;
  accent?: string;
  /** Text on accent buttons. */
  onAccent?: string;
  dark: boolean;
  /** CSS font stacks (the --font-* variables come from next/font in app/layout.tsx). */
  bodyFont?: string;
  displayFont?: string;
  /** Rounding of buttons, fields and images. */
  radius?: string;
  /** Extra rules; "&" is replaced by this theme's .shop-root selector. */
  extraCss?: string;
  /** Exact greys instead of the automatic mix (used by Classic dark). */
  neutrals?: Record<number, string>;
};

const SERIF = `var(--font-fraunces), Georgia, "Times New Roman", serif`;
const INTER = `var(--font-inter), ui-sans-serif, system-ui, sans-serif`;
const GROTESK = `var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif`;
const MONO = `var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`;
const ROUNDED = `var(--font-nunito), ui-rounded, ui-sans-serif, system-ui, sans-serif`;

export const THEMES: Theme[] = [
  {
    id: "light",
    name: "Classic light",
    description: "The original TruthPitch look: black on white, clean and sharp.",
    bg: "#ffffff",
    ink: "#0a0a0a",
    dark: false,
  },
  {
    id: "dark",
    name: "Classic dark",
    description: "The original look, inverted: white on black.",
    bg: "#0a0a0a",
    ink: "#fafafa",
    dark: true,
    neutrals: {
      50: "#121212",
      100: "#1a1a1a",
      200: "#2a2a2a",
      300: "#3d3d3d",
      400: "#6b6b6b",
      500: "#8f8f8f",
      600: "#a8a8a8",
      700: "#c4c4c4",
      800: "#e0e0e0",
      900: "#f0f0f0",
      950: "#fafafa",
    },
  },
  {
    id: "paper",
    name: "Editorial",
    description: "Warm paper and ink with elegant serif headlines, like a printed magazine.",
    bg: "#f4efe6",
    ink: "#1d1a16",
    dark: false,
    displayFont: SERIF,
    extraCss: `& :is(h1,h2,h3){font-weight:500;letter-spacing:-0.02em}`,
  },
  {
    id: "noir",
    name: "Noir gold",
    description: "Dark luxury: deep black, soft ivory text and champagne-gold buttons.",
    bg: "#0d0c0a",
    ink: "#ece4d3",
    accent: "#c9a75e",
    onAccent: "#14110b",
    dark: true,
    displayFont: SERIF,
    extraCss: `& :is(h1,h2,h3){font-weight:400;letter-spacing:-0.01em}`,
  },
  {
    id: "swiss",
    name: "Swiss",
    description: "International style: crisp white, heavy grotesk type and signal-red buttons.",
    bg: "#ffffff",
    ink: "#111111",
    accent: "#e4002b",
    onAccent: "#ffffff",
    dark: false,
    bodyFont: INTER,
    extraCss: `& :is(h1,h2){font-weight:800;letter-spacing:-0.04em}`,
  },
  {
    id: "brutal",
    name: "Neo brutal",
    description: "Bold and loud: cream background, thick black outlines, yellow buttons with hard shadows.",
    bg: "#fffbea",
    ink: "#000000",
    accent: "#ffd600",
    onAccent: "#000000",
    dark: false,
    bodyFont: GROTESK,
    radius: "6px",
    extraCss: `& :is(a,button).bg-black{border:2px solid #000;box-shadow:4px 4px 0 #000}
& :is(a,button).bg-black:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 #000}
& :is(a,button).border-black{border-width:2px;box-shadow:4px 4px 0 #000}
& :is(h1,h2){font-weight:700;letter-spacing:-0.03em}
& header{border-bottom:2px solid #000}`,
  },
  {
    id: "klein",
    name: "Klein blue",
    description: "Art-gallery statement: the whole shop in deep ultramarine blue with white type.",
    bg: "#0b2fa6",
    ink: "#ffffff",
    dark: true,
    bodyFont: INTER,
    extraCss: `& :is(h1,h2){font-weight:700;letter-spacing:-0.03em}`,
  },
  {
    id: "terminal",
    name: "Terminal",
    description: "Retro computer screen: green phosphor text on black, all in monospace.",
    bg: "#050a06",
    ink: "#3dff7a",
    dark: true,
    bodyFont: MONO,
    extraCss: `& :is(h1,h2,h3){font-weight:600;letter-spacing:-0.02em}
& ::selection{background:#3dff7a;color:#050a06}`,
  },
  {
    id: "sand",
    name: "Sand & clay",
    description: "Earthy and calm: sand tones, warm brown text and terracotta buttons, softly rounded.",
    bg: "#efe6d8",
    ink: "#3a2a1f",
    accent: "#b8542c",
    onAccent: "#fff8f0",
    dark: false,
    displayFont: SERIF,
    radius: "10px",
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Soft and friendly: pale lavender, deep violet text, rounded pill buttons.",
    bg: "#f3f0ff",
    ink: "#241b47",
    accent: "#6d4aff",
    onAccent: "#ffffff",
    dark: false,
    bodyFont: ROUNDED,
    radius: "16px",
    extraCss: `& :is(a,button).bg-black,& :is(a,button).border-black{border-radius:999px}`,
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep forest green with cream text and moss-green buttons, grounded and natural.",
    bg: "#10201a",
    ink: "#eee8da",
    accent: "#a8c686",
    onAccent: "#10201a",
    dark: true,
    displayFont: SERIF,
    radius: "4px",
  },
  {
    id: "acid",
    name: "Acid night",
    description: "Night-club energy: near-black with electric lime buttons and wide grotesk type.",
    bg: "#0a0a0a",
    ink: "#f2f2f2",
    accent: "#c6ff00",
    onAccent: "#0a0a0a",
    dark: true,
    bodyFont: GROTESK,
    extraCss: `& :is(h1,h2){font-weight:700;letter-spacing:-0.04em;text-transform:uppercase}
& ::selection{background:#c6ff00;color:#0a0a0a}`,
  },
];

export const THEME_IDS = THEMES.map((t) => t.id);
export const isThemeId = (v: unknown): v is ThemeId => typeof v === "string" && (THEME_IDS as string[]).includes(v);
/** "auto" = Classic light or dark, following the visitor's device setting. */
export type ThemeSetting = ThemeId | "auto";
export const isThemeSetting = (v: unknown): v is ThemeSetting => v === "auto" || isThemeId(v);
export const themeById = (id: string) => THEMES.find((t) => t.id === id);

/** Mix two #rrggbb colours: t = 0 → a, t = 1 → b. */
function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

// How far each grey sits between the background (0) and the text colour (1).
const STEPS: Record<number, number> = { 50: 0.035, 100: 0.07, 200: 0.13, 300: 0.22, 400: 0.4, 500: 0.54, 600: 0.65, 700: 0.75, 800: 0.85, 900: 0.92, 950: 0.97 };

/** The CSS for every theme except Classic light (which is the default Tailwind palette). */
export function themeCss(): string {
  const out: string[] = [];
  for (const t of THEMES) {
    if (t.id === "light") continue;
    // The live site (html[data-theme]) and the small previews in the admin (data-theme-preview).
    const S = `html[data-theme="${t.id}"] .shop-root`;
    const P = `.theme-preview[data-theme-preview="${t.id}"]`;
    const both = (rest: string) => `${S}${rest},${P}${rest}`;
    const greys = Object.entries(STEPS)
      .map(([n, v]) => `--color-neutral-${n}:${t.neutrals?.[Number(n)] ?? mix(t.bg, t.ink, v)};`)
      .join("");
    out.push(
      `${S},${P}{color-scheme:${t.dark ? "dark" : "light"};--color-white:${t.bg};--color-black:${t.ink};${greys}${t.bodyFont ? `font-family:${t.bodyFont};` : ""}}`,
      `html[data-theme="${t.id}"] body:has(.shop-root){background:${t.bg};color:${t.ink}}`,
    );
    if (t.displayFont) out.push(`${both(" :is(h1,h2,h3)")}{font-family:${t.displayFont}}`);
    if (t.accent) {
      const on = t.onAccent ?? t.bg;
      out.push(
        `${both(" .bg-black")}{background-color:${t.accent};color:${on};border-color:${t.accent}}`,
        `${both(" .bg-black.text-white")},${both(" .bg-black .text-white")}{color:${on}}`,
        `${both(" .bg-black:hover")}{filter:brightness(1.08)}`,
        `${both(" .bg-black:disabled")}{opacity:.45}`,
      );
    }
    if (t.radius) {
      out.push(
        `${both(" :is(a,button).bg-black")},${both(" :is(a,button).border-black")},${both(" :is(input,select,textarea)")},${both(" img")}{border-radius:${t.radius}}`,
      );
    }
    if (t.extraCss) {
      for (const rule of t.extraCss.split("\n")) out.push(rule.replace(/&/g, S), rule.replace(/&/g, P));
    }
  }
  return out.join("\n");
}

/**
 * Runs in <head> before the page is painted, so there's never a flash of the wrong theme.
 * Locked: everyone gets the admin's theme. Otherwise the visitor's saved choice, else the default.
 */
export function themeScript(defaultTheme: ThemeSetting, locked: boolean): string {
  const cfg = JSON.stringify({ ids: THEME_IDS, def: defaultTheme, locked });
  return `(function(){try{var c=${cfg};var t=c.locked?null:localStorage.getItem("tp-theme");if(c.ids.indexOf(t)<0)t=c.def;if(t==="auto")t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","light")}})();`;
}
