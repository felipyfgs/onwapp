"use client";

import { useEffect, useState, useCallback } from "react";
import { AppSidebar } from "@/components/layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getContacts, getSessions, checkPhone, Contact, Session } from "@/lib/api";
import { Search, Users, Phone, Building2, RefreshCw, UserPlus } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ContactsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkPhoneDialog, setCheckPhoneDialog] = useState(false);
  const [phoneToCheck, setPhoneToCheck] = useState("");
  const [checkResult, setCheckResult] = useState<{ exists: boolean; jid: string } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    getSessions()
      .then((data) => {
        setSessions(data.filter((s) => s.status === "connected"));
        if (data.some((s) => s.status === "connected")) {
          setSelectedSession(data.find((s) => s.status === "connected")?.session || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchContacts = useCallback(async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const data = await getContacts(selectedSession);
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedSession) {
      fetchContacts();
    }
  }, [selectedSession, fetchContacts]);

  const handleCheckPhone = async () => {
    if (!phoneToCheck || !selectedSession) return;
    setChecking(true);
    try {
      const results = await checkPhone(selectedSession, [phoneToCheck]);
      setCheckResult(results[0] || null);
    } catch (error) {
      console.error("Failed to check phone:", error);
    } finally {
      setChecking(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const name = contact.name || contact.pushName || contact.jid;
    const phone = contact.phone || "";
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery)
    );
  });

  const businessCount = contacts.filter((c) => c.isBusiness).length;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Contacts</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2 px-4">
            <Dialog open={checkPhoneDialog} onOpenChange={setCheckPhoneDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Phone className="mr-2 h-4 w-4" />
                  Check Number
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Check WhatsApp Number</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Phone number (e.g., 5511999999999)"
                    value={phoneToCheck}
                    onChange={(e) => setPhoneToCheck(e.target.value)}
                  />
                  <Button onClick={handleCheckPhone} disabled={checking} className="w-full">
                    {checking ? "Checking..." : "Check"}
                  </Button>
                  {checkResult && (
                    <div className={`p-4 rounded-lg ${checkResult.exists ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
                      <p className="font-medium">
                        {checkResult.exists ? "Number has WhatsApp" : "Number not on WhatsApp"}
                      </p>
                      {checkResult.exists && (
                        <p className="text-sm text-muted-foreground mt-1">JID: {checkResult.jid}</p>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={fetchContacts}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Session Selector & Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.session} value={s.session}>
                    {s.pushName || s.session}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900 p-2">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Contacts</p>
                  <p className="text-2xl font-bold">{contacts.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900 p-2">
                  <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Business</p>
                  <p className="text-2xl font-bold">{businessCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 dark:bg-green-900 p-2">
                  <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">With Name</p>
                  <p className="text-2xl font-bold">{contacts.filter((c) => c.name || c.pushName).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact List */}
          {!selectedSession ? (
            <div className="rounded-xl border bg-muted/50 p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Select a session</h3>
              <p className="text-muted-foreground">Choose a connected session to view contacts</p>
            </div>
          ) : loading ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="rounded-xl border bg-muted/50 p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No contacts found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search" : "No contacts in this session"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              {filteredContacts.map((contact) => {
                const name = contact.name || contact.pushName || contact.jid.split("@")[0];
                const initials = name.substring(0, 2).toUpperCase();
                return (
                  <div
                    key={contact.jid}
                    className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{name}</p>
                        {contact.isBusiness && (
                          <Badge variant="secondary" className="text-xs">Business</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {contact.phone || contact.jid.split("@")[0]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
