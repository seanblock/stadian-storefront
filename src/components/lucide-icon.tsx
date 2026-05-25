import { icons } from "lucide-react";

interface LucideIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function LucideIcon({ name, size = 14, className }: LucideIconProps) {
  // Convert kebab-case (from API) to PascalCase (lucide-react key format)
  const pascalName = name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

  const Icon = icons[pascalName as keyof typeof icons];
  if (!Icon) return null;

  return <Icon size={size} className={className} />;
}
