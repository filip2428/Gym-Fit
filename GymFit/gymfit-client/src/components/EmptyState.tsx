import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  children?: ReactNode;
}

export default function EmptyState({
  title = "Nothing here yet",
  description,
  icon: Icon = Inbox,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center",
        className
      )}
    >
      <Icon className="h-10 w-10 text-muted-foreground/60" />
      <div>
        <p className="font-medium">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
