# Aikotoba

Firefox extension that shows TOTP codes. Built to replace the "Authenticator" extension (authenticator@mymindstorm), whose list order could not be sorted.

## What the first version does (and only this)

- Popup: a "最近" section with the last 3 copied accounts, then every account sorted by issuer, then account name. The name-sorted list never reorders on use; that stability is the point.
- Click a card to copy its code and autofill it into the active tab (`src/autofill.ts`, always on, no setting). It guesses the field the same way Authenticator did: OTP-looking name/id/autocomplete → focused input → first empty text input. Split one-digit boxes and inputs inside iframes are not handled.
- Import page (opened in a tab): reads Authenticator's backup — plain JSON or the one-line `otpauth://` text export.

Grow features only when they are actually missed. Next candidate: adding an account by scanning a QR code.

## Decisions

- Written from scratch, not forked. Upstream is Vue 2 + webpack and carries many features we don't want.
- TOTP uses Web Crypto directly (`src/totp.ts`), tested against RFC 6238 vectors.
- Secrets are stored as hex in `storage.local`, unencrypted. Encrypted Authenticator backups are refused on import.
- Only `totp` and `hex` entries are imported; `hotp`, `steam`, `battle` and non-SHA algorithms are skipped and counted.
- Import lives in its own tab because a Firefox popup closes when a file picker opens.
- Recent list re-renders on the next popup open, not right after a copy, so cards don't move under the cursor.

## Commands

- `pnpm build` → `dist/`
- `pnpm test`, `pnpm typecheck`, `pnpm lint` (web-ext lint on `dist/`)

## Layout

- `src/` extension source, built to `dist/` by `build.mjs` (esbuild). `assets/icon.png` is the original icon from ChatGPT; `src/icons/` are the exported sizes.
- `lp/` the landing page (Next.js + next-intl, Vercel project root). Copied from amazon-order-hide-kindle's LP and restyled with the icon's vermilion and off-white. Hero only — no feature list, by request.
- `scripts/release.mjs` AMO unlisted signing, adapted from amazon-order-hide-kindle. It talks to the AMO API directly because `web-ext sign` intermittently returns `Unknown JWT iss`.

## Release

The add-on ID is `aikotoba@piro0919` and can never change once signed.

1. Bump `version` in `src/manifest.json` (AMO never accepts the same version twice)
2. `AMO_JWT_ISSUER=... AMO_JWT_SECRET=... node scripts/release.mjs` — builds, signs, saves `web-ext-artifacts/aikotoba-X.Y.Z.xpi`, and appends the version to `lp/public/updates.json`
3. `gh release create vX.Y.Z web-ext-artifacts/aikotoba-X.Y.Z.xpi`
4. Commit and push `src/manifest.json` and `lp/public/updates.json`. The LP deploy publishes `https://aikotoba.kkweb.io/updates.json`, which installed copies poll through `update_url`

`update_link` points at the GitHub release asset, so do step 3 before step 4. Never hand-edit `update_hash`.

## Conventions

- Commit messages: English Conventional Commits, lowercase type/scope/body, no trailing period
- README and code comments in English
