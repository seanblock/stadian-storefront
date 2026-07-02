import Link from "next/link";

const BLACK = "#0a1a2e";
const BLACK_SOFT = "#06121f";
const CREAM = "#f3ead5";
const CREAM_DIM = "#b8b0a0";
const GOLD = "#d4a951";

const CHECKS = [
  {
    title: "Identity confirmed",
    body: "Mass-spectrometry verifies the compound is exactly what the label says.",
  },
  {
    title: "Purity measured",
    body: "HPLC analysis quantifies purity against our ≥99% acceptance standard.",
  },
  {
    title: "Batch on the label",
    body: "The batch number on your vial ties it to its certificate — no ambiguity.",
  },
] as const;

export function TransparencySpotlight() {
  return (
    <section
      className="relative overflow-hidden border-b border-border"
      style={{ background: BLACK, color: CREAM }}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-20 lg:px-8">
        {/* Copy */}
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.28em]"
            style={{ color: GOLD }}
          >
            Transparency
          </p>
          <h2
            className="mt-3 max-w-xl font-serif text-4xl leading-[1.08] tracking-tight sm:text-5xl"
            style={{ color: CREAM }}
          >
            Don&apos;t take our word for it.{" "}
            <span className="italic" style={{ color: GOLD }}>
              Read the lab report.
            </span>
          </h2>
          <p
            className="mt-5 max-w-lg text-base leading-relaxed"
            style={{ color: CREAM_DIM }}
          >
            Purity claims are everywhere in this market. Certificates are not.
            Every compound we sell links its third-party certificate of
            analysis right on the product page — and we&apos;ll furnish the
            certificate for any batch you&apos;ve purchased on request.
          </p>

          <ul className="mt-8 space-y-5">
            {CHECKS.map((check) => (
              <li key={check.title} className="flex gap-4">
                <span
                  className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${GOLD}22` }}
                >
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={GOLD}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: CREAM }}>
                    {check.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: CREAM_DIM }}>
                    {check.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/lab-results"
            className="mt-9 inline-flex items-center gap-3 rounded-full border px-7 py-3.5 text-sm font-medium uppercase tracking-[0.22em] transition-colors duration-300 hover:border-current"
            style={{ borderColor: `${CREAM}30`, color: CREAM }}
          >
            How we test
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Stylized COA document — labels only, no fabricated values */}
        <div aria-hidden className="relative mx-auto w-full max-w-md">
          <div
            className="absolute -inset-6 rounded-2xl opacity-40 blur-3xl"
            style={{ background: `${GOLD}22` }}
          />
          <div
            className="relative rotate-1 rounded-lg border p-7 shadow-2xl transition-transform duration-500 hover:rotate-0"
            style={{ background: CREAM, borderColor: `${GOLD}66` }}
          >
            <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: `${BLACK}22` }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: `${BLACK}99` }}>
                  Independent laboratory
                </p>
                <p className="mt-1 font-serif text-2xl" style={{ color: BLACK }}>
                  Certificate of Analysis
                </p>
              </div>
              <span
                className="flex size-11 items-center justify-center rounded-full"
                style={{ background: BLACK_SOFT }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" className="size-5">
                  <path d="M9 3h6l-1 4h-4L9 3z" />
                  <path d="M10 7v3l-3 7a3 3 0 003 4h4a3 3 0 003-4l-3-7V7" />
                </svg>
              </span>
            </div>

            <dl className="mt-5 space-y-3.5">
              {[
                ["Compound identity", "Confirmed · MS"],
                ["Purity", "Measured · HPLC"],
                ["Batch number", "Printed on vial"],
                ["Result", "Published on product page"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: `${BLACK}80` }}>
                    {label}
                  </dt>
                  <dd className="text-right text-[13px] font-semibold" style={{ color: BLACK }}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div
              className="mt-6 flex items-center justify-between rounded-md px-4 py-3"
              style={{ background: BLACK }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                Verified per batch
              </span>
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
