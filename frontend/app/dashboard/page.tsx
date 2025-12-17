import { AppSidebar } from "@/components/app-sidebar"
import { redirect } from 'next/navigation'

export default function Page() {
  // Redirect to tickets page as the main dashboard
  redirect('/dashboard/tickets')
}
