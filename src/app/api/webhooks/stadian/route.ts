import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const secret = process.env.STADIAN_WEBHOOK_SECRET;

  if (!secret) {
    console.error("STADIAN_WEBHOOK_SECRET is not configured — rejecting webhook");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-stadian-signature");

  if (!signature || !verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, data } = body;

  switch (event) {
    case "product.updated":
    case "product.created":
    case "product.deleted":
      revalidatePath("/products");
      revalidatePath("/");
      if (data?.slug) revalidatePath(`/products/${data.slug}`);
      break;

    case "order.created":
    case "order.shipped":
    case "order.cancelled":
      revalidatePath("/account/orders");
      if (data?.id) revalidatePath(`/account/orders/${data.id}`);
      break;

    case "intake.approved":
    case "intake.denied":
    case "intake.info_requested":
      if (data?.id) revalidatePath(`/account/intake/${data.id}`);
      break;

    case "page.updated":
      if (data?.slug) revalidatePath(`/${data.slug}`);
      break;
  }

  return NextResponse.json({ received: true });
}
