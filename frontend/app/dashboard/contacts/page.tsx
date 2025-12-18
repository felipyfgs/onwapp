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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
                  <BreadcrumbPage>Contacts</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Contacts</h2>
            <Button>Add Contact</Button>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Search contacts..." className="max-w-sm" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src="/avatars/01.jpg" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle>John Doe</CardTitle>
                  <CardDescription>john.doe@example.com</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                <p className="text-sm text-muted-foreground">Acme Corp - Manager</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src="/avatars/02.jpg" />
                  <AvatarFallback>SM</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle>Sarah Miller</CardTitle>
                  <CardDescription>sarah.m@example.com</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">+1 (555) 987-6543</p>
                <p className="text-sm text-muted-foreground">TechStart - CEO</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src="/avatars/03.jpg" />
                  <AvatarFallback>MR</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle>Mike Rodriguez</CardTitle>
                  <CardDescription>mike.r@example.com</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">+1 (555) 456-7890</p>
                <p className="text-sm text-muted-foreground">Innovate Inc - Developer</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src="/avatars/04.jpg" />
                  <AvatarFallback>EW</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle>Emily Wang</CardTitle>
                  <CardDescription>emily.w@example.com</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">+1 (555) 234-5678</p>
                <p className="text-sm text-muted-foreground">Design Co - Product Lead</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src="/avatars/05.jpg" />
                  <AvatarFallback>DK</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle>David Kim</CardTitle>
                  <CardDescription>david.k@example.com</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">+1 (555) 876-5432</p>
                <p className="text-sm text-muted-foreground">DataFlow - Analyst</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src="/avatars/06.jpg" />
                  <AvatarFallback>LP</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle>Lisa Park</CardTitle>
                  <CardDescription>lisa.p@example.com</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">+1 (555) 345-6789</p>
                <p className="text-sm text-muted-foreground">CloudNet - VP Engineering</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
