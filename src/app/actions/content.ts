"use server";

import { getHttpClient } from "@/lib/stadian";
import { getStoreAccess } from "@/lib/store-access";
import type { TiptapDocument } from "@/components/tiptap-renderer";

export interface FAQItem {
  question: string;
  answer: string;
}

export async function getPage(
  slug: "about" | "terms" | "privacy" | "returns",
): Promise<TiptapDocument | null> {
  // Tenant-written copy can name products. Pages call this even behind the closed
  // sign, and so can anyone directly, so the check lives here rather than in each page.
  if ((await getStoreAccess()).isClosed) return null;
  try {
    const http = getHttpClient();
    const data = await http.request<{ content: TiptapDocument | null }>(
      "GET",
      `/pages/${slug}`,
    );
    return data.content ?? null;
  } catch {
    return null;
  }
}

export async function getFaq(): Promise<FAQItem[]> {
  if ((await getStoreAccess()).isClosed) return [];
  try {
    const http = getHttpClient();
    const data = await http.request<{ items: FAQItem[] }>("GET", "/faq");
    return data.items ?? [];
  } catch {
    return [];
  }
}
