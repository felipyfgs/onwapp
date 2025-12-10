"use client"

import { useEffect, useState, useCallback, use, useMemo } from "react"
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
import {
  GroupGrid,
  GroupFilters,
  GroupEmptyState,
  GroupSkeleton,
  GroupDetailsDialog,
} from "@/components/groups"
import { Group, GroupInfo, getGroups, getGroupInfo, getInviteLink, leaveGroup } from "@/lib/api/groups"

interface GroupsPageProps {
  params: Promise<{ id: string }>
}

export default function GroupsPage({ params }: GroupsPageProps) {
  const { id } = use(params)

  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")

  const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const fetchGroups = useCallback(async () => {
    try {
      const data = await getGroups(id)
      setGroups(data || [])
    } catch (error) {
      console.error("Failed to fetch groups:", error)
      setGroups([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchGroups()
  }

  const handleGroupClick = async (group: Group) => {
    setLoadingDetails(true)
    setSelectedGroup(null)
    try {
      const info = await getGroupInfo(id, group.jid)
      setSelectedGroup(info)
    } catch (error) {
      console.error("Failed to fetch group info:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleGetInviteLink = async () => {
    if (!selectedGroup) return null
    try {
      return await getInviteLink(id, selectedGroup.jid)
    } catch (error) {
      console.error("Failed to get invite link:", error)
      return null
    }
  }

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return
    await leaveGroup(id, selectedGroup.jid)
    setSelectedGroup(null)
    fetchGroups()
  }

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesSearch =
        !search ||
        group.name?.toLowerCase().includes(search.toLowerCase()) ||
        group.topic?.toLowerCase().includes(search.toLowerCase()) ||
        group.jid?.includes(search)
      return matchesSearch
    })
  }, [groups, search])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessões</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${id}`}>{id}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Grupos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <GroupFilters
          total={groups.length}
          search={search}
          onSearchChange={setSearch}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        {loading ? (
          <GroupSkeleton />
        ) : filteredGroups.length === 0 ? (
          <GroupEmptyState hasSearch={!!search} />
        ) : (
          <GroupGrid groups={filteredGroups} onGroupClick={handleGroupClick} />
        )}
      </div>

      <GroupDetailsDialog
        group={selectedGroup}
        loading={loadingDetails && !selectedGroup}
        open={!!selectedGroup || loadingDetails}
        onOpenChange={(open) => !open && setSelectedGroup(null)}
        onGetInviteLink={handleGetInviteLink}
        onLeave={handleLeaveGroup}
      />
    </>
  )
}
