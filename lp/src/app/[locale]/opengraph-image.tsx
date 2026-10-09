import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { routing } from "@/i18n/routing";

export const alt = "Aikotoba";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* ビルド時に焼く。動的なままだと public/ が関数側に含まれず、
   本番で icon.png を読めずに 500 になる */
export function generateStaticParams(): { locale: string }[] {
  return routing.locales.map((locale) => ({ locale }));
}

/* 出るのは kk-web の一覧で176px、X のカードで500px 前後。
   その大きさで残るのはアイコンと名前と1行だけ。色はアイコンから取る */
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
  /* 見出しの書体はサイトと同じ Zen Maru Gothic。使う文字だけに絞ったものを
     同梱している。文言を変えたら assets/README.md の手順で作り直す */
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
