import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/app/actions/content";
import { TiptapRenderer } from "@/components/tiptap-renderer";

export const metadata: Metadata = { title: "Return Policy" };

export default async function ReturnsPage() {
  const doc = await getPage("returns");

  // Not every store offers returns. Without a policy configured this route used
  // to render "Return Policy — Coming soon", which promises a policy the store
  // may never have; 404 instead so the page simply doesn't exist.
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <TiptapRenderer document={doc} />
    </div>
  );
}
