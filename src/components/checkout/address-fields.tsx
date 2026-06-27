"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES, US_STATES } from "@/lib/address-data";

interface AddressFieldsProps {
  /** Prefix for field `name` attributes, e.g. "" for shipping or "billing_". */
  prefix?: string;
  /** Prefix for element ids so multiple forms can coexist on one page. */
  idPrefix?: string;
  /** autoComplete section, e.g. "shipping" or "billing". */
  section?: string;
  /** Called when the state/province field value changes. */
  onStateChange?: (state: string) => void;
  /** Validation errors keyed by full field name (e.g. "line1", "billing_city"). */
  errors?: Record<string, string | undefined>;
  /** Called after any field changes so the parent can recompute form validity. */
  onValidityRecheck?: () => void;
  /** When true, show all errors regardless of per-field touched state (e.g. after a submit attempt). */
  showAllErrors?: boolean;
}

const fieldId = (idPrefix: string, name: string) => `${idPrefix}${name}`;

export function AddressFields({
  prefix = "",
  idPrefix = "",
  section,
  onStateChange,
  errors,
  onValidityRecheck,
  showAllErrors = false,
}: AddressFieldsProps) {
  const [country, setCountry] = useState("US");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const ac = (token: string) => (section ? `${section} ${token}` : token);

  const markTouched = (field: string) =>
    setTouched((t) => ({ ...t, [`${prefix}${field}`]: true }));

  const showError = (field: string) =>
    (touched[`${prefix}${field}`] || showAllErrors) && !!errors?.[`${prefix}${field}`];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId(idPrefix, "line1")}>Address line 1</Label>
        <Input
          id={fieldId(idPrefix, "line1")}
          name={`${prefix}line1`}
          type="text"
          placeholder="123 Main St"
          required
          autoComplete={ac("address-line1")}
          aria-invalid={!!errors?.[`${prefix}line1`]}
          onChange={() => onValidityRecheck?.()}
          onBlur={() => markTouched("line1")}
        />
        {showError("line1") && (
          <p className="mt-1 text-sm text-destructive">{errors![`${prefix}line1`]}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId(idPrefix, "line2")}>
          Address line 2{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={fieldId(idPrefix, "line2")}
          name={`${prefix}line2`}
          type="text"
          placeholder="Apt, suite, unit, etc."
          autoComplete={ac("address-line2")}
          onChange={() => onValidityRecheck?.()}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId(idPrefix, "city")}>City</Label>
          <Input
            id={fieldId(idPrefix, "city")}
            name={`${prefix}city`}
            type="text"
            required
            autoComplete={ac("address-level2")}
            aria-invalid={!!errors?.[`${prefix}city`]}
            onChange={() => onValidityRecheck?.()}
            onBlur={() => markTouched("city")}
          />
          {showError("city") && (
            <p className="mt-1 text-sm text-destructive">{errors![`${prefix}city`]}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId(idPrefix, "state")}>State</Label>
          {country === "US" ? (
            <>
              <Select
                name={`${prefix}state`}
                required
                onValueChange={(value) => {
                  onStateChange?.((value as string) ?? "");
                  requestAnimationFrame(() => onValidityRecheck?.());
                }}
              >
                <SelectTrigger
                  id={fieldId(idPrefix, "state")}
                  className="w-full"
                  aria-invalid={!!errors?.[`${prefix}state`]}
                  onBlur={() => markTouched("state")}
                >
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showError("state") && (
                <p className="mt-1 text-sm text-destructive">{errors![`${prefix}state`]}</p>
              )}
            </>
          ) : (
            <>
              <Input
                id={fieldId(idPrefix, "state")}
                name={`${prefix}state`}
                type="text"
                placeholder="State / Province / Region"
                autoComplete={ac("address-level1")}
                aria-invalid={!!errors?.[`${prefix}state`]}
                onChange={(e) => {
                  onStateChange?.(e.target.value);
                  onValidityRecheck?.();
                }}
                onBlur={() => markTouched("state")}
              />
              {showError("state") && (
                <p className="mt-1 text-sm text-destructive">{errors![`${prefix}state`]}</p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId(idPrefix, "zip")}>ZIP code</Label>
          <Input
            id={fieldId(idPrefix, "zip")}
            name={`${prefix}zip`}
            type="text"
            required
            autoComplete={ac("postal-code")}
            aria-invalid={!!errors?.[`${prefix}zip`]}
            onChange={() => onValidityRecheck?.()}
            onBlur={() => markTouched("zip")}
          />
          {showError("zip") && (
            <p className="mt-1 text-sm text-destructive">{errors![`${prefix}zip`]}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId(idPrefix, "country")}>Country</Label>
          <Select
            name={`${prefix}country`}
            value={country}
            onValueChange={(value) => {
              setCountry((value as string) ?? "US");
              requestAnimationFrame(() => onValidityRecheck?.());
            }}
            required
          >
            <SelectTrigger
              id={fieldId(idPrefix, "country")}
              className="w-full"
              aria-invalid={!!errors?.[`${prefix}country`]}
              onBlur={() => markTouched("country")}
            >
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showError("country") && (
            <p className="mt-1 text-sm text-destructive">{errors![`${prefix}country`]}</p>
          )}
        </div>
      </div>
    </div>
  );
}
