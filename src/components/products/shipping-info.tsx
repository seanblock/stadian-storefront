interface ShippingInfoProps {
  requiresColdChain?: boolean;
  freeShippingThreshold?: number;
}

export function ShippingInfo({
  requiresColdChain,
  freeShippingThreshold,
}: ShippingInfoProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
      {/* Same-day shipping */}
      <span className="inline-flex items-center gap-1.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0"
        >
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.684-.949V6h4a2 2 0 0 1 2 2v9a1 1 0 0 1-1 1h-2" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
        Same-day shipping on orders placed by 2pm EST
      </span>

      {/* Cold chain shipping */}
      {requiresColdChain && (
        <span className="inline-flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0"
          >
            <line x1="2" x2="22" y1="12" y2="12" />
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="m20 16-4-4 4-4" />
            <path d="m4 8 4 4-4 4" />
            <path d="m16 4-4 4-4-4" />
            <path d="m8 20 4-4 4 4" />
          </svg>
          Ships with cold packs for temperature protection
        </span>
      )}

      {/* Free shipping threshold */}
      {freeShippingThreshold != null && (
        <span className="inline-flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0"
          >
            <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
            <path d="m7.5 4.27 9 5.15" />
            <polyline points="3.29 7 12 12 20.71 7" />
            <line x1="12" x2="12" y1="22" y2="12" />
            <path d="m17 13 5 5m-5 0 5-5" />
          </svg>
          Free shipping on orders over ${freeShippingThreshold}
        </span>
      )}
    </div>
  );
}
