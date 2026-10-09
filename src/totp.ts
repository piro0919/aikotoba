export type Algorithm = "SHA-1" | "SHA-256" | "SHA-512";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32ToHex(base32: string): string {
  const cleaned = base32.replace(/[\s=]/g, "").toUpperCase();
  let bits = "";
  for (const char of cleaned) {
    const value = BASE32_CHARS.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }
    bits += value.toString(2).padStart(5, "0");
  }
  let hex = "";
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    hex += parseInt(bits.slice(i, i + 8), 2).toString(16).padStart(2, "0");
  }
  return hex;
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function generateTotp(
  secretHex: string,
  { digits = 6, period = 30, algorithm = "SHA-1" as Algorithm, now = Date.now() } = {},
): Promise<string> {
  const counter = Math.floor(now / 1000 / period);
  const message = new Uint8Array(8);
  new DataView(message.buffer).setBigUint64(0, BigInt(counter));

  const key = await crypto.subtle.importKey(
    "raw",
    hexToBytes(secretHex),
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"],
  );
  const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", key, message));

  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    (hmac[offset + 1]! << 16) |
    (hmac[offset + 2]! << 8) |
    hmac[offset + 3]!;
  return (binary % 10 ** digits).toString().padStart(digits, "0");
}

export function secondsLeft(period: number, now = Date.now()): number {
  return period - (Math.floor(now / 1000) % period);
}
