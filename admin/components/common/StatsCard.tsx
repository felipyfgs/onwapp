"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type StatsCardVariant = "primary" | "secondary" | "muted" | "accent" | "chart1" | "chart2" | "chart3" | "chart4" | "chart5";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: StatsCardVariant;
  change?: {
    value: number;
    trend: "up" | "down";
  };
  description?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

const variantClasses: Record<StatsCardVariant, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary text-secondary-foreground",
  muted: "bg-muted text-muted-foreground",
  accent: "bg-accent text-accent-foreground",
  chart1: "bg-chart-1/10 text-chart-1",
  chart2: "bg-chart-2/10 text-chart-2",
  chart3: "bg-chart-3/10 text-chart-3",
  chart4: "bg-chart-4/10 text-chart-4",
  chart5: "bg-chart-5/10 text-chart-5",
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  variant = "primary",
  change,
  description,
  loading = false,
  className,
}: StatsCardProps) {
  return (
    <div className={cn(
      "rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="mt-1">
            {loading ? (
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
          </div>
          {change && !loading && (
            <div className="flex items-center gap-1 mt-1 text-xs">
              {change.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={cn(
                "font-medium",
                change.trend === "up" ? "text-green-500" : "text-red-500"
              )}>
                {Math.abs(change.value)}%
              </span>
            </div>
          )}
          {description && !loading && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5 shrink-0", variantClasses[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
