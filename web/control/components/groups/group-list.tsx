"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { UsersRound, RefreshCw } from "lucide-react"

import { Group, getGroups, leaveGroup, getInviteLink } from "@/lib/api/groups"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { LoadingList } from "@/components/loading-state"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { GroupItem } from "./group-item"

export function GroupList() {
  const params = useParams()
  const sessionId = params.id as string
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [leaveTarget, setLeaveTarget] = useState<Group | null>(null)

  async function fetchGroups() {
    setLoading(true)
    setError(null)
    const response = await getGroups(sessionId)
    if (response.success && response.data) {
      setGroups(response.data)
    } else {
      setError(response.error || "Failed to fetch groups")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchGroups()
  }, [sessionId])

  async function handleLeave() {
    if (!leaveTarget) return
    const response = await leaveGroup(sessionId, leaveTarget.jid)
    if (response.success) {
      setGroups((prev) => prev.filter((g) => g.jid !== leaveTarget.jid))
    }
    setLeaveTarget(null)
  }

  async function handleGetInvite(group: Group) {
    const response = await getInviteLink(sessionId, group.jid)
    if (response.success && response.data?.link) {
      navigator.clipboard.writeText(response.data.link)
      alert("Invite link copied to clipboard!")
    }
  }

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups
    const searchLower = search.toLowerCase()
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(searchLower) ||
        group.topic?.toLowerCase().includes(searchLower)
    )
  }, [groups, search])

  const sortedGroups = useMemo(() => {
    return [...filteredGroups].sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredGroups])

  if (loading) return <LoadingList count={5} />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchGroups}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <Button variant="outline" size="icon" onClick={fetchGroups}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {sortedGroups.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title={search ? "No groups found" : "No groups yet"}
            description={search ? "Try a different search term" : "Connect your session to see your groups here."}
          />
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {sortedGroups.length} group{sortedGroups.length !== 1 ? "s" : ""}{search && ` matching "${search}"`}
            </p>
            <div className="space-y-2">
              {sortedGroups.map((group) => (
                <GroupItem
                  key={group.jid}
                  group={group}
                  onLeave={setLeaveTarget}
                  onGetInviteLink={handleGetInvite}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!leaveTarget}
        onOpenChange={() => setLeaveTarget(null)}
        title="Leave Group"
        description={`Are you sure you want to leave "${leaveTarget?.name}"?`}
        confirmText="Leave"
        variant="destructive"
        onConfirm={handleLeave}
      />
    </>
  )
}
