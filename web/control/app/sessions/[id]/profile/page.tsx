"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfilePicture } from "@/components/profile/profile-picture"
import { ProfileForm } from "@/components/profile/profile-form"
import { getProfile } from "@/lib/api/profile"

export default function ProfilePage() {
  const params = useParams()
  const sessionId = params.id as string

  const [profile, setProfile] = useState<{
    pushName?: string
    about?: string
    pictureUrl?: string
    phone?: string
  } | null>(null)

  const fetchProfile = async () => {
    try {
      const data = await getProfile(sessionId)
      setProfile(data)
    } catch (err) {
      console.error("Failed to load profile:", err)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [sessionId])

  return (
    <>
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
                <BreadcrumbLink href="/sessions">Sessions</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}`}>{sessionId}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Manage your WhatsApp profile
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Your WhatsApp profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfilePicture
                sessionId={sessionId}
                pictureUrl={profile?.pictureUrl}
                name={profile?.pushName}
                onUpdate={fetchProfile}
              />
            </CardContent>
          </Card>

          <ProfileForm sessionId={sessionId} onUpdate={fetchProfile} />
        </div>
      </div>
    </>
  )
}
