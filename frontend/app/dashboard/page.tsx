import { StatsGrid } from "@/components/dashboard/stats-cards"
import { OverviewTabs } from "@/components/dashboard/overview-tabs"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default function Page() {
  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Overview" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <StatsGrid />
        <OverviewTabs />
      </div>
    </>
  )
}
