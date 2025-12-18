import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Chats</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Chats</h2>
            <Button>New Chat</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Support Chat</CardTitle>
                <CardDescription>Last message: 2 minutes ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Customer inquiry about pricing...</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sales Inquiry</CardTitle>
                <CardDescription>Last message: 15 minutes ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Interested in enterprise plan...</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Technical Support</CardTitle>
                <CardDescription>Last message: 1 hour ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">API integration question...</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>General Inquiry</CardTitle>
                <CardDescription>Last message: 3 hours ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Product features question...</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Billing Question</CardTitle>
                <CardDescription>Last message: 5 hours ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Invoice clarification needed...</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
                <CardDescription>Last message: 1 day ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Positive feedback on new features...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
