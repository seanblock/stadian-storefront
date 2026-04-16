"use server";

import { getHttpClient } from "@/lib/stadian";
import type { TiptapDocument } from "@/components/tiptap-renderer";

export interface FAQItem {
  question: string;
  answer: string;
}

export async function getPage(
  slug: "about" | "terms" | "privacy" | "returns",
): Promise<TiptapDocument | null> {
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
  try {
    const http = getHttpClient();
    const data = await http.request<{ items: FAQItem[] }>("GET", "/faq");
    return data.items ?? [];
  } catch {
    return [];
  }
}
