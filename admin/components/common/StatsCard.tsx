"use client";

import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "orange" | "red" | "yellow";
}

const colorClasses = {
  blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
  green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
  purple: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
  orange: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
  red: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
  yellow: "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400",
};

export function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
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
