import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/account/orders/${id}`);
}
