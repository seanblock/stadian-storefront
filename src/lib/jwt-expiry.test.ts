import { describe, it, expect } from "vitest";
import { getJwtExpiry, isTokenExpired } from "./jwt-expiry";

function makeToken(payload: object): string {
  const enc = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${enc({ alg: "HS256", typ: "JWT" })}.${enc(payload)}.fake-signature`;
}

const NOW_MS = 1_800_000_000_000; // fixed clock
const NOW_S = NOW_MS / 1000;

describe("getJwtExpiry", () => {
  it("reads the exp claim", () => {
    expect(getJwtExpiry(makeToken({ sub: "c1", exp: 1234567890 }))).toBe(
      1234567890
    );
  });

  it("returns null when there is no exp claim", () => {
    expect(getJwtExpiry(makeToken({ sub: "c1" }))).toBeNull();
  });

  it("returns null for a non-numeric exp", () => {
    expect(getJwtExpiry(makeToken({ exp: "tomorrow" }))).toBeNull();
  });

  it("returns null for non-JWT strings", () => {
    expect(getJwtExpiry("not-a-jwt")).toBeNull();
    expect(getJwtExpiry("only.two")).toBeNull();
    expect(getJwtExpiry("")).toBeNull();
  });

  it("returns null for a JWT-shaped string with a garbage payload", () => {
    expect(getJwtExpiry("aaa.!!!not-base64!!!.ccc")).toBeNull();
  });
});

describe("isTokenExpired", () => {
  it("is false for a token expiring in the future", () => {
    const token = makeToken({ exp: NOW_S + 3600 });
    expect(isTokenExpired(token, 0, NOW_MS)).toBe(false);
  });

  it("is true for a token that already expired", () => {
    const token = makeToken({ exp: NOW_S - 1 });
    expect(isTokenExpired(token, 0, NOW_MS)).toBe(true);
  });

  it("treats a token inside the skew window as expired", () => {
    const token = makeToken({ exp: NOW_S + 30 });
    expect(isTokenExpired(token, 60, NOW_MS)).toBe(true);
    expect(isTokenExpired(token, 0, NOW_MS)).toBe(false);
  });

  it("is false at exactly one second past the skew window", () => {
    const token = makeToken({ exp: NOW_S + 61 });
    expect(isTokenExpired(token, 60, NOW_MS)).toBe(false);
  });

  it("treats an unreadable token as not expired (the API decides)", () => {
    expect(isTokenExpired("opaque-token", 60, NOW_MS)).toBe(false);
    expect(isTokenExpired(makeToken({ sub: "no-exp" }), 60, NOW_MS)).toBe(false);
  });
});
