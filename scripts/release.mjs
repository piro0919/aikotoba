// Build, upload to AMO, create the version, fetch the signed xpi, and add the
// version to lp/public/updates.json in one pass.
// web-ext sign returns Unknown JWT iss intermittently for the same credentials,
// so this talks to the API directly.
//
// Usage:
//   AMO_JWT_ISSUER=user:... AMO_JWT_SECRET=... node scripts/release.mjs

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ISSUER = process.env.AMO_JWT_ISSUER;
const SECRET = process.env.AMO_JWT_SECRET;

if (!ISSUER || !SECRET) {
  console.error("Set AMO_JWT_ISSUER and AMO_JWT_SECRET.");
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://addons.mozilla.org/api/v5";
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src", "manifest.json"), "utf8"),
);
const GUID = manifest.browser_specific_settings.gecko.id;
const REPO = "piro0919/aikotoba";
const UPDATES = path.join(ROOT, "lp", "public", "updates.json");
const VERSION = manifest.version;

/** AMO tokens are short lived, so a fresh one is minted per request. */
function token() {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const iat = Math.floor(Date.now() / 1000);
  const head = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({
    exp: iat + 60,
    iat,
    iss: ISSUER,
    jti: crypto.randomUUID(),
  });
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(`${head}.${body}`)
    .digest("base64url");

  return `${head}.${body}.${signature}`;
}

const api = (target, init = {}) =>
  fetch(target.startsWith("http") ? target : `${BASE}${target}`, {
    ...init,
    headers: { Authorization: `JWT ${token()}`, ...init.headers },
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function poll(label, attempts, interval, check) {
  for (let i = 0; i < attempts; i += 1) {
    const result = await check();

    if (result) return result;

    await sleep(interval);
  }

  throw new Error(`Timed out waiting for ${label}.`);
}

// 1. Build the package
execFileSync("pnpm", ["build"], { cwd: ROOT, stdio: "inherit" });
execFileSync(
  "pnpm",
  ["exec", "web-ext", "build", "--source-dir", "dist", "--overwrite-dest"],
  { cwd: ROOT, stdio: "inherit" },
);

const artifacts = path.join(ROOT, "web-ext-artifacts");
const zip = fs
  .readdirSync(artifacts)
  .filter((name) => name.endsWith(`-${VERSION}.zip`))
  .map((name) => path.join(artifacts, name))
  .at(0);

if (!zip) throw new Error(`No zip found for version ${VERSION}.`);

// 2. Upload and wait for validation
const form = new FormData();

form.append("upload", new Blob([fs.readFileSync(zip)]), path.basename(zip));
form.append("channel", "unlisted");

const uploaded = await (
  await api("/addons/upload/", { body: form, method: "POST" })
).json();

if (!uploaded.uuid) throw new Error(`Upload failed: ${JSON.stringify(uploaded)}`);

console.log(`upload: ${uploaded.uuid}`);

const validated = await poll("validation", 40, 5000, async () => {
  const state = await (await api(`/addons/upload/${uploaded.uuid}/`)).json();

  return state.processed ? state : null;
});

if (!validated.valid) {
  console.error(JSON.stringify(validated.validation?.messages ?? validated, null, 2));
  throw new Error("Validation failed.");
}

// 3. Create the version. The very first release has no add-on on AMO yet,
// so the versions endpoint 404s; PUT on the add-on creates it with this version.
let created = await api(`/addons/addon/${GUID}/versions/`, {
  body: JSON.stringify({ upload: uploaded.uuid }),
  headers: { "Content-Type": "application/json" },
  method: "POST",
});
let version = await created.json();

if (created.status === 404) {
  created = await api(`/addons/addon/${GUID}/`, {
    body: JSON.stringify({ version: { upload: uploaded.uuid } }),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });
  version = (await created.json()).version ?? {};
}

if (!created.ok) throw new Error(`Version creation failed: ${JSON.stringify(version)}`);

console.log(`version: ${version.version} (${version.id})`);

// 4. Wait until signing completes and the file turns into an xpi
const url = await poll("signing", 40, 10000, async () => {
  const detail = await (
    await api(`/addons/addon/${GUID}/versions/${version.id}/`)
  ).json();

  return detail.file?.url?.endsWith(".xpi") ? detail.file.url : null;
});
const out = path.join(artifacts, `aikotoba-${VERSION}.xpi`);

const signed = Buffer.from(await (await api(url)).arrayBuffer());

fs.writeFileSync(out, signed);
console.log(`signed: ${out}`);

// 5. List the version in the update manifest Firefox polls through update_url.
// The link points at the GitHub release asset, so the release has to exist
// before this file is deployed with the landing page.
const updates = JSON.parse(fs.readFileSync(UPDATES, "utf8"));
const entries = updates.addons[GUID].updates.filter(
  (entry) => entry.version !== VERSION,
);

entries.push({
  version: VERSION,
  update_link: `https://github.com/${REPO}/releases/download/v${VERSION}/${path.basename(out)}`,
  update_hash: `sha256:${crypto.createHash("sha256").update(signed).digest("hex")}`,
});
updates.addons[GUID].updates = entries;
fs.writeFileSync(UPDATES, `${JSON.stringify(updates, null, 2)}\n`);
console.log(`updates.json: added ${VERSION}`);
