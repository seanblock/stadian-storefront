import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("RESEND_API_KEY not configured — skipping email");
    return false;
  }

  try {
    await client.emails.send({
      from: "Store <noreply@example.com>",
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
