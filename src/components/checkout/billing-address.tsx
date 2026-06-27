"use client";

import { AddressFields } from "@/components/checkout/address-fields";

interface BillingAddressProps {
  sameAsShipping: boolean;
  onSameAsShippingChange: (same: boolean) => void;
  errors?: Record<string, string | undefined>;
  onValidityRecheck?: () => void;
  showAllErrors?: boolean;
}

export function BillingAddress({
  sameAsShipping,
  onSameAsShippingChange,
  errors,
  onValidityRecheck,
  showAllErrors,
}: BillingAddressProps) {
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
        <AddressFields
          prefix="billing_"
          idPrefix="billing_"
          section="billing"
          errors={errors}
          onValidityRecheck={onValidityRecheck}
          showAllErrors={showAllErrors}
        />
      )}
    </div>
  );
}
