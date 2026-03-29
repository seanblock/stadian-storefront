export function orderConfirmationEmail(data: {
  orderNumber: string | null;
  total: number;
  storeName: string;
}): { subject: string; html: string } {
  return {
    subject: `Order Confirmation${data.orderNumber ? ` #${data.orderNumber}` : ""}`,
    html: `
      <h1>Thank you for your order!</h1>
      <p>Your order${data.orderNumber ? ` #${data.orderNumber}` : ""} has been placed.</p>
      <p><strong>Total: $${data.total.toFixed(2)}</strong></p>
      <p>You'll receive payment instructions from ${data.storeName}.</p>
    `,
  };
}

export function orderShippedEmail(data: {
  orderNumber: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}): { subject: string; html: string } {
  const tracking = data.trackingUrl
    ? `<p>Track your order: <a href="${data.trackingUrl}">${data.trackingNumber}</a></p>`
    : data.trackingNumber
    ? `<p>Tracking number: ${data.trackingNumber}</p>`
    : "";

  return {
    subject: `Your Order Has Shipped${data.orderNumber ? ` — #${data.orderNumber}` : ""}`,
    html: `
      <h1>Your order has shipped!</h1>
      ${tracking}
    `,
  };
}

export function orderCancelledEmail(data: {
  orderNumber: string | null;
}): { subject: string; html: string } {
  return {
    subject: `Order Cancelled${data.orderNumber ? ` — #${data.orderNumber}` : ""}`,
    html: `
      <h1>Order Cancelled</h1>
      <p>Your order${data.orderNumber ? ` #${data.orderNumber}` : ""} has been cancelled.</p>
    `,
  };
}

export function intakeStatusEmail(data: {
  status: string;
  productName?: string;
}): { subject: string; html: string } {
  const statusMessages: Record<string, string> = {
    approved:
      "Your intake submission has been approved! You can now purchase the product.",
    denied: "Your intake submission was not approved.",
    info_requested:
      "Additional information is needed for your intake submission. Please check your account.",
  };

  return {
    subject: `Intake Form Update — ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`,
    html: `
      <h1>Intake Form Update</h1>
      ${data.productName ? `<p>Product: ${data.productName}</p>` : ""}
      <p>${statusMessages[data.status] || `Status: ${data.status}`}</p>
    `,
  };
}

export function passwordResetEmail(data: {
  resetUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Reset Your Password",
    html: `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <p><a href="${data.resetUrl}">Reset Password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  };
}

export function emailVerificationEmail(data: {
  verifyUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Verify Your Email",
    html: `
      <h1>Verify Your Email</h1>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${data.verifyUrl}">Verify Email</a></p>
    `,
  };
}
