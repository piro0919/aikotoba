import { describe, expect, it } from "vitest";
import { base32ToHex, generateTotp, secondsLeft } from "../src/totp";

// RFC 6238 Appendix B test vectors (8 digits)
const SHA1_SECRET = Buffer.from("12345678901234567890").toString("hex");
const SHA256_SECRET = Buffer.from("12345678901234567890123456789012").toString("hex");
const SHA512_SECRET = Buffer.from(
  "1234567890123456789012345678901234567890123456789012345678901234",
).toString("hex");

const vectors: [number, string, string, string][] = [
  [59, "94287082", "46119246", "90693936"],
  [1111111109, "07081804", "68084774", "25091201"],
  [1111111111, "14050471", "67062674", "99943326"],
  [1234567890, "89005924", "91819424", "93441116"],
  [2000000000, "69279037", "90698825", "38618901"],
  [20000000000, "65353130", "77737706", "47863826"],
];

describe("generateTotp", () => {
  it.each(vectors)("matches RFC 6238 at %i", async (time, sha1, sha256, sha512) => {
    const now = time * 1000;
    expect(await generateTotp(SHA1_SECRET, { digits: 8, now })).toBe(sha1);
    expect(await generateTotp(SHA256_SECRET, { digits: 8, algorithm: "SHA-256", now })).toBe(sha256);
    expect(await generateTotp(SHA512_SECRET, { digits: 8, algorithm: "SHA-512", now })).toBe(sha512);
  });
});

describe("base32ToHex", () => {
  it("decodes RFC 4648 vectors", () => {
    expect(base32ToHex("MZXW6YTBOI======")).toBe(Buffer.from("foobar").toString("hex"));
    expect(base32ToHex("mzxw 6ytb oi")).toBe(Buffer.from("foobar").toString("hex"));
  });

  it("rejects invalid characters", () => {
    expect(() => base32ToHex("ABC1")).toThrow();
  });
});

describe("secondsLeft", () => {
  it("counts down within the period", () => {
    expect(secondsLeft(30, 0)).toBe(30);
    expect(secondsLeft(30, 29_000)).toBe(1);
  });
});
