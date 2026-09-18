import React from "react";
import { cn } from "@/lib/utils";

interface AmbientGlowProps {
  className?: string;
  variant?: "blue" | "cyan" | "chartreuse" | "combo";
}

export function AmbientGlow({ className, variant = "blue" }: AmbientGlowProps) {
  const variantStyles = {
    blue: "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(37,99,235,0.18),transparent_70%)]",
    cyan: "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(56,189,248,0.15),transparent_70%)]",
    chartreuse: "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(163,230,53,0.12),transparent_70%)]",
    combo: "bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.15)_0%,transparent_50%),radial-gradient(circle_at_70%_30%,rgba(56,189,248,0.12)_0%,transparent_50%)]",
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden",
        variantStyles[variant],
        className
      )}
    />
  );
}
