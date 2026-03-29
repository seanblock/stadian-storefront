import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import {
  orderConfirmationEmail,
  orderShippedEmail,
  orderCancelledEmail,
  intakeStatusEmail,
} from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get("x-webhook-secret");
  const expectedSecret = process.env.STADIAN_WEBHOOK_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, data } = body;

  // Handle revalidation
  switch (event) {
    case "product.updated":
    case "product.created":
    case "product.deleted":
      revalidatePath("/products");
      revalidatePath("/");
      if (data?.slug) revalidatePath(`/products/${data.slug}`);
      break;

    case "order.created":
      if (data?.customer_email) {
        const email = orderConfirmationEmail({
          orderNumber: data.order_number,
          total: data.total,
          storeName: "Store", // Tenant customizes this
        });
        await sendEmail({ to: data.customer_email, ...email });
      }
      break;

    case "order.shipped":
      if (data?.customer_email) {
        const email = orderShippedEmail({
          orderNumber: data.order_number,
          trackingNumber: data.tracking_number,
          trackingUrl: data.tracking_url,
        });
        await sendEmail({ to: data.customer_email, ...email });
      }
      break;

    case "order.cancelled":
      if (data?.customer_email) {
        const email = orderCancelledEmail({
          orderNumber: data.order_number,
        });
        await sendEmail({ to: data.customer_email, ...email });
      }
      break;

    case "intake.approved":
    case "intake.denied":
    case "intake.info_requested":
      if (data?.customer_email) {
        const status = event.split(".")[1];
        const email = intakeStatusEmail({ status });
        await sendEmail({ to: data.customer_email, ...email });
      }
      break;
  }

  return NextResponse.json({ received: true });
}
