import { redirect } from "next/navigation";
import { getCustomerToken } from "@/lib/customer-token";
import { isCheckoutLoginRequired } from "@/lib/pricing-access";

/**
 * Wholesale stores turn guest checkout off. The API rejects the order either
 * way; this just sends the shopper to sign in instead of letting them fill out
 * the whole form first.
 */
export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loginRequired, token] = await Promise.all([
    isCheckoutLoginRequired(),
    getCustomerToken(),
  ]);

  if (loginRequired && !token) {
    redirect("/login?redirect=/checkout");
  }

  return <>{children}</>;
}
