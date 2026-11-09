"use client";

import { createContext, useContext, type ReactNode } from "react";

const AgeGateContext = createContext(false);

/**
 * Whether the age gate is covering the page. The page renders underneath for
 * scanners, so its client effects run too: anything that writes, spends a
 * one-time token or redirects must wait until this is false. Confirming
 * reloads the page, so the value never flips in place.
 */
export function AgeGateProvider({ gated, children }: { gated: boolean; children: ReactNode }) {
  return <AgeGateContext.Provider value={gated}>{children}</AgeGateContext.Provider>;
}

export function useAgeGated(): boolean {
  return useContext(AgeGateContext);
}
