import { pickRecent, pushRecent, sortByName, type Account } from "./account";
import { fillCode } from "./autofill";
import { load, saveRecentIds } from "./storage";
import { generateTotp, secondsLeft } from "./totp";

const list = document.getElementById("list")!;
const importButton = document.getElementById("import")!;
const headerBar = document.getElementById("period")!;

const DEFAULT_PERIOD = 30;

let recentIds: string[] = [];
const cards: { account: Account; code: HTMLElement; bar: HTMLElement | null; counter: number }[] = [];

importButton.addEventListener("click", async () => {
  await browser.tabs.create({ url: browser.runtime.getURL("import.html") });
  window.close();
});

function createCard(account: Account): HTMLElement {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "card";

  const issuer = document.createElement("div");
  issuer.className = "issuer";
  issuer.textContent = account.issuer || account.account;

  const code = document.createElement("div");
  code.className = "code";

  const name = document.createElement("div");
  name.className = "account";
  name.textContent = account.issuer ? account.account : "";

  card.append(issuer, code, name);

  let bar: HTMLElement | null = null;
  if (account.period !== DEFAULT_PERIOD) {
    bar = document.createElement("div");
    bar.className = "bar";
    card.append(bar);
  }
  cards.push({ account, code, bar, counter: -1 });

  card.addEventListener("click", async () => {
    // Compute now rather than reading the card, which may be blank before the
    // first tick or a period behind until the next one.
    const value = await generateTotp(account.secretHex, account);
    code.textContent = value;
    await navigator.clipboard.writeText(value);
    autofill(value);
    card.classList.add("copied");
    name.textContent = "コピーしました";
    setTimeout(() => {
      card.classList.remove("copied");
      name.textContent = account.issuer ? account.account : "";
    }, 1200);
    recentIds = pushRecent(recentIds, account.id);
    await saveRecentIds(recentIds);
  });

  return card;
}

async function autofill(value: string) {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) {
    return;
  }
  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillCode,
      args: [value],
    });
  } catch {
    // Pages like about: or addons.mozilla.org don't allow scripts.
  }
}

function createSection(title: string, accounts: Account[]): HTMLElement {
  const section = document.createElement("section");
  const heading = document.createElement("h2");
  heading.textContent = title;
  section.append(heading, ...accounts.map(createCard));
  return section;
}

function updateBar(bar: HTMLElement, period: number, now: number) {
  const left = secondsLeft(period, now);
  bar.style.setProperty("--left", String(left / period));
  bar.classList.toggle("ending", left <= 5);
  bar.classList.toggle("reset", left === period);
}

async function tick() {
  const now = Date.now();
  updateBar(headerBar, DEFAULT_PERIOD, now);
  await Promise.all(
    cards.map(async (card) => {
      const { account, code, bar } = card;
      const counter = Math.floor(now / 1000 / account.period);
      if (counter !== card.counter) {
        card.counter = counter;
        code.textContent = await generateTotp(account.secretHex, { ...account, now });
      }
      if (bar) {
        updateBar(bar, account.period, now);
      }
    }),
  );
}

async function render() {
  const stored = await load();
  recentIds = stored.recentIds;

  if (stored.accounts.length === 0) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "empty";
    button.textContent = "バックアップを読み込む";
    button.addEventListener("click", () => importButton.click());
    list.append(button);
    return;
  }

  headerBar.hidden = false;
  const recent = pickRecent(stored.accounts, recentIds);
  if (recent.length > 0) {
    list.append(createSection("最近", recent));
  }
  list.append(createSection("すべて", sortByName(stored.accounts)));

  await tick();
  setInterval(tick, 1000);
}

render();
