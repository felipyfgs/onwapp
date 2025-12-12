"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { PageHeader, StatsCard } from "@/components/common";
import { getGroups, getSessions, createGroup, Group, Session } from "@/lib/api";
import { Search, UsersRound, Plus, Users, Lock, Megaphone, RefreshCw } from "lucide-react";

export default function GroupsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getSessions()
      .then((data) => {
        const connected = Array.isArray(data) ? data.filter((s) => s.status === "connected") : [];
        setSessions(connected);
        if (connected.length > 0) {
          setSelectedSession(connected[0].session);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchGroups = useCallback(async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const data = await getGroups(selectedSession);
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedSession) {
      fetchGroups();
    }
  }, [selectedSession, fetchGroups]);

  const handleCreateGroup = async () => {
    if (!newGroupName || !selectedSession) return;
    setCreating(true);
    try {
      await createGroup(selectedSession, newGroupName, []);
      setCreateDialog(false);
      setNewGroupName("");
      fetchGroups();
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setCreating(false);
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const announceCount = groups.filter((g) => g.isAnnounce).length;
  const totalParticipants = groups.reduce((acc, g) => acc + (g.participantCount || 0), 0);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader breadcrumbs={[{ label: "Groups" }]} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Toolbar */}
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
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={createDialog} onOpenChange={setCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Group Name</Label>
                    <Input
                      placeholder="Enter group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateGroup} disabled={creating || !newGroupName} className="w-full">
                    {creating ? "Creating..." : "Create Group"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={fetchGroups}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard title="Total Groups" value={groups.length} icon={UsersRound} variant="primary" />
            <StatsCard title="Total Participants" value={totalParticipants} icon={Users} variant="chart1" />
            <StatsCard title="Announcement Only" value={announceCount} icon={Megaphone} variant="chart4" />
          </div>

          {/* Group List */}
          {!selectedSession ? (
            <div className="rounded-xl border bg-muted/50 p-12 text-center">
              <UsersRound className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Select a session</h3>
              <p className="text-muted-foreground">Choose a connected session to view groups</p>
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
          ) : filteredGroups.length === 0 ? (
            <div className="rounded-xl border bg-muted/50 p-12 text-center">
              <UsersRound className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No groups found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search" : "No groups in this session"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              {filteredGroups.map((group) => {
                const initials = group.name.substring(0, 2).toUpperCase();
                return (
                  <div
                    key={group.jid}
                    className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => router.push(`/groups/${selectedSession}/${encodeURIComponent(group.jid)}`)}
                  >
                    <Avatar className="h-12 w-12">
                      {group.profilePicture && <AvatarImage src={group.profilePicture} alt={group.name} />}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{group.name}</p>
                        {group.isAnnounce && (
                          <Badge variant="secondary" className="text-xs">
                            <Megaphone className="h-3 w-3 mr-1" />
                            Announce
                          </Badge>
                        )}
                        {group.isLocked && (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {group.participantCount || group.participants?.length || 0} participants
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
