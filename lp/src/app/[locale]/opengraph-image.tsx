import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { routing } from "@/i18n/routing";

export const alt = "Aikotoba";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Rendered at build time. Left dynamic, public/ is not bundled with the
   function and production returns 500 because icon.png can't be read */
export function generateStaticParams(): { locale: string }[] {
  return routing.locales.map((locale) => ({ locale }));
}

/* Shown at 176px in the kk-web list and around 500px on X cards. At that
   size only the icon, the name and one line survive. Colours come from the icon */
const PAPER = "#fbf6ec";
const INK = "#2a1d17";
const SHU = "#e34a2f";

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<ImageResponse> {
  const { locale } = await params;
  const isJa = locale === "ja";
  /* Same heading face as the site, Zen Maru Gothic, bundled as a subset of
     just the characters used. Rebuild it per assets/README.md when the copy changes */
  const [icon, font] = await Promise.all([
    readFile(join(process.cwd(), "public/icon.png")),
    readFile(join(process.cwd(), "assets/ZenMaruGothic-Bold-subset.ttf")),
  ]);
  const iconSrc = `data:image/png;base64,${icon.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: PAPER,
        display: "flex",
        gap: 64,
        height: "100%",
        padding: "0 90px",
        width: "100%",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: next/image is not available in ImageResponse */}
      <img alt="" height={280} src={iconSrc} style={{ borderRadius: 56 }} width={280} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            color: INK,
            display: "flex",
            fontSize: 104,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1.1,
          }}
        >
          Aikotoba
        </div>
        <div style={{ color: SHU, display: "flex", fontSize: 40, marginTop: 20 }}>
          {isJa
            ? "2段階認証のコードを、ブラウザでひと押し"
            : "Two-factor codes, one click in your browser"}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ data: font, name: "Zen Maru Gothic", style: "normal", weight: 700 }],
    },
  );
}
