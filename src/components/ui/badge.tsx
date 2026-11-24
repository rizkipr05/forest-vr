import * as React from "react";
import { cn } from "@/lib/utils";

const badgeColors: Record<string, string> = {
  Mamalia: "bg-amber-50 text-amber-800 border-amber-200",
  Burung: "bg-rose-50 text-rose-800 border-rose-200",
  Reptil: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Amfibi: "bg-sky-50 text-sky-800 border-sky-200",
  Tumbuhan: "bg-lime-50 text-lime-800 border-lime-200",
  default: "bg-slate-100 text-slate-700 border-slate-200",
};

export function Badge({
  category,
  className,
  children,
}: {
  category?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const tone = (category && badgeColors[category]) || badgeColors.default;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide",
        tone,
        className
      )}
    >
      {children}
    </span>
  );
}
