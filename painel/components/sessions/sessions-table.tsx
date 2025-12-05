"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, MessageSquare, Users, MessagesSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { SessionStatusBadge } from "./session-status-badge"
import { SessionActions } from "./session-actions"
import type { Session } from "@/types"

interface SessionsTableProps {
  sessions: Session[]
  loading?: boolean
  onUpdate?: () => void
  onShowQR?: (session: Session) => void
  searchFilter?: string
  statusFilter?: string
}

export function SessionsTable({
  sessions,
  loading,
  onUpdate,
  onShowQR,
  searchFilter,
  statusFilter,
}: SessionsTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const columns: ColumnDef<Session>[] = [
    {
      accessorKey: "session",
      header: "Sessao",
      cell: ({ row }) => {
        const session = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={session.profilePicture} />
              <AvatarFallback>{session.session.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{session.session}</p>
              {session.pushName && (
                <p className="text-sm text-muted-foreground">{session.pushName}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <SessionStatusBadge status={row.original.status} />,
      filterFn: (row, id, value) => {
        if (value === "all") return true
        return row.getValue(id) === value
      },
    },
    {
      accessorKey: "phone",
      header: "Telefone",
      cell: ({ row }) => row.original.phone || "-",
    },
    {
      accessorKey: "stats",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Estatisticas
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const stats = row.original.stats
        if (!stats) return "-"
        return (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {stats.messages}
            </span>
            <span className="flex items-center gap-1">
              <MessagesSquare className="h-4 w-4" />
              {stats.chats}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {stats.contacts}
            </span>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.stats?.messages || 0
        const b = rowB.original.stats?.messages || 0
        return a - b
      },
    },
    {
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt)
        return date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <SessionActions
          session={row.original}
          onUpdate={onUpdate}
          onShowQR={onShowQR}
        />
      ),
    },
  ]

  const filteredData = React.useMemo(() => {
    let data = sessions

    if (searchFilter) {
      const search = searchFilter.toLowerCase()
      data = data.filter(
        (s) =>
          s.session.toLowerCase().includes(search) ||
          s.phone?.toLowerCase().includes(search) ||
          s.pushName?.toLowerCase().includes(search)
      )
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((s) => s.status === statusFilter)
    }

    return data
  }, [sessions, searchFilter, statusFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="ml-auto h-6 w-20" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    const target = e.target as HTMLElement
                    if (!target.closest('button') && !target.closest('[role="menuitem"]')) {
                      router.push(`/session/${row.original.session}`)
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhuma sessao encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {filteredData.length} sessao(oes) encontrada(s)
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Proximo
        </Button>
      </div>
    </div>
  )
}
