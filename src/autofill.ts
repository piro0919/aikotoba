// Runs inside the page via scripting.executeScript, so it must not reference
// anything outside its own body.
export function fillCode(code: string): void {
  const KEYWORDS = ["2fa", "otp", "authenticator", "factor", "code", "totp"];
  // Fields whose names contain a keyword but are not for a one-time code.
  const NOT_OTP = ["postal", "zip", "country", "promo", "coupon", "area", "gift", "voucher"];
  const TEXT_TYPES = ["text", "number", "tel", "password"];

  const canOverwrite = (input: HTMLInputElement) =>
    input.value === "" || /^(\d{6}|\d{8})$/.test(input.value);

  const fill = (input: HTMLInputElement) => {
    // Use the native setter so frameworks that track the value (React etc.) notice the change.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, code);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const inputs = [...document.getElementsByTagName("input")].filter(
    (input) => TEXT_TYPES.includes(input.type) && canOverwrite(input),
  );

  const oneTimeCode = inputs.find((input) => input.autocomplete === "one-time-code");
  if (oneTimeCode) {
    fill(oneTimeCode);
    return;
  }

  // The field the user put the cursor in wins over guessing from names.
  const active = document.activeElement;
  if (active instanceof HTMLInputElement && inputs.includes(active)) {
    fill(active);
    return;
  }

  const named = inputs.find((input) => {
    const name = `${input.name} ${input.id} ${input.autocomplete}`.toLowerCase();
    return (
      KEYWORDS.some((keyword) => name.includes(keyword)) &&
      !NOT_OTP.some((word) => name.includes(word))
    );
  });
  if (named) {
    fill(named);
    return;
  }

  const firstText = inputs.find((input) => input.type !== "password");
  if (firstText) {
    fill(firstText);
  }
}
