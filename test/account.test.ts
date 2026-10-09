import { describe, expect, it } from "vitest";
import { pickRecent, pushRecent, sortByName, type Account } from "../src/account";

const make = (id: string, issuer: string, account: string): Account => ({
  id,
  issuer,
  account,
  secretHex: "00",
  digits: 6,
  period: 30,
  algorithm: "SHA-1",
});

describe("sortByName", () => {
  it("sorts by issuer, then account, ignoring case", () => {
    const accounts = [
      make("1", "Slack", "a"),
      make("2", "github", "z"),
      make("3", "Cloudflare", "a"),
      make("4", "GitHub", "b"),
    ];
    expect(sortByName(accounts).map((a) => a.id)).toEqual(["3", "4", "2", "1"]);
  });
});

describe("pushRecent", () => {
  it("moves the id to the front and keeps three", () => {
    expect(pushRecent(["a", "b", "c"], "d")).toEqual(["d", "a", "b"]);
    expect(pushRecent(["a", "b", "c"], "c")).toEqual(["c", "a", "b"]);
  });
});

describe("pickRecent", () => {
  it("drops ids of removed accounts", () => {
    const accounts = [make("a", "A", ""), make("b", "B", "")];
    expect(pickRecent(accounts, ["x", "b", "a"]).map((a) => a.id)).toEqual(["b", "a"]);
  });
});
