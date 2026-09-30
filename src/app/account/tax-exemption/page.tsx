"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { StorefrontTaxExemption } from "@stadian/storefront-sdk";
import { listTaxExemptions, submitTaxExemption, taxExemptionDocumentUrl } from "@/app/actions/tax-exemptions";
import {
  CERTIFICATE_STATUS_LABEL,
  CERTIFICATE_TYPES,
  MAX_CERTIFICATE_BYTES,
  parseCertificateStates,
} from "@/lib/tax-certificate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

async function uploadDocument(exemptionId: string, file: File): Promise<string | null> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`/api/account/tax-exemptions/${encodeURIComponent(exemptionId)}/document`, {
    method: "POST",
    body,
  });
  if (res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  return data.message ?? "Upload failed.";
}

/**
 * Resale / exemption certificates. Buying for resale? Submit the certificate
 * here; the store reviews it, and once verified orders shipping to the states
 * it covers are not charged sales tax.
 */
export default function TaxExemptionPage() {
  const [items, setItems] = useState<StorefrontTaxExemption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [states, setStates] = useState("");
  const [number, setNumber] = useState("");
  const [expires, setExpires] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await listTaxExemptions();
    if (res.ok) setItems(res.data);
    else setError(res.message);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async server load
    void load();
  }, [load]);

  function checkFile(f: File | null): string | null {
    if (!f) return null;
    if (!CERTIFICATE_TYPES.includes(f.type as (typeof CERTIFICATE_TYPES)[number])) return "Upload a PDF, PNG, JPEG or WebP file.";
    if (f.size > MAX_CERTIFICATE_BYTES) return "The file is larger than 4 MB.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const parsed = parseCertificateStates(states);
    if (!parsed.states.length || parsed.invalid.length) {
      setError(parsed.invalid.length ? `Unknown state: ${parsed.invalid.join(", ")}` : "Enter the states the certificate covers.");
      return;
    }
    const fileError = checkFile(file);
    if (fileError) {
      setError(fileError);
      return;
    }
    setSaving(true);
    try {
      const res = await submitTaxExemption({
        states: parsed.states,
        certificateNumber: number.trim() || undefined,
        expiresAt: expires || undefined,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      if (file) {
        const uploadError = await uploadDocument(res.data.id, file);
        if (uploadError) setError(`Certificate saved, but the document did not upload: ${uploadError}`);
      }
      setStates("");
      setNumber("");
      setExpires("");
      setFile(null);
      setMessage("Thanks — the store will review your certificate.");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function attach(exemptionId: string, f: File) {
    const fileError = checkFile(f);
    if (fileError) {
      setError(fileError);
      return;
    }
    setUploadingId(exemptionId);
    setError(await uploadDocument(exemptionId, f));
    setUploadingId(null);
    await load();
  }

  async function openDocument(exemptionId: string) {
    const res = await taxExemptionDocumentUrl(exemptionId);
    if (res.ok) window.open(res.data, "_blank", "noopener");
    else setError(res.message);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tax exemption</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buying for resale? Add your resale certificate. Once the store verifies it, orders shipping to the states
          it covers are not charged sales tax.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {message && <p className="rounded-lg border px-4 py-3 text-sm">{message}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Your certificates</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No certificates yet.</p>
          ) : (
            items.map((ex) => (
              <div key={ex.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">
                    {ex.states.join(", ")} · {CERTIFICATE_STATUS_LABEL[ex.status] ?? ex.status}
                    {ex.is_effective && <span className="ml-2 text-green-700">Tax exempt</span>}
                  </p>
                  <p className="text-muted-foreground">
                    {ex.certificate_last4 ? `No. ••••${ex.certificate_last4}` : "No number"}
                    {ex.expires_at ? ` · expires ${ex.expires_at}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {ex.has_document ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => openDocument(ex.id)}>
                      View document
                    </Button>
                  ) : ex.status === "pending_review" ? (
                    <label className="cursor-pointer rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                      {uploadingId === ex.id ? "Uploading…" : "Attach document"}
                      <input
                        type="file"
                        accept={CERTIFICATE_TYPES.join(",")}
                        className="sr-only"
                        disabled={uploadingId !== null}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) void attach(ex.id, f);
                        }}
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a certificate</CardTitle>
          <CardDescription>For New York, use Form ST-120 (Resale Certificate).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cert-states">States it covers</Label>
              <Input id="cert-states" value={states} onChange={(e) => setStates(e.target.value)} placeholder="NY" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cert-number">Certificate or sales-tax ID number</Label>
              <Input id="cert-number" value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cert-expires">Expires (if any)</Label>
              <Input id="cert-expires" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cert-file">Certificate document (PDF or image, up to 4 MB)</Label>
              <Input
                id="cert-file"
                type="file"
                accept={CERTIFICATE_TYPES.join(",")}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="submit" disabled={saving} className="justify-self-start">
              {saving ? "Submitting…" : "Submit for review"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
