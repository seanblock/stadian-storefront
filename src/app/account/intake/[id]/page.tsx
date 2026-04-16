import Link from "next/link";
import { getCustomerToken } from "@/app/actions/auth";
import { getIntakeStatus } from "@/app/actions/intake";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type IntakeStatus = "pending" | "approved" | "denied" | "info_requested";

const statusConfig: Record<
  IntakeStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; message: string }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    message: "Your submission is under review.",
  },
  approved: {
    label: "Approved",
    variant: "default",
    message: "Approved! You can now purchase this product.",
  },
  denied: {
    label: "Denied",
    variant: "destructive",
    message: "Your submission was not approved.",
  },
  info_requested: {
    label: "Info Requested",
    variant: "outline",
    message: "Additional information is needed.",
  },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function IntakeStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getCustomerToken();
  if (!token) notFound();

  const { id } = await params;

  let submission;
  try {
    submission = await getIntakeStatus(id);
  } catch {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Could not load submission status. The submission may not exist.
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm">
                <Link href="/products">Browse products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = submission.status as IntakeStatus;
  const config = statusConfig[status] ?? {
    label: submission.status,
    variant: "outline" as const,
    message: "",
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Intake Submission</CardTitle>
              <CardDescription className="mt-1 font-mono text-xs">
                {submission.id}
              </CardDescription>
            </div>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {config.message && (
            <p className="text-sm text-muted-foreground">{config.message}</p>
          )}

          <div className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Submitted</span>
              <span>{formatDate(submission.created_at)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Last updated</span>
              <span>{formatDate(submission.updated_at)}</span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="outline" size="sm">
              <Link href="/products">Browse products</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
