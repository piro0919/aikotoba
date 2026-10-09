import type { Account } from "./account";
import { base32ToHex, type Algorithm } from "./totp";

export class EncryptedBackupError extends Error {}

export interface ParseResult {
  accounts: Omit<Account, "id">[];
  skipped: number;
}

const ALGORITHMS: Record<string, Algorithm> = {
  SHA1: "SHA-1",
  SHA256: "SHA-256",
  SHA512: "SHA-512",
};

interface RawEntry {
  type?: unknown;
  secret?: unknown;
  issuer?: unknown;
  account?: unknown;
  digits?: unknown;
  period?: unknown;
  algorithm?: unknown;
  encrypted?: unknown;
  dataType?: unknown;
}

function toAccount(
  type: string,
  secret: string,
  fields: { issuer?: unknown; account?: unknown; digits?: unknown; period?: unknown; algorithm?: unknown },
): Omit<Account, "id"> | null {
  const rawAlgorithm = fields.algorithm ?? "SHA1";
  if (typeof rawAlgorithm !== "string") {
    return null;
  }
  const algorithm = ALGORITHMS[rawAlgorithm.toUpperCase().replace("-", "")];
  const digits = fields.digits ?? 6;
  const period = fields.period ?? 30;
  if (
    !algorithm ||
    !Number.isInteger(digits) ||
    (digits as number) < 6 ||
    (digits as number) > 10 ||
    !Number.isInteger(period) ||
    (period as number) <= 0
  ) {
    return null;
  }
  let secretHex: string;
  if (type === "totp") {
    try {
      secretHex = base32ToHex(secret);
    } catch {
      return null;
    }
  } else if (type === "hex") {
    secretHex = secret.replace(/\s/g, "").toLowerCase();
    if (!/^([0-9a-f]{2})+$/.test(secretHex)) {
      return null;
    }
  } else {
    return null;
  }
  if (secretHex === "") {
    return null;
  }
  return {
    issuer: typeof fields.issuer === "string" ? fields.issuer : "",
    account: typeof fields.account === "string" ? fields.account : "",
    secretHex,
    digits: digits as number,
    period: period as number,
    algorithm,
  };
}

function parseJson(data: Record<string, unknown>): ParseResult {
  if ("key" in data) {
    throw new EncryptedBackupError();
  }
  const accounts: Omit<Account, "id">[] = [];
  let skipped = 0;
  for (const value of Object.values(data)) {
    if (typeof value !== "object" || value === null) {
      continue;
    }
    const entry = value as RawEntry;
    if (entry.dataType === "Key") {
      throw new EncryptedBackupError();
    }
    if (entry.encrypted || entry.dataType === "EncOTPStorage") {
      throw new EncryptedBackupError();
    }
    if (typeof entry.secret !== "string" || entry.secret === "") {
      continue;
    }
    const type = typeof entry.type === "string" ? entry.type : "totp";
    const account = toAccount(type, entry.secret, entry);
    if (account) {
      accounts.push(account);
    } else {
      skipped++;
    }
  }
  return { accounts, skipped };
}

function parseOtpauthLines(text: string): ParseResult {
  const accounts: Omit<Account, "id">[] = [];
  let skipped = 0;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("otpauth://")) {
      continue;
    }
    let url: URL;
    let label: string;
    try {
      url = new URL(trimmed);
      label = decodeURIComponent(url.pathname.replace(/^\//, ""));
    } catch {
      skipped++;
      continue;
    }
    const separator = label.indexOf(":");
    const labelIssuer = separator === -1 ? "" : label.slice(0, separator);
    const labelAccount = separator === -1 ? label : label.slice(separator + 1);
    const params = url.searchParams;
    const digits = params.get("digits");
    const period = params.get("period");
    const account = toAccount(url.host, params.get("secret") ?? "", {
      issuer: params.get("issuer") || labelIssuer,
      account: labelAccount.trim(),
      digits: digits ? Number(digits) : undefined,
      period: period ? Number(period) : undefined,
      algorithm: params.get("algorithm") ?? undefined,
    });
    if (account) {
      accounts.push(account);
    } else {
      skipped++;
    }
  }
  return { accounts, skipped };
}

export function parseBackup(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return parseOtpauthLines(text);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { accounts: [], skipped: 0 };
  }
  return parseJson(data as Record<string, unknown>);
}

export function mergeAccounts(
  existing: Account[],
  incoming: Omit<Account, "id">[],
  createId: () => string,
): { accounts: Account[]; added: number } {
  const keyOf = (account: Omit<Account, "id">) =>
    `${account.secretHex}\n${account.issuer}\n${account.account}`;
  const seen = new Set(existing.map(keyOf));
  const accounts = [...existing];
  let added = 0;
  for (const account of incoming) {
    const key = keyOf(account);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    accounts.push({ ...account, id: createId() });
    added++;
  }
  return { accounts, added };
}
