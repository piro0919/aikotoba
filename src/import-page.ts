import { EncryptedBackupError, mergeAccounts, parseBackup } from "./backup";
import { load, saveAccounts } from "./storage";

const input = document.getElementById("file") as HTMLInputElement;
const result = document.getElementById("result")!;

input.addEventListener("change", async () => {
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  input.value = "";

  try {
    const parsed = parseBackup(await file.text());
    const stored = await load();
    const merged = mergeAccounts(stored.accounts, parsed.accounts, () => crypto.randomUUID());
    await saveAccounts(merged.accounts);

    const lines = [`${merged.added}件を読み込みました。`];
    const duplicated = parsed.accounts.length - merged.added;
    if (duplicated > 0) {
      lines.push(`${duplicated}件は重複していたため飛ばしました。`);
    }
    if (parsed.skipped > 0) {
      lines.push(`${parsed.skipped}件は対応していない形式のため飛ばしました。`);
    }
    result.textContent = lines.join("\n");
    result.className = "";
  } catch (error) {
    result.textContent =
      error instanceof EncryptedBackupError
        ? "暗号化されたバックアップは読み込めません。暗号化しない形式で書き出したファイルを選んでください。"
        : "このファイルは読み込めませんでした。";
    result.className = "error";
  }
});
