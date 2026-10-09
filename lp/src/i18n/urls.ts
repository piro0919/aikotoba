import { routing } from "./routing";

/**
 * The public path for a locale.
 * localePrefix is "as-needed", so only the default locale goes without a prefix.
 * `/en` is not a real page but a 307 to `/`, so canonical and hreflang must
 * never point at it.
 */
export function localePath(locale: string, path = ""): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return `${prefix}${path}` || "/";
}

/** Open Graph og:locale is language_TERRITORY. Bare "en" or "ja" is off-spec. */
export function ogLocale(locale: string): string {
  return locale === "ja" ? "ja_JP" : "en_US";
}

/**
 * The hreflang list. x-default points at the default locale, deciding what
 * visitors who can't pick a language get to see.
 */
export function languageAlternates(path = ""): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((one) => [one, localePath(one, path)])),
    "x-default": localePath(routing.defaultLocale, path),
  };
}
