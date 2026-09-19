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
  /** Initial values; remount with a new key when the selected customer changes. */
  defaultValues?: Partial<Record<"line1" | "line2" | "city" | "state" | "zip" | "country", string>>;
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
  /** When true, show error messages and aria-invalid (only after a submit attempt). */
  showErrors?: boolean;
}

const fieldId = (idPrefix: string, name: string) => `${idPrefix}${name}`;

export function AddressFields({
  defaultValues = {},
  prefix = "",
  idPrefix = "",
  section,
  onStateChange,
  errors,
  onValidityRecheck,
  showErrors = false,
}: AddressFieldsProps) {
  const [country, setCountry] = useState(defaultValues.country || "US");
  const [showLine2, setShowLine2] = useState(!!defaultValues.line2);
  const [showCountry, setShowCountry] = useState(!!defaultValues.country && defaultValues.country !== "US");
  // City + state are controlled so a ZIP lookup can auto-fill them.
  const [city, setCity] = useState(defaultValues.city || "");
  const [stateValue, setStateValue] = useState(defaultValues.state || "");

  const ac = (token: string) => (section ? `${section} ${token}` : token);
  const countryLabel =
    COUNTRIES.find((c) => c.value === country)?.label ?? country;

  // US ZIP → city/state autofill (free, keyless; fails silently to manual entry).
  async function lookupZip(zip: string) {
    if (country !== "US" || !/^\d{5}$/.test(zip)) return;
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        places?: Array<{
          "place name"?: string;
          "state abbreviation"?: string;
        }>;
      };
      const place = data.places?.[0];
      if (!place) return;
      setCity(place["place name"] ?? "");
      const abbr = place["state abbreviation"] ?? "";
      setStateValue(abbr);
      onStateChange?.(abbr);
      requestAnimationFrame(() => onValidityRecheck?.());
    } catch {
      // ignore — the shopper can still type city/state manually
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Address line 1 */}
      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId(idPrefix, "line1")}>Address line 1</Label>
        <Input
          id={fieldId(idPrefix, "line1")}
          name={`${prefix}line1`}
          defaultValue={defaultValues.line1}
          type="text"
          placeholder="123 Main St"
          required
          autoComplete={ac("address-line1")}
          aria-invalid={showErrors && !!errors?.[`${prefix}line1`]}
          onChange={() => onValidityRecheck?.()}
        />
        {showErrors && errors?.[`${prefix}line1`] && (
          <p className="mt-1 text-sm text-destructive">{errors[`${prefix}line1`]}</p>
        )}
      </div>

      {/* Address line 2 — collapsed by default to cut the visible field count */}
      {showLine2 ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId(idPrefix, "line2")}>
            Address line 2{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id={fieldId(idPrefix, "line2")}
            name={`${prefix}line2`}
            defaultValue={defaultValues.line2}
            type="text"
            placeholder="Apt, suite, unit, etc."
            autoComplete={ac("address-line2")}
            onChange={() => onValidityRecheck?.()}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowLine2(true)}
          className="self-start text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          + Add apartment, suite, etc.
        </button>
      )}

      {/* City + State */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId(idPrefix, "city")}>City</Label>
          <Input
            id={fieldId(idPrefix, "city")}
            name={`${prefix}city`}
            type="text"
            required
            value={city}
            autoComplete={ac("address-level2")}
            aria-invalid={showErrors && !!errors?.[`${prefix}city`]}
            onChange={(e) => {
              setCity(e.target.value);
              onValidityRecheck?.();
            }}
          />
          {showErrors && errors?.[`${prefix}city`] && (
            <p className="mt-1 text-sm text-destructive">{errors[`${prefix}city`]}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId(idPrefix, "state")}>State</Label>
          {country === "US" ? (
            <>
              <Select
                name={`${prefix}state`}
                required
                value={stateValue}
                onValueChange={(value) => {
                  const v = (value as string) ?? "";
                  setStateValue(v);
                  onStateChange?.(v);
                  requestAnimationFrame(() => onValidityRecheck?.());
                }}
              >
                <SelectTrigger
                  id={fieldId(idPrefix, "state")}
                  className="w-full"
                  aria-invalid={showErrors && !!errors?.[`${prefix}state`]}
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
              {showErrors && errors?.[`${prefix}state`] && (
                <p className="mt-1 text-sm text-destructive">{errors[`${prefix}state`]}</p>
              )}
            </>
          ) : (
            <>
              <Input
                id={fieldId(idPrefix, "state")}
                name={`${prefix}state`}
                type="text"
                placeholder="State / Province / Region"
                value={stateValue}
                autoComplete={ac("address-level1")}
                aria-invalid={showErrors && !!errors?.[`${prefix}state`]}
                onChange={(e) => {
                  setStateValue(e.target.value);
                  onStateChange?.(e.target.value);
                  onValidityRecheck?.();
                }}
              />
              {showErrors && errors?.[`${prefix}state`] && (
                <p className="mt-1 text-sm text-destructive">{errors[`${prefix}state`]}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ZIP + Country (country collapsed for the US-default case) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId(idPrefix, "zip")}>ZIP code</Label>
          <Input
            id={fieldId(idPrefix, "zip")}
            name={`${prefix}zip`}
            defaultValue={defaultValues.zip}
            type="text"
            inputMode="numeric"
            required
            autoComplete={ac("postal-code")}
            aria-invalid={showErrors && !!errors?.[`${prefix}zip`]}
            onChange={(e) => {
              onValidityRecheck?.();
              void lookupZip(e.target.value.trim());
            }}
          />
          {showErrors && errors?.[`${prefix}zip`] && (
            <p className="mt-1 text-sm text-destructive">{errors[`${prefix}zip`]}</p>
          )}
        </div>
        <div className="flex flex-col justify-end gap-2">
          {showCountry ? (
            <>
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
                  aria-invalid={showErrors && !!errors?.[`${prefix}country`]}
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
            </>
          ) : (
            <p className="pb-2 text-sm text-muted-foreground">
              {section === "billing" ? "Billing country:" : "Shipping to"} <span className="text-foreground">{countryLabel}</span>
              <button
                type="button"
                onClick={() => setShowCountry(true)}
                className="ml-2 underline underline-offset-2 hover:text-foreground"
              >
                Change
              </button>
              {/* Keep country in the form data while the field is collapsed. */}
              <input type="hidden" name={`${prefix}country`} value={country} />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
