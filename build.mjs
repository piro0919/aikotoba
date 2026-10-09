import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

await build({
  entryPoints: ["src/popup.ts", "src/import-page.ts"],
  outdir: "dist",
  bundle: true,
  format: "esm",
  target: "firefox140",
});

for (const file of ["manifest.json", "popup.html", "import.html", "style.css", "icons"]) {
  await cp(`src/${file}`, `dist/${file}`, { recursive: true });
}
