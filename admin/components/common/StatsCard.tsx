"use client";

import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "muted" | "accent" | "chart1" | "chart2" | "chart3" | "chart4" | "chart5";
}

const variantClasses = {
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

export function StatsCard({ title, value, icon: Icon, variant = "primary" }: StatsCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${variantClasses[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
