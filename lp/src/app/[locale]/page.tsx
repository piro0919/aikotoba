import { Coffee, Download, Github } from "lucide-react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

const GITHUB_URL = "https://github.com/piro0919/aikotoba";
const COFFEE_URL = "https://buymeacoffee.com/piro0919";
const RELEASE_URL = "https://github.com/piro0919/aikotoba/releases/latest";

type Entry = {
  account: string;
  code: string;
  issuer: string;
};

const RECENT: Entry[] = [{ issuer: "GitHub", account: "me@example.com", code: "482913" }];

const ALL: Entry[] = [
  { issuer: "Cloudflare", account: "me@example.com", code: "305127" },
  { issuer: "GitHub", account: "me@example.com", code: "482913" },
  { issuer: "Slack", account: "me@example.com", code: "770246" },
  { issuer: "Vercel", account: "me@example.com", code: "139584" },
];

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Page({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations();

  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <Image
            alt="Aikotoba"
            className="rounded-lg"
            height={28}
            priority={true}
            src="/icon.png"
            width={28}
          />
          <span className="text-sm font-semibold">Aikotoba</span>
        </div>
        <a
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-shu"
          href={GITHUB_URL}
        >
          <Github size={15} strokeWidth={1.75} />
          {t("Hero.viewOnGithub")}
        </a>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pt-10 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pt-16 lg:pb-28">
        <div className="min-w-0">
          <p className="font-mono text-xs tracking-[0.25em] text-shu uppercase">
            Firefox Extension
          </p>
          <h1 className="mt-6 font-display text-4xl leading-[1.2] font-bold tracking-tight whitespace-pre-line sm:text-5xl">
            {t("Hero.title")}
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-ink-2">{t("Hero.description")}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full bg-shu px-6 py-3.5 text-base font-semibold text-paper transition-colors hover:bg-shu-deep"
              href={RELEASE_URL}
            >
              <Download size={18} strokeWidth={2} />
              {t("Hero.download")}
            </a>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full border border-hairline px-6 py-3.5 text-base font-semibold transition-colors hover:border-shu hover:text-shu"
              href={GITHUB_URL}
            >
              <Github size={18} strokeWidth={2} />
              {t("Hero.viewOnGithub")}
            </a>
          </div>
          <p className="mt-6 text-sm text-ink-2">{t("Hero.migrate")}</p>
          <p className="mt-2 font-mono text-xs text-ink-2">{t("Hero.note")}</p>
        </div>

        <div className="min-w-0">
          <PopupMockup
            allLabel={t("Mockup.all")}
            copiedLabel={t("Mockup.copied")}
            recentLabel={t("Mockup.recent")}
          />
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-10 sm:flex-row sm:justify-between">
        <span className="text-sm text-ink-2">
          Made by{" "}
          <a className="text-ink-1 transition-colors hover:text-shu" href={GITHUB_URL}>
            piro0919
          </a>
        </span>
        <div className="flex items-center gap-5">
          <a
            className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-2 transition-colors hover:text-shu"
            href={COFFEE_URL}
          >
            <Coffee size={13} strokeWidth={1.75} />
            Buy Me a Coffee
          </a>
          <a
            className="font-mono text-xs text-ink-2 transition-colors hover:text-shu"
            href={GITHUB_URL}
          >
            {t("Hero.viewOnGithub")}
          </a>
        </div>
      </footer>
    </main>
  );
}

type MockupProps = {
  allLabel: string;
  copiedLabel: string;
  recentLabel: string;
};

/* The extension's popup, redrawn. The GitHub card in "All" is the one being
   clicked, and the same account sits in "Recent" above it. */
function PopupMockup({ allLabel, copiedLabel, recentLabel }: MockupProps): ReactNode {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-card-line bg-card shadow-[0_30px_60px_-30px_rgba(42,29,23,0.35)]">
      <div className="relative flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold">Aikotoba</p>
        <Download className="text-ink-2" size={16} strokeWidth={2} />
        <span
          aria-hidden="true"
          className="countdown absolute inset-x-0 bottom-0 h-[3px] origin-left bg-shu"
        />
      </div>
      <div className="space-y-3 px-4 pt-3 pb-4">
        <Section entries={RECENT} label={recentLabel} />
        <Section activeIssuer="GitHub" copiedLabel={copiedLabel} entries={ALL} label={allLabel} />
      </div>
    </div>
  );
}

function Section({
  activeIssuer,
  copiedLabel,
  entries,
  label,
}: {
  activeIssuer?: string;
  copiedLabel?: string;
  entries: Entry[];
  label: string;
}): ReactNode {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold text-ink-2">{label}</p>
      <div className="space-y-1.5">
        {entries.map((entry) => {
          const active = entry.issuer === activeIssuer;

          return (
            <div
              className={`rounded-lg border border-card-line px-3 py-2 ${active ? "copy-card" : ""}`}
              key={entry.issuer}
            >
              <p className="text-[13px] font-semibold">{entry.issuer}</p>
              <p className="text-lg leading-tight font-medium tabular-nums">{entry.code}</p>
              <div className="relative text-xs text-ink-2">
                <p className={`truncate ${active ? "copy-name" : ""}`}>{entry.account}</p>
                {active ? (
                  <p aria-hidden="true" className="copy-label absolute inset-0 text-shu">
                    {copiedLabel}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
