export function orderPaymentState(order: { status: string; payment_status?: string | null }) {
  const paid = order.status === "paid" || order.payment_status === "paid" || order.payment_status === "success";
  const awaitingPayment = !paid && (
    order.status === "pending" || order.status === "pending_payment" || order.payment_status === "pending"
  );
  return { paid, awaitingPayment, totalLabel: paid ? "Total paid" : awaitingPayment ? "Total due" : "Order total" };
}
