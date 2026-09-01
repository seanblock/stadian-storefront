"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getTurnstileSiteKey } from "@/app/actions/branding";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      action?: string;
    },
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Load the Turnstile script once per page, however many widgets mount. */
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Let a later mount retry rather than caching the failure forever.
      scriptPromise = null;
      reject(new Error("Turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface TurnstileProps {
  /** Fires with a fresh token, and with "" whenever the token stops being valid. */
  onToken: (token: string) => void;
  /** Change this to force a new challenge — e.g. after a rejected submit. A
   *  Turnstile token is single-use, so a retry needs a fresh one. */
  resetKey?: number;
  /** Labels the challenge in Cloudflare's analytics ("register", "checkout"). */
  action?: string;
  className?: string;
}

/**
 * Renders the Turnstile challenge using the TENANT's own site key.
 *
 * The key comes from the store's branding, not from this deployment's env, so
 * each merchant's storefront is protected by a widget in their own Cloudflare
 * account. A merchant who hasn't configured bot protection gets no key, this
 * renders nothing, and the API requires no token — a store can take orders
 * before it has a Cloudflare account.
 */
export function Turnstile({
  onToken,
  resetKey = 0,
  action,
  className,
}: TurnstileProps) {
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Held in a ref so re-rendering the widget doesn't depend on the caller
  // memoising its callback. Written in an effect, not during render.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  const render = useCallback(() => {
    const el = containerRef.current;
    if (!el || !siteKey || !window.turnstile) return;

    if (widgetIdRef.current !== null) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }
    widgetIdRef.current = window.turnstile.render(el, {
      sitekey: siteKey,
      action,
      theme: "auto",
      callback: (token) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(""),
      "error-callback": () => onTokenRef.current(""),
    });
  }, [action, siteKey]);

  useEffect(() => {
    let cancelled = false;
    getTurnstileSiteKey()
      .then((key) => {
        if (!cancelled) setSiteKey(key);
      })
      .catch(() => {
        // Branding unreachable. The API is the authority on whether a token is
        // required, so leave the widget unrendered rather than guessing.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (!cancelled) render();
      })
      .catch(() => {
        // Script blocked or offline: no token will arrive, and the server
        // rejects the submit with a retryable message.
        if (!cancelled) onTokenRef.current("");
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [render, resetKey, siteKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} className={className} />;
}
