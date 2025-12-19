import { WhatsAppConnections } from "@/components/connections/whatsapp-connections"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default function Page() {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Conexões" },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <WhatsAppConnections />
      </div>
    </div>
  )
}
