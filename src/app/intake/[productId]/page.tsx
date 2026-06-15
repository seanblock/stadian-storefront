"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { getIntakeForm, submitIntakeForm } from "@/app/actions/intake";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StorefrontIntakeForm } from "@stadian/storefront-sdk";

interface IntakeField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

function normalizeField(raw: Record<string, unknown>, index: number): IntakeField {
  return {
    key: String(raw.key ?? raw.name ?? raw.id ?? `field_${index}`),
    label: String(raw.label ?? raw.name ?? `Field ${index + 1}`),
    type: String(raw.type ?? "text"),
    required: Boolean(raw.required),
    options: Array.isArray(raw.options)
      ? (raw.options as unknown[]).map(String)
      : undefined,
    placeholder: raw.placeholder ? String(raw.placeholder) : undefined,
  };
}

export default function IntakeFormPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [productId, setProductId] = useState<string | null>(null);
  const [form, setForm] = useState<StorefrontIntakeForm | null>(null);
  const [fields, setFields] = useState<IntakeField[]>([]);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setProductId(p.productId));
  }, [params]);

  // Auth guard
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  const fetchForm = useCallback(async (pid: string) => {
    try {
      setFetching(true);
      const data = await getIntakeForm(pid);
      setForm(data);
      const normalized = (data.fields ?? []).map((f, i) =>
        normalizeField(f as Record<string, unknown>, i)
      );
      setFields(normalized);
      const initialResponses: Record<string, unknown> = {};
      normalized.forEach((f) => {
        initialResponses[f.key] = f.type === "checkbox" ? false : "";
      });
      setResponses(initialResponses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load intake form.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (productId && isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchForm is a useCallback async fetcher; setState is indirect, not inline
      fetchForm(productId);
    }
  }, [productId, isAuthenticated, fetchForm]);

  function handleChange(key: string, value: unknown) {
    setResponses((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setSubmitting(true);
    try {
      const submission = await submitIntakeForm({
        intakeFormId: form.id,
        productId: form.product_id ?? undefined,
        responses,
      });
      router.push(`/account/intake/${submission.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading || fetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (error && !form) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{form.name}</CardTitle>
          {form.description && (
            <CardDescription>{form.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && (
                    <span className="ml-0.5 text-destructive">*</span>
                  )}
                </Label>

                {field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    name={field.key}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={String(responses[field.key] ?? "")}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                ) : field.type === "select" && field.options ? (
                  <select
                    id={field.key}
                    name={field.key}
                    required={field.required}
                    value={String(responses[field.key] ?? "")}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="" disabled>
                      Select an option
                    </option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={field.key}
                      name={field.key}
                      required={field.required}
                      checked={Boolean(responses[field.key])}
                      onChange={(e) => handleChange(field.key, e.target.checked)}
                      className="size-4 rounded border border-input"
                    />
                    <span className="text-sm text-muted-foreground">
                      {field.placeholder ?? field.label}
                    </span>
                  </div>
                ) : (
                  <Input
                    id={field.key}
                    name={field.key}
                    type={field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={String(responses[field.key] ?? "")}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={submitting} className="mt-2">
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
