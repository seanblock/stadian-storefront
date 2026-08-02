import { describe, it, expect, vi, beforeEach } from "vitest";
import { StadianAuthError } from "@stadian/storefront-sdk";

const state = vi.hoisted(() => ({
  rawToken: undefined as string | undefined,
  validToken: undefined as string | undefined,
}));

vi.mock("./customer-token", () => ({
  getCustomerToken: async () => state.rawToken,
  getValidCustomerToken: async () => state.validToken,
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): never => {
    // Mirror Next's behavior: redirect() throws and never returns.
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

import {
  fetchWithOptionalAuth,
  fetchWithRequiredAuth,
  loginRedirectUrl,
} from "./authed-fetch";

beforeEach(() => {
  state.rawToken = undefined;
  state.validToken = undefined;
});

describe("loginRedirectUrl", () => {
  it("encodes the return path", () => {
    expect(loginRedirectUrl("/account/orders", false)).toBe(
      "/login?redirect=%2Faccount%2Forders"
    );
  });

  it("adds reason=expired for lapsed sessions", () => {
    expect(loginRedirectUrl("/account", true)).toBe(
      "/login?redirect=%2Faccount&reason=expired"
    );
  });
});

describe("fetchWithOptionalAuth", () => {
  it("passes the live token through", async () => {
    state.rawToken = state.validToken = "live-token";
    const fetcher = vi.fn(async (t: string | undefined) => `result:${t}`);
    await expect(fetchWithOptionalAuth(fetcher)).resolves.toBe(
      "result:live-token"
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("retries signed-out when the token turns out to be stale", async () => {
    state.rawToken = state.validToken = "stale-but-looked-fine";
    const fetcher = vi.fn(async (t: string | undefined) => {
      if (t) throw new StadianAuthError("Invalid or expired token");
      return "public-data";
    });
    await expect(fetchWithOptionalAuth(fetcher)).resolves.toBe("public-data");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenLastCalledWith(undefined);
  });

  it("never sends an already-expired token", async () => {
    state.rawToken = "expired-token";
    state.validToken = undefined;
    const fetcher = vi.fn(async (t: string | undefined) => t);
    await expect(fetchWithOptionalAuth(fetcher)).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("does not retry an auth error from a signed-out call", async () => {
    const err = new StadianAuthError("nope");
    const fetcher = vi.fn(async () => {
      throw err;
    });
    await expect(fetchWithOptionalAuth(fetcher)).rejects.toBe(err);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("propagates non-auth errors untouched", async () => {
    state.rawToken = state.validToken = "live-token";
    const err = new Error("network down");
    await expect(
      fetchWithOptionalAuth(async () => {
        throw err;
      })
    ).rejects.toBe(err);
  });
});

describe("fetchWithRequiredAuth", () => {
  it("passes the live token through", async () => {
    state.rawToken = state.validToken = "live-token";
    await expect(
      fetchWithRequiredAuth("/account", async (t) => `orders-for:${t}`)
    ).resolves.toBe("orders-for:live-token");
  });

  it("redirects to plain login when there is no session at all", async () => {
    await expect(
      fetchWithRequiredAuth("/account/orders", async () => "unreachable")
    ).rejects.toThrow("NEXT_REDIRECT:/login?redirect=%2Faccount%2Forders");
  });

  it("redirects with reason=expired when the token has lapsed", async () => {
    state.rawToken = "expired-token";
    state.validToken = undefined;
    await expect(
      fetchWithRequiredAuth("/account/orders", async () => "unreachable")
    ).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirect=%2Faccount%2Forders&reason=expired"
    );
  });

  it("redirects with reason=expired when the API rejects the token", async () => {
    state.rawToken = state.validToken = "revoked-token";
    await expect(
      fetchWithRequiredAuth("/account", async () => {
        throw new StadianAuthError("Invalid or expired token");
      })
    ).rejects.toThrow("NEXT_REDIRECT:/login?redirect=%2Faccount&reason=expired");
  });

  it("propagates non-auth errors untouched", async () => {
    state.rawToken = state.validToken = "live-token";
    const err = new Error("boom");
    await expect(
      fetchWithRequiredAuth("/account", async () => {
        throw err;
      })
    ).rejects.toBe(err);
  });
});
