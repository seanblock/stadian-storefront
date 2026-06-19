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
}

const fieldId = (idPrefix: string, name: string) => `${idPrefix}${name}`;

export function AddressFields({
  prefix = "",
  idPrefix = "",
  section,
}: AddressFieldsProps) {
  const [country, setCountry] = useState("US");
  const ac = (token: string) => (section ? `${section} ${token}` : token);

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
        />
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
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId(idPrefix, "state")}>State</Label>
          {country === "US" ? (
            <Select name={`${prefix}state`} required>
              <SelectTrigger
                id={fieldId(idPrefix, "state")}
                className="w-full"
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
          ) : (
            <Input
              id={fieldId(idPrefix, "state")}
              name={`${prefix}state`}
              type="text"
              placeholder="State / Province / Region"
              autoComplete={ac("address-level1")}
            />
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
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId(idPrefix, "country")}>Country</Label>
          <Select
            name={`${prefix}country`}
            value={country}
            onValueChange={(value) => setCountry((value as string) ?? "US")}
            required
          >
            <SelectTrigger
              id={fieldId(idPrefix, "country")}
              className="w-full"
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
        </div>
      </div>
    </div>
  );
}
