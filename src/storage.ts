import type { Account } from "./account";

interface Stored {
  accounts: Account[];
  recentIds: string[];
}

export async function load(): Promise<Stored> {
  const stored = await browser.storage.local.get(["accounts", "recentIds"]);
  return {
    accounts: (stored.accounts as Account[] | undefined) ?? [],
    recentIds: (stored.recentIds as string[] | undefined) ?? [],
  };
}

export async function saveAccounts(accounts: Account[]): Promise<void> {
  await browser.storage.local.set({ accounts });
}

export async function saveRecentIds(recentIds: string[]): Promise<void> {
  await browser.storage.local.set({ recentIds });
}
