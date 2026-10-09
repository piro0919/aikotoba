/** @type {import('next-sitemap').IConfig} */
const siteUrl = "https://aikotoba.kkweb.io";

const locales = ["en", "ja"];
const defaultLocale = "en";

// The default locale has no prefix, matching localePrefix: "as-needed".
// next-sitemap reads Next's build output as is, so left alone it lists /en.
// /en is not a real page but a 307 to /, so Google would get URLs that
// disagree with the canonical
function splitLocale(url) {
  const matched = url.match(new RegExp(`^/(${locales.join("|")})(/.*)?$`));

  return matched
    ? { locale: matched[1], path: matched[2] || "" }
    : { locale: defaultLocale, path: url };
}

function pathFor(locale, path) {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;

  return `${prefix}${path}` || "/";
}

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  // Routes that return images, not pages
  exclude: ["/opengraph-image", "/*/opengraph-image"],
  transform: async (config, url) => {
    const { locale, path } = splitLocale(url);

    return {
      loc: pathFor(locale, path),
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: [
        ...locales.map((one) => ({
          href: `${siteUrl}${pathFor(one, path) === "/" ? "" : pathFor(one, path)}`,
          hreflang: one,
          hrefIsAbsolute: true,
        })),
        {
          href: `${siteUrl}${pathFor(defaultLocale, path) === "/" ? "" : pathFor(defaultLocale, path)}`,
          hreflang: "x-default",
          hrefIsAbsolute: true,
        },
      ],
    };
  },
};
