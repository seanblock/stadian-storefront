"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Pay-by-link hand-off: QR to scan on the spot, copy button, email state. */
export function PayLinkResult({
  url,
  emailSentTo,
  onResend,
}: {
  url: string;
  emailSentTo?: string | null;
  onResend?: () => Promise<boolean>;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: "#0a1a2e" } })
      .then((data) => {
        if (!cancelled) setQr(data);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the URL is visible below */
    }
  }

  async function resend() {
    if (!onResend) return;
    setResendState("sending");
    const ok = await onResend();
    setResendState(ok ? "sent" : "failed");
    if (ok) setTimeout(() => setResendState("idle"), 3000);
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-[#d4a951]/50 bg-[#f3ead5]/40 p-6">
      {qr && (
        // Data-URL QR (generated client-side) — next/image adds nothing here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qr}
          alt="Scan to pay"
          className="size-48 rounded-lg border border-border bg-white p-2"
        />
      )}
      <p className="text-center text-sm text-muted-foreground">
        Have the customer scan to pay, or share the link:
      </p>
      <p className="max-w-full truncate rounded-md bg-white px-3 py-2 font-mono text-xs">
        {url}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="outline" className="h-11 gap-2" onClick={copy}>
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        {onResend && (
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2"
            disabled={resendState === "sending"}
            onClick={resend}
          >
            <Mail className="size-4" />
            {resendState === "sending"
              ? "Sending…"
              : resendState === "sent"
                ? "Sent ✓"
                : resendState === "failed"
                  ? "Failed — retry"
                  : "Resend email"}
          </Button>
        )}
      </div>
      {emailSentTo && (
        <p className="text-center text-xs text-muted-foreground">
          Payment link emailed to <strong>{emailSentTo}</strong>
        </p>
      )}
    </div>
  );
}
