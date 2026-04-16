"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BillingAddressProps {
  sameAsShipping: boolean;
  onSameAsShippingChange: (same: boolean) => void;
}

export function BillingAddress({ sameAsShipping, onSameAsShippingChange }: BillingAddressProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={sameAsShipping}
          onChange={(e) => onSameAsShippingChange(e.target.checked)}
          className="size-4 accent-primary"
        />
        Same as shipping address
      </label>

      {!sameAsShipping && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="billing_line1">Address line 1</Label>
            <Input id="billing_line1" name="billing_line1" required autoComplete="billing address-line1" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="billing_line2">
              Address line 2 <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="billing_line2" name="billing_line2" autoComplete="billing address-line2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="billing_city">City</Label>
              <Input id="billing_city" name="billing_city" required autoComplete="billing address-level2" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="billing_state">State</Label>
              <Input id="billing_state" name="billing_state" required autoComplete="billing address-level1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="billing_zip">ZIP code</Label>
              <Input id="billing_zip" name="billing_zip" required autoComplete="billing postal-code" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="billing_country">Country</Label>
              <Input id="billing_country" name="billing_country" required autoComplete="billing country" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
