import { beforeEach, describe, expect, it, vi } from "vitest";

const access = vi.hoisted(() => ({ isClosed: true }));
const api = vi.hoisted(() => ({
  catalogGet: vi.fn(),
  listProducts: vi.fn(),
  request: vi.fn(),
}));

vi.mock("@/lib/store-access", () => ({
  getStoreAccess: async () => ({ isClosed: access.isClosed }),
}));
vi.mock("@/lib/customer-token", () => ({
  getValidCustomerToken: async () => "a-real-session",
}));
vi.mock("@/lib/stadian", () => ({
  getStadianClient: () => ({
    catalog: { get: api.catalogGet },
    rep: { listProducts: api.listProducts },
  }),
  getHttpClient: () => ({ request: api.request }),
}));

import { getFaq, getPage } from "./content";
import { getRepProductCoas, getRepProducts } from "./rep";

beforeEach(() => {
  vi.clearAllMocks();
  api.catalogGet.mockResolvedValue({ certificates: [] });
  api.listProducts.mockResolvedValue({ items: [] });
  api.request.mockResolvedValue({ content: { type: "doc" }, items: [{ question: "q", answer: "a" }] });
});

describe("while the store is closed", () => {
  beforeEach(() => {
    access.isClosed = true;
  });

  it("gives a signed-in caller no catalog data, without asking the API", async () => {
    expect(await getRepProductCoas("retatrutide-20mg")).toMatchObject({ ok: false, code: "STORE_CLOSED" });
    expect(await getRepProducts()).toMatchObject({ ok: false, code: "STORE_CLOSED" });
    expect(api.catalogGet).not.toHaveBeenCalled();
    expect(api.listProducts).not.toHaveBeenCalled();
  });

  it("returns no tenant copy, without asking the API", async () => {
    expect(await getPage("about")).toBeNull();
    expect(await getFaq()).toEqual([]);
    expect(api.request).not.toHaveBeenCalled();
  });
});

describe("while the store is open, or unlocked by preview", () => {
  beforeEach(() => {
    access.isClosed = false;
  });

  it("serves catalog data and tenant copy as usual", async () => {
    expect(await getRepProductCoas("retatrutide-20mg")).toMatchObject({ ok: true });
    expect(await getRepProducts()).toMatchObject({ ok: true });
    expect(await getPage("about")).toEqual({ type: "doc" });
    expect(await getFaq()).toEqual([{ question: "q", answer: "a" }]);
  });
});
