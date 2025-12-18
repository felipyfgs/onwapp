import { ConnectionList, ConnectionHeader } from "@/components/connections/connection-list"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default function Page() {
  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Connections" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <ConnectionHeader />
        <ConnectionList />
      </div>
    </>
  )
}
