# Aikotoba

A Firefox extension that shows your two-factor authentication codes. Click a card to copy the code and fill it into the page you have open.

Accounts are listed by service name, with the three you copied last on top.

Landing page: https://aikotoba.kkweb.io

## Install

Download the signed `.xpi` from the [latest release](https://github.com/piro0919/aikotoba/releases/latest) and open it in Firefox. Updates arrive automatically.

## Moving from Authenticator

1. In Authenticator, open the settings (gear icon) → Backup, and download an unencrypted backup file
2. In Aikotoba, click the download icon at the top right and pick that file
3. Delete the backup file afterwards — it holds every secret in plain text

## Development

```sh
pnpm install
pnpm build      # outputs dist/
pnpm test
pnpm typecheck
pnpm lint
```

To try it, open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and pick `dist/manifest.json`.

## License

MIT
