"use client";

import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common";
import { ThemeToggle } from "@/components/theme-toggle";
import { Settings, Server, Key } from "lucide-react";

export default function SettingsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const natsUrl = process.env.NEXT_PUBLIC_NATS_WS_URL || "Auto-detect";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader breadcrumbs={[{ label: "Settings" }]} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  API Configuration
                </CardTitle>
                <CardDescription>Backend API connection settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API URL</Label>
                  <Input value={apiUrl} disabled />
                  <p className="text-xs text-muted-foreground">
                    Set via NEXT_PUBLIC_API_URL environment variable
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>NATS WebSocket URL</Label>
                  <Input value={natsUrl} disabled />
                  <p className="text-xs text-muted-foreground">
                    Set via NEXT_PUBLIC_NATS_WS_URL or auto-detected from page host
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Authentication
                </CardTitle>
                <CardDescription>API key configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input value="••••••••••••••••" type="password" disabled />
                  <p className="text-xs text-muted-foreground">
                    Set via NEXT_PUBLIC_API_KEY environment variable
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize the admin panel appearance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark mode
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
