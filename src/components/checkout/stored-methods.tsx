"use client";

import type { StoredPaymentMethod } from "@/app/actions/payments";
import { Label } from "@/components/ui/label";

interface StoredMethodsProps {
  methods: StoredPaymentMethod[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function StoredMethods({ methods, selected, onSelect }: StoredMethodsProps) {
  if (methods.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <Label>Saved Payment Methods</Label>
      <div className="flex flex-col gap-2">
        {methods.map((method) => (
          <label
            key={method.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              type="radio"
              name="payment-method"
              value={method.id}
              checked={selected === method.id}
              onChange={() => onSelect(method.id)}
              className="size-4 accent-primary"
            />
            <span className="flex-1 text-sm">
              {method.label}
              {method.expires_at && (
                <span className="ml-2 text-muted-foreground">
                  exp {method.expires_at}
                </span>
              )}
            </span>
            {method.is_default && (
              <span className="text-xs text-muted-foreground">Default</span>
            )}
          </label>
        ))}
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5">
          <input
            type="radio"
            name="payment-method"
            value=""
            checked={selected === null}
            onChange={() => onSelect(null)}
            className="size-4 accent-primary"
          />
          <span className="flex-1 text-sm">Use a new payment method</span>
        </label>
      </div>
    </div>
  );
}
