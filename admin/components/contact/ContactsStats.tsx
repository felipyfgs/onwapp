"use client";

import { Users, Building2, UserPlus } from "lucide-react";
import { StatsCard } from "@/components/common";

interface ContactsStatsProps {
  totalCount: number;
  businessCount: number;
  withNameCount: number;
}

export function ContactsStats({ totalCount, businessCount, withNameCount }: ContactsStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatsCard title="Total Contacts" value={totalCount} icon={Users} variant="chart1" />
      <StatsCard title="Business" value={businessCount} icon={Building2} variant="chart2" />
      <StatsCard title="With Name" value={withNameCount} icon={UserPlus} variant="primary" />
    </div>
  );
}
