import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
        <p>
          We take your privacy seriously. This policy describes what personal
          information we collect, how we use it, and the choices you have.
        </p>
        <p>
          Information you provide — such as your name, email address, and
          shipping details — is used solely to process your orders and
          communicate with you about them. We do not sell your data to third
          parties.
        </p>
        <p>
          This page is a template — replace it with your full privacy policy
          before accepting orders.
        </p>
      </div>
    </div>
  );
}
