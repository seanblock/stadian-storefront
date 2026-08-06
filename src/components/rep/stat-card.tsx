import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-[#d4a951]/50 bg-[#f3ead5]/40" : undefined}>
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span className="font-serif text-3xl tabular-nums text-[#0a1a2e]">
          {value}
        </span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </CardContent>
    </Card>
  );
}
