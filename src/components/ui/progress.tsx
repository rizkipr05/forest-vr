import * as React from "react";
import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className={cn(
        "h-2.5 w-full overflow-hidden rounded-full bg-slate-100",
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400 transition-all duration-500 ease-out",
          barClassName
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
