import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmptyState({ title = "Nothing here yet", description, icon: Icon = Inbox, className, children }) {
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
