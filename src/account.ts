import type { Algorithm } from "./totp";

export interface Account {
  id: string;
  issuer: string;
  account: string;
  secretHex: string;
  digits: number;
  period: number;
  algorithm: Algorithm;
}

const collator = new Intl.Collator("ja", { sensitivity: "base", numeric: true });

export function sortByName(accounts: Account[]): Account[] {
  return [...accounts].sort(
    (a, b) => collator.compare(a.issuer, b.issuer) || collator.compare(a.account, b.account),
  );
}

export const RECENT_LIMIT = 3;

export function pickRecent(accounts: Account[], recentIds: string[]): Account[] {
  return recentIds
    .map((id) => accounts.find((account) => account.id === id))
    .filter((account): account is Account => account !== undefined)
    .slice(0, RECENT_LIMIT);
}

export function pushRecent(recentIds: string[], id: string): string[] {
  return [id, ...recentIds.filter((recentId) => recentId !== id)].slice(0, RECENT_LIMIT);
}
