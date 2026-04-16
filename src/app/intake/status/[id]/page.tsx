import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function IntakeStatusRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/account/intake/${id}`);
}
