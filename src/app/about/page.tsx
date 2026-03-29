import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">About Us</h1>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
        <p>
          Welcome to our store. We are committed to providing high-quality
          research peptides and compounds to researchers and practitioners.
        </p>
        <p>
          Our products undergo rigorous quality testing and come with
          certificates of analysis. We prioritize purity, consistency,
          and customer satisfaction.
        </p>
        <p>
          This page is a template — edit it to tell your story.
        </p>
      </div>
    </div>
  );
}
