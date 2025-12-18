"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ContactItem {
  name: string
  email: string
  phone: string
  company: string
  role: string
  initials: string
  avatar?: string
}

const mockContacts: ContactItem[] = [
  {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    company: "Acme Corp",
    role: "Manager",
    initials: "JD",
    avatar: "/avatars/01.jpg",
  },
  {
    name: "Sarah Miller",
    email: "sarah.m@example.com",
    phone: "+1 (555) 987-6543",
    company: "TechStart",
    role: "CEO",
    initials: "SM",
    avatar: "/avatars/02.jpg",
  },
  {
    name: "Mike Rodriguez",
    email: "mike.r@example.com",
    phone: "+1 (555) 456-7890",
    company: "Innovate Inc",
    role: "Developer",
    initials: "MR",
    avatar: "/avatars/03.jpg",
  },
  {
    name: "Emily Wang",
    email: "emily.w@example.com",
    phone: "+1 (555) 234-5678",
    company: "Design Co",
    role: "Product Lead",
    initials: "EW",
    avatar: "/avatars/04.jpg",
  },
  {
    name: "David Kim",
    email: "david.k@example.com",
    phone: "+1 (555) 876-5432",
    company: "DataFlow",
    role: "Analyst",
    initials: "DK",
    avatar: "/avatars/05.jpg",
  },
  {
    name: "Lisa Park",
    email: "lisa.p@example.com",
    phone: "+1 (555) 345-6789",
    company: "CloudNet",
    role: "VP Engineering",
    initials: "LP",
    avatar: "/avatars/06.jpg",
  },
]

export function ContactList() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {mockContacts.map((contact, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar>
              <AvatarImage src={contact.avatar} />
              <AvatarFallback>{contact.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle>{contact.name}</CardTitle>
              <CardDescription>{contact.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{contact.phone}</p>
            <p className="text-sm text-muted-foreground">{contact.company} - {contact.role}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ContactHeader() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Contacts</h2>
        <Button>Add Contact</Button>
      </div>
      <div className="flex items-center gap-2">
        <Input placeholder="Search contacts..." className="max-w-sm" />
      </div>
    </div>
  )
}
