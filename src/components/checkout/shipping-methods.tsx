"use client";

import { useEffect } from "react";
import type { ShippingOption } from "@stadian/storefront-sdk";
import { formatCurrency } from "@/lib/utils";

interface ShippingMethodsProps {
  options: ShippingOption[];
  value: string | undefined;
  onChange: (methodId: string) => void;
}

export function ShippingMethods({
  options,
  value,
  onChange,
}: ShippingMethodsProps) {
  // Auto-select the first option on mount or when options change
  useEffect(() => {
    if (options.length > 0 && !value) {
      onChange(options[0].method_id);
    }
  }, [options, value, onChange]);

  // Render nothing if no options
  if (options.length === 0) {
    return null;
  }

  // Single option: auto-selected, show as static (no radio interaction needed)
  if (options.length === 1) {
    const opt = options[0];
    return (
      <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
        <span className="font-medium">{opt.method_name}</span>
        <span className="tabular-nums text-muted-foreground">
          {opt.is_free ? "Free" : formatCurrency(opt.price)}
        </span>
      </div>
    );
  }

  // Multiple options: show radio list
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => {
        const isSelected = value === opt.method_id;
        return (
          <label
            key={opt.method_id}
            className={`flex cursor-pointer items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors ${
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping_method"
                value={opt.method_id}
                checked={isSelected}
                onChange={() => onChange(opt.method_id)}
                className="accent-primary"
              />
              <span className="font-medium">{opt.method_name}</span>
            </div>
            <span className="tabular-nums text-muted-foreground">
              {opt.is_free ? "Free" : formatCurrency(opt.price)}
            </span>
          </label>
        );
      })}
    </div>
  );
}
