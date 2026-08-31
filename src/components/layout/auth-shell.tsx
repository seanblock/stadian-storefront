import type { ReactNode } from "react";

/**
 * Split-screen frame for the account pages (register, and anything else that
 * asks for personal details). A bare centered card reads as a generic form on
 * a generic site; the navy panel carries the brand and the reasons to hand
 * over the details, so the form itself feels like part of the store.
 *
 * Server-safe on purpose — the register page renders its invite-only state on
 * the server and its form on the client, and both use this.
 */

const NAVY = "#0a1a2e";
const CREAM = "#f3ead5";
const CREAM_DIM = "#b8b0a0";
const GOLD = "#d4a951";

export interface AuthShellProps {
  /** Small gold uppercase line above the panel headline. */
  eyebrow: string;
  /** Panel headline — short, two lines at most. */
  headline: ReactNode;
  /** One sentence under the headline. */
  blurb: string;
  /** Reassurance points, listed with gold markers down the panel. */
  points: readonly string[];
  children: ReactNode;
}

export function AuthShell({
  eyebrow,
  headline,
  blurb,
  points,
  children,
}: AuthShellProps) {
  return (
    <div className="grid lg:min-h-[calc(100vh-5.5rem)] lg:grid-cols-[1fr_1.05fr] lg:items-start">
      {/* Brand panel. Collapses to a banner above the form on phones, and
          sticks on desktop — the form runs longer than the viewport, and a
          panel that scrolled away would leave a wall of empty navy behind. */}
      <aside
        className="grain relative isolate overflow-hidden px-6 py-10 sm:px-10 lg:sticky lg:top-[5.5rem] lg:flex lg:h-[calc(100vh-5.5rem)] lg:flex-col lg:justify-center lg:px-14 lg:py-20"
        style={{ backgroundColor: NAVY, color: CREAM }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-40 blur-3xl"
          style={{ background: `radial-gradient(circle, ${GOLD}44, transparent 70%)` }}
        />

        <div className="relative z-10 lg:max-w-md">
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.28em]"
            style={{ color: GOLD }}
          >
            {eyebrow}
          </p>

          <h1
            className="mt-4 text-balance text-[clamp(1.75rem,3.4vw,2.75rem)] font-black uppercase leading-[1.02] tracking-[-0.015em]"
            style={{ color: CREAM }}
          >
            {headline}
          </h1>

          <p
            className="mt-4 max-w-sm text-balance text-sm leading-relaxed sm:text-base"
            style={{ color: CREAM_DIM }}
          >
            {blurb}
          </p>

          <ul className="mt-8 hidden gap-4 lg:grid">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm">
                <span
                  aria-hidden
                  className="mt-[0.45rem] size-1.5 shrink-0 rounded-full"
                  style={{ background: GOLD }}
                />
                <span style={{ color: CREAM }}>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form column */}
      {/* Matches the panel's full-bleed height so a short form (sign in) sits
          centred against it, while a long one (register) just scrolls. */}
      <main className="flex items-start justify-center px-5 py-12 sm:px-10 lg:min-h-[calc(100vh-5.5rem)] lg:items-center lg:py-20">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

/** Small uppercase rule that separates groups of fields within a form. */
export function FieldGroupHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2 first:pt-0">
      <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {children}
      </span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}
