"use client";

import Link from "next/link";
import type { CheckoutFlowResponse, CheckoutStep } from "@stadian/storefront-sdk";

interface CheckoutFlowStepsProps {
  flow: CheckoutFlowResponse | null;
}

function stepIcon(step: CheckoutStep) {
  if (step.completed) return "✓";
  if (step.required) return "!";
  return "○";
}

function stepClass(step: CheckoutStep) {
  if (step.completed) return "text-green-700";
  if (step.required) return "text-destructive";
  return "text-muted-foreground";
}

function IntakeLink({ step }: { step: CheckoutStep }) {
  if (step.intake_form_id) {
    return (
      <Link
        href={`/account/intake/${step.intake_form_id}`}
        className="ml-1 underline text-primary"
      >
        Complete intake form
      </Link>
    );
  }
  return (
    <Link href="/account" className="ml-1 underline text-primary">
      Go to your account
    </Link>
  );
}

export function CheckoutFlowSteps({ flow }: CheckoutFlowStepsProps) {
  if (!flow) return null;

  const displaySteps = flow.steps.filter((s) => s.step !== "payment");
  const hasIssues =
    displaySteps.some((s) => !s.completed && s.required) ||
    flow.blocked_products.length > 0;

  if (!hasIssues && flow.ready_to_checkout) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm flex flex-col gap-3">
      <p className="font-medium">Checkout requirements</p>

      {displaySteps.map((step) => (
        <div key={step.step} className={`flex gap-2 ${stepClass(step)}`}>
          <span className="font-mono w-4 shrink-0">{stepIcon(step)}</span>
          <div>
            <span className="font-medium">{step.title}</span>
            {step.description && (
              <span className="text-muted-foreground ml-1">
                — {step.description}
              </span>
            )}
            {!step.completed && step.step === "intake" && (
              <IntakeLink step={step} />
            )}
            {!step.completed && step.step === "age_verification" && (
              <Link href="/account" className="ml-1 underline text-primary">
                Verify age in your account
              </Link>
            )}
            {!step.completed && step.step === "disclaimer" && (
              <Link href="/account" className="ml-1 underline text-primary">
                Review disclaimer in your account
              </Link>
            )}
          </div>
        </div>
      ))}

      {flow.blocked_products.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="font-medium text-destructive">Blocked items</p>
          {flow.blocked_products.map((bp) => (
            <div key={bp.product_id} className="flex gap-2 text-destructive">
              <span className="font-mono w-4 shrink-0">✕</span>
              <span>{bp.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
