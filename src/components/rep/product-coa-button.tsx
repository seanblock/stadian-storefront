"use client";

import { useRef, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { getRepProductCoas, type RepResult } from "@/app/actions/rep";
import type { ProductCoa } from "@/lib/product-coas";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export function ProductCoaButton({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<RepResult<ProductCoa[]> | null>(null);
  const request = useRef(0);

  async function load() {
    const currentRequest = ++request.current;
    setResult(null);
    try {
      const next = await getRepProductCoas(slug);
      if (currentRequest === request.current) setResult(next);
    } catch {
      if (currentRequest === request.current) {
        setResult({ ok: false, code: "NETWORK", message: "Could not load certificates. Please try again.", status: 0 });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (nextOpen) void load();
      else request.current++;
    }}>
      <DialogTrigger
        type="button"
        aria-label={`View COA for ${name}`}
        className="mt-1 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium text-[#0a1a2e] hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <FileText className="size-4" aria-hidden="true" />
        View COA
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="pr-6">
          <DialogTitle>Certificates of Analysis</DialogTitle>
          <DialogDescription>{name}</DialogDescription>
        </DialogHeader>
        {!result ? (
          <p role="status" className="text-muted-foreground">Loading certificates…</p>
        ) : !result.ok ? (
          <div className="space-y-3">
            <p role="alert">{result.message}</p>
            <button type="button" onClick={() => void load()} className="min-h-11 rounded-md border px-4 font-medium hover:bg-muted">Try again</button>
          </div>
        ) : result.data.length === 0 ? (
          <p className="text-muted-foreground">No COA has been uploaded for this product.</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {result.data.map((document) => (
              <li key={document.url}>
                <a href={document.url} target="_blank" rel="noopener noreferrer"
                  className="flex min-h-12 items-center justify-between gap-3 rounded-md border p-3 font-medium hover:bg-muted">
                  <span className="min-w-0 break-words">{document.name}<span className="sr-only"> (opens in a new tab)</span></span>
                  <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
