"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface VariantOption {
  id: string;
  name: string;
  slug: string;
  dosage: string | null;
  form_type: string | null;
  default_price: number | null;
}

interface VariantSelectorProps {
  variants: VariantOption[];
  currentProductId: string;
}

export function VariantSelector({
  variants,
  currentProductId,
}: VariantSelectorProps) {
  const byForm = new Map<string, VariantOption[]>();
  for (const v of variants) {
    const key = v.form_type ?? "other";
    const list = byForm.get(key) ?? [];
    list.push(v);
    byForm.set(key, list);
  }

  const forms = Array.from(byForm.keys());
  const hasMultipleForms = forms.length > 1;
  const currentVariant = variants.find((v) => v.id === currentProductId);
  const currentForm = currentVariant?.form_type ?? forms[0];
  const dosageOptions = byForm.get(currentForm) ?? [];

  return (
    <div className="flex flex-col gap-5">
      {hasMultipleForms && (
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Form
          </span>
          <div className="flex flex-wrap gap-2">
            {forms.map((form) => {
              const isActive = form === currentForm;
              const target = byForm.get(form)![0];

              return (
                <Link
                  key={form}
                  href={`/products/${target.slug}`}
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg border-2 px-4 py-2.5 text-sm font-medium capitalize transition-all",
                    isActive
                      ? "border-foreground text-foreground"
                      : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  {form}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Strength
        </span>
        <div className="flex flex-wrap gap-2">
          {dosageOptions.map((v) => {
            const isActive = v.id === currentProductId;
            const label = v.dosage ?? v.name;

            return (
              <Link
                key={v.id}
                href={`/products/${v.slug}`}
                className={cn(
                  "inline-flex min-w-[3.5rem] items-center justify-center rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
