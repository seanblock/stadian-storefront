import type { Metadata } from "next";
import { getPage } from "@/app/actions/content";
import { TiptapRenderer } from "@/components/tiptap-renderer";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const doc = await getPage("privacy");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {doc ? (
        <TiptapRenderer document={doc} />
      ) : (
        <>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-6 text-muted-foreground">Coming soon.</p>
        </>
      )}
    </div>
  );
}
