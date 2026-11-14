// Languages offered in the header menu, each shown in its own language.
// `code` is the code Google's website translator uses (e.g. "iw" for Hebrew, "zh-CN").
export type Language = { code: string; name: string; short: string };

export const SITE_LANGUAGE = "en";

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", short: "EN" },
  { code: "nl", name: "Nederlands", short: "NL" },
  { code: "de", name: "Deutsch", short: "DE" },
  { code: "fr", name: "Français", short: "FR" },
  { code: "es", name: "Español", short: "ES" },
  { code: "it", name: "Italiano", short: "IT" },
  { code: "pt", name: "Português", short: "PT" },
  { code: "pl", name: "Polski", short: "PL" },
  { code: "sv", name: "Svenska", short: "SV" },
  { code: "da", name: "Dansk", short: "DA" },
  { code: "no", name: "Norsk", short: "NO" },
  { code: "fi", name: "Suomi", short: "FI" },
  { code: "is", name: "Íslenska", short: "IS" },
  { code: "ga", name: "Gaeilge", short: "GA" },
  { code: "cs", name: "Čeština", short: "CS" },
  { code: "sk", name: "Slovenčina", short: "SK" },
  { code: "hu", name: "Magyar", short: "HU" },
  { code: "ro", name: "Română", short: "RO" },
  { code: "bg", name: "Български", short: "BG" },
  { code: "el", name: "Ελληνικά", short: "EL" },
  { code: "hr", name: "Hrvatski", short: "HR" },
  { code: "sr", name: "Српски", short: "SR" },
  { code: "sl", name: "Slovenščina", short: "SL" },
  { code: "lt", name: "Lietuvių", short: "LT" },
  { code: "lv", name: "Latviešu", short: "LV" },
  { code: "et", name: "Eesti", short: "ET" },
  { code: "uk", name: "Українська", short: "UK" },
  { code: "ru", name: "Русский", short: "RU" },
  { code: "tr", name: "Türkçe", short: "TR" },
  { code: "ar", name: "العربية", short: "AR" },
  { code: "iw", name: "עברית", short: "HE" },
  { code: "fa", name: "فارسی", short: "FA" },
  { code: "ur", name: "اردو", short: "UR" },
  { code: "hi", name: "हिन्दी", short: "HI" },
  { code: "bn", name: "বাংলা", short: "BN" },
  { code: "th", name: "ไทย", short: "TH" },
  { code: "vi", name: "Tiếng Việt", short: "VI" },
  { code: "id", name: "Bahasa Indonesia", short: "ID" },
  { code: "ms", name: "Bahasa Melayu", short: "MS" },
  { code: "tl", name: "Filipino", short: "TL" },
  { code: "zh-CN", name: "简体中文", short: "中文" },
  { code: "zh-TW", name: "繁體中文", short: "繁中" },
  { code: "ja", name: "日本語", short: "JA" },
  { code: "ko", name: "한국어", short: "KO" },
  { code: "sw", name: "Kiswahili", short: "SW" },
  { code: "af", name: "Afrikaans", short: "AF" },
];

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code.toLowerCase(), l]));

/** Maps a browser language tag (e.g. "nl-BE", "he", "zh-Hant-TW") to one of our codes, or null. */
export function matchBrowserLanguage(tag: string): string | null {
  const t = tag.toLowerCase();
  if (t.startsWith("zh")) return /tw|hk|mo|hant/.test(t) ? "zh-TW" : "zh-CN";
  const base = t.split("-")[0];
  if (base === "he") return "iw";
  if (base === "nb" || base === "nn") return "no";
  if (base === "fil") return "tl";
  return BY_CODE.get(t)?.code ?? BY_CODE.get(base)?.code ?? null;
}

export function findLanguage(code: string): Language {
  return BY_CODE.get(code.toLowerCase()) ?? LANGUAGES[0];
}
