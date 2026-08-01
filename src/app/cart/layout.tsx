import { redirect } from "next/navigation";
import { arePricesHidden } from "@/lib/pricing-access";

/**
 * On a store that hides prices until login the cart API is closed to anonymous
 * visitors (every cart response carries prices), so there is nothing to show —
 * send them to sign in.
 */
export default async function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await arePricesHidden()) {
    redirect("/login?redirect=/cart");
  }

  return <>{children}</>;
}
