import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  label?: string;
}

export default function Spinner({ className, label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
      <Loader2 className={cn("h-6 w-6 animate-spin", className)} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
