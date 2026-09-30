import { NextResponse, type NextRequest } from "next/server";
import { StadianError } from "@stadian/storefront-sdk";
import { getStadianClient } from "@/lib/stadian";
import { getValidCustomerToken } from "@/lib/customer-token";
import { CERTIFICATE_TYPES, MAX_CERTIFICATE_BYTES } from "@/lib/tax-certificate";

/**
 * Upload the signed-in customer's resale-certificate document. A route handler
 * rather than a server action: server actions cap request bodies at 1 MB and a
 * scanned certificate is often bigger. The file is forwarded to the API, which
 * writes it under the certificate's private prefix — the browser never gets
 * storage credentials.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Same-origin only: this acts on the buyer's cookie session.
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const customerToken = await getValidCustomerToken();
  if (!customerToken) return NextResponse.json({ message: "Sign in again to upload." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ message: "Choose a file to upload." }, { status: 400 });
  if (!CERTIFICATE_TYPES.includes(file.type as (typeof CERTIFICATE_TYPES)[number])) {
    return NextResponse.json({ message: "Upload a PDF, PNG, JPEG or WebP file." }, { status: 400 });
  }
  if (file.size > MAX_CERTIFICATE_BYTES) {
    return NextResponse.json({ message: "The file is larger than 4 MB." }, { status: 400 });
  }

  const { id } = await params;
  try {
    const exemption = await getStadianClient().customers.uploadTaxExemptionDocument({
      customerToken,
      exemptionId: id,
      filename: file.name || "certificate",
      contentType: file.type as (typeof CERTIFICATE_TYPES)[number],
      dataBase64: Buffer.from(await file.arrayBuffer()).toString("base64"),
    });
    return NextResponse.json(exemption);
  } catch (err) {
    if (err instanceof StadianError && err.status > 0 && err.status < 500) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: "The store is temporarily unavailable." }, { status: 502 });
  }
}
