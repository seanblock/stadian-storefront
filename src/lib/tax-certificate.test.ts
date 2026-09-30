import { describe, expect, it } from "vitest";
import { parseCertificateStates, resaleExemption } from "./tax-certificate";

describe("parseCertificateStates", () => {
  it("normalizes and flags unknown codes", () => {
    expect(parseCertificateStates("ny, nj NY")).toEqual({ states: ["NY", "NJ"], invalid: [] });
    expect(parseCertificateStates("all")).toEqual({ states: ["ALL"], invalid: [] });
    expect(parseCertificateStates("NY, QQ").invalid).toEqual(["QQ"]);
  });
});

describe("resaleExemption", () => {
  it("is omitted when blank and normalized otherwise", () => {
    expect(resaleExemption("", "123")).toBeUndefined();
    expect(resaleExemption("ny", " ST120-9 ")).toEqual({ states: ["NY"], certificateNumber: "ST120-9" });
  });
});
