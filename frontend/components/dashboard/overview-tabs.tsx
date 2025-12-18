"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function OverviewTabs() {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent activity will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 min-h-[200px] flex-1 rounded-xl" />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="analytics" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Analytics data will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 min-h-[200px] flex-1 rounded-xl" />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="reports" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>Reports will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 min-h-[200px] flex-1 rounded-xl" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
