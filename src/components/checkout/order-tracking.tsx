import type { StorefrontOrder } from "@stadian/storefront-sdk";

const carrierSites: Record<string, string> = {
  ups: "https://www.ups.com/track?lang=eng",
  usps: "https://tools.usps.com/go/TrackConfirmAction",
  fedex: "https://www.fedex.com/en-us/tracking.html",
};

export function OrderTracking({ order }: {
  order: Partial<Pick<StorefrontOrder, "tracking_numbers" | "tracking_number" | "tracking_url">>;
}) {
  const shipments = order.tracking_numbers?.length
    ? order.tracking_numbers
    : order.tracking_number ? [{ tracking_number: order.tracking_number, carrier: null }] : [];
  if (!shipments.length) return null;
  return (
    <section aria-label="Shipment tracking" className="rounded-lg border p-4">
      <h2 className="font-medium">Shipment tracking</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {shipments.map((shipment, index) => {
          const carrier = shipment.carrier?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
          const url = carrierSites[carrier];
          return (
          <li key={`${shipment.tracking_number}-${index}`} className="break-all">
            <span className="text-muted-foreground">{shipment.carrier || "Tracking number"}: </span>
            <span className="font-medium">{shipment.tracking_number}</span>
            {url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 flex min-h-11 items-center underline">Open {shipment.carrier} tracking<span className="sr-only"> (opens in a new tab)</span></a>}
          </li>
          );
        })}
      </ul>
    </section>
  );
}
