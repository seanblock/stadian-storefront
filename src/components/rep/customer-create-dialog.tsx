"use client";

import { useState, type FormEvent } from "react";
import type { RepCustomer } from "@stadian/storefront-sdk";
import { createRepCustomer } from "@/app/actions/rep";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

/** "＋ New customer" — creates the account on the spot; the customer claims it
 *  via the emailed set-password invite. */
export function CustomerCreateDialog({
  onCreated,
}: {
  onCreated: (customer: RepCustomer) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    const result = await createRepCustomer({
      email: String(data.get("email") ?? ""),
      firstName: String(data.get("first_name") ?? ""),
      lastName: String(data.get("last_name") ?? ""),
      phone: String(data.get("phone") ?? "") || undefined,
      customerType: isBusiness ? "business" : "individual",
      companyName: isBusiness
        ? String(data.get("company_name") ?? "") || undefined
        : undefined,
      sendInvite: true,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setOpen(false);
    onCreated(result.data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="h-12 gap-2 text-base" />
        }
      >
        <UserPlus className="size-5" />
        New customer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email invite to set a password and claim the
            account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-3">
          {error && (
            <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="rep-cc-first">First name</Label>
              <Input id="rep-cc-first" name="first_name" required className="h-11" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rep-cc-last">Last name</Label>
              <Input id="rep-cc-last" name="last_name" className="h-11" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="rep-cc-email">Email</Label>
            <Input
              id="rep-cc-email"
              name="email"
              type="email"
              required
              className="h-11"
              autoComplete="off"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="rep-cc-phone">Phone (optional)</Label>
            <Input
              id="rep-cc-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              className="h-11"
              autoComplete="off"
            />
          </div>

          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-5 accent-[#0a1a2e]"
              checked={isBusiness}
              onChange={(e) => setIsBusiness(e.target.checked)}
            />
            Business / wholesale account
          </label>

          {isBusiness && (
            <div className="grid gap-1.5">
              <Label htmlFor="rep-cc-company">Company name</Label>
              <Input id="rep-cc-company" name="company_name" required className="h-11" />
            </div>
          )}

          <Button type="submit" disabled={submitting} className="h-12 text-base">
            {submitting ? "Creating…" : "Create customer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
