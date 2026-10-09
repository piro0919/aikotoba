// Runs inside the page via scripting.executeScript, so it must not reference
// anything outside its own body.
export function fillCode(code: string): void {
  const KEYWORDS = ["2fa", "otp", "authenticator", "factor", "code", "totp"];
  const TEXT_TYPES = ["text", "number", "tel", "password"];

  const canOverwrite = (input: HTMLInputElement) =>
    input.value === "" || /^(\d{6}|\d{8})$/.test(input.value);

  const fill = (input: HTMLInputElement) => {
    if (!canOverwrite(input)) {
      return;
    }
    // Use the native setter so frameworks that track the value (React etc.) notice the change.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, code);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const inputs = [...document.getElementsByTagName("input")].filter((input) =>
    TEXT_TYPES.includes(input.type),
  );
  if (inputs.length === 0) {
    return;
  }

  const named = inputs.find((input) => {
    const name = `${input.name} ${input.id} ${input.autocomplete}`.toLowerCase();
    return KEYWORDS.some((keyword) => name.includes(keyword));
  });
  if (named) {
    fill(named);
    return;
  }

  const active = document.activeElement;
  if (active instanceof HTMLInputElement) {
    fill(active);
    return;
  }

  const firstEmpty = inputs.find((input) => input.type !== "password" && canOverwrite(input));
  if (firstEmpty) {
    fill(firstEmpty);
  }
}
