// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { fillCode } from "../src/autofill";

const input = (id: string) => document.getElementById(id) as HTMLInputElement;

describe("fillCode", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("prefers an input whose name looks like an OTP field", () => {
    document.body.innerHTML = `<input id="user" type="text"><input id="otp" name="otp_code" type="text">`;
    fillCode("123456");
    expect(input("otp").value).toBe("123456");
    expect(input("user").value).toBe("");
  });

  it("recognises autocomplete=one-time-code", () => {
    document.body.innerHTML = `<input id="a" type="text"><input id="b" type="text" autocomplete="one-time-code">`;
    fillCode("123456");
    expect(input("b").value).toBe("123456");
  });

  it("falls back to the focused input", () => {
    document.body.innerHTML = `<input id="a" type="text"><input id="b" type="tel">`;
    input("b").focus();
    fillCode("123456");
    expect(input("b").value).toBe("123456");
    expect(input("a").value).toBe("");
  });

  it("falls back to the first empty non-password input", () => {
    document.body.innerHTML = `<input id="p" type="password"><input id="a" type="text" value="taken"><input id="b" type="text">`;
    fillCode("123456");
    expect(input("b").value).toBe("123456");
    expect(input("p").value).toBe("");
  });

  it("does not overwrite text the user typed, but replaces an old code", () => {
    document.body.innerHTML = `<input id="otp" name="otp" type="text" value="hello">`;
    fillCode("123456");
    expect(input("otp").value).toBe("hello");

    input("otp").value = "111111";
    fillCode("123456");
    expect(input("otp").value).toBe("123456");
  });

  it("ignores postal and coupon codes", () => {
    document.body.innerHTML = `<input id="zip" type="text" autocomplete="postal-code"><input id="promo" name="promo_code" type="text"><input id="otp" name="otp" type="text">`;
    fillCode("123456");
    expect(input("otp").value).toBe("123456");
    expect(input("zip").value).toBe("");
    expect(input("promo").value).toBe("");
  });

  it("prefers the focused input over a name match", () => {
    document.body.innerHTML = `<input id="named" name="verification_code" type="text"><input id="b" type="tel">`;
    input("b").focus();
    fillCode("123456");
    expect(input("b").value).toBe("123456");
    expect(input("named").value).toBe("");
  });

  it("does not fill a focused checkbox or email field", () => {
    document.body.innerHTML = `<input id="mail" type="email"><input id="box" type="checkbox" value="on"><input id="otp" name="otp" type="text">`;
    input("mail").focus();
    fillCode("123456");
    expect(input("mail").value).toBe("");
    expect(input("box").value).toBe("on");
    expect(input("otp").value).toBe("123456");
  });

  it("fires input and change events", () => {
    document.body.innerHTML = `<input id="otp" name="otp" type="text">`;
    const events: string[] = [];
    input("otp").addEventListener("input", () => events.push("input"));
    input("otp").addEventListener("change", () => events.push("change"));
    fillCode("123456");
    expect(events).toEqual(["input", "change"]);
  });
});
