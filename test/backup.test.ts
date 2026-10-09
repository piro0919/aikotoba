import { describe, expect, it } from "vitest";
import { EncryptedBackupError, mergeAccounts, parseBackup } from "../src/backup";

describe("parseBackup", () => {
  it("reads Authenticator's plain JSON export", () => {
    const text = JSON.stringify({
      h1: { account: "me@example.com", issuer: "GitHub", secret: "MZXW6YTBOI", type: "totp", index: 0 },
      h2: { account: "x", secret: "666f6f626172", type: "hex", digits: 8, period: 60, algorithm: "SHA256" },
      h3: { account: "steam", secret: "MZXW6YTBOI", type: "steam" },
      h4: { account: "counter", secret: "MZXW6YTBOI", type: "hotp", counter: 1 },
    });
    const result = parseBackup(text);
    expect(result.skipped).toBe(2);
    expect(result.accounts).toEqual([
      { issuer: "GitHub", account: "me@example.com", secretHex: "666f6f626172", digits: 6, period: 30, algorithm: "SHA-1" },
      { issuer: "", account: "x", secretHex: "666f6f626172", digits: 8, period: 60, algorithm: "SHA-256" },
    ]);
  });

  it("refuses encrypted exports", () => {
    expect(() =>
      parseBackup(JSON.stringify({ h1: { secret: "U2FsdGVkX1", encrypted: true }, key: { enc: "x", hash: "y" } })),
    ).toThrow(EncryptedBackupError);
  });

  it("reads otpauth lines", () => {
    const text = [
      "otpauth://totp/Slack:me%40example.com?secret=MZXW6YTBOI&issuer=Slack",
      "otpauth://totp/plain?secret=MZXW6YTBOI&digits=8&period=60&algorithm=SHA512",
      "otpauth://hotp/Old:me?secret=MZXW6YTBOI&counter=0",
    ].join("\r\n");
    const result = parseBackup(text);
    expect(result.skipped).toBe(1);
    expect(result.accounts).toEqual([
      { issuer: "Slack", account: "me@example.com", secretHex: "666f6f626172", digits: 6, period: 30, algorithm: "SHA-1" },
      { issuer: "", account: "plain", secretHex: "666f6f626172", digits: 8, period: 60, algorithm: "SHA-512" },
    ]);
  });
});

describe("parseBackup with bad values", () => {
  it("skips entries with invalid digits, period or algorithm", () => {
    const text = JSON.stringify({
      a: { secret: "MZXW6YTBOI", type: "totp", period: 0 },
      b: { secret: "MZXW6YTBOI", type: "totp", digits: "abc" },
      c: { secret: "MZXW6YTBOI", type: "totp", algorithm: 1 },
      d: { secret: "MZXW6YTBOI", type: "totp" },
    });
    const result = parseBackup(text);
    expect(result.skipped).toBe(3);
    expect(result.accounts).toHaveLength(1);
  });

  it("skips only the otpauth line with a broken escape", () => {
    const text = [
      "otpauth://totp/100%off%:me?secret=MZXW6YTBOI",
      "otpauth://totp/GitHub:me?secret=MZXW6YTBOI&period=abc",
      "otpauth://totp/GitHub:me?secret=MZXW6YTBOI&issuer=",
    ].join("\n");
    const result = parseBackup(text);
    expect(result.skipped).toBe(2);
    expect(result.accounts.map((a) => a.issuer)).toEqual(["GitHub"]);
  });
});

describe("mergeAccounts", () => {
  it("skips accounts already registered", () => {
    const base = { issuer: "A", account: "a", secretHex: "00", digits: 6, period: 30, algorithm: "SHA-1" as const };
    let n = 0;
    const result = mergeAccounts([{ ...base, id: "x" }], [base, { ...base, account: "b" }], () => `id${n++}`);
    expect(result.added).toBe(1);
    expect(result.accounts.map((a) => a.id)).toEqual(["x", "id0"]);
  });
});
