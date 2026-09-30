import { NextResponse, type NextRequest } from "next/server";
import { StadianAuthError, StadianNotFoundError } from "@stadian/storefront-sdk";
import { loginRedirectUrl } from "@/lib/authed-fetch";
import { getCustomerToken, getValidCustomerToken } from "@/lib/customer-token";
import { getInvoicePdfUrl } from "@/lib/invoices";

/**
 * "Download PDF": the invoice file is private, so each click asks the API for
 * a presigned link (it checks this customer owns the issued invoice) and
 * redirects to it. Minted per click, the link never goes stale in an open tab.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/account/invoices/[id]/pdf">) {
  const { id } = await ctx.params;
  const back = `/account/invoices/${id}`;
  const noStore = { headers: { "Cache-Control": "private, no-store" } };

  const token = await getValidCustomerToken();
  if (!token) {
    const expired = Boolean(await getCustomerToken());
    return NextResponse.redirect(new URL(loginRedirectUrl(back, expired), request.url), noStore);
  }
  try {
    return NextResponse.redirect(await getInvoicePdfUrl(token, id), noStore);
  } catch (err) {
    if (err instanceof StadianAuthError) {
      return NextResponse.redirect(new URL(loginRedirectUrl(back, true), request.url), noStore);
    }
    if (err instanceof StadianNotFoundError) {
      return new NextResponse("Invoice PDF not found", { status: 404, ...noStore });
    }
    throw err;
  }
}
