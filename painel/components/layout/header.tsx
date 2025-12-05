"use client"

import * as React from "react"
import Link from "next/link"
import { Search, Smartphone } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ModeToggle } from "@/components/theme"
import { UserNav } from "./user-nav"

interface HeaderProps {
  onSearch?: (value: string) => void
  onFilterStatus?: (status: string) => void
  showFilters?: boolean
}

export function Header({ onSearch, onFilterStatus, showFilters = true }: HeaderProps) {
  const [searchValue, setSearchValue] = React.useState("")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    onSearch?.(value)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Smartphone className="h-6 w-6" />
          <span className="hidden sm:inline-block">OnWapp</span>
        </Link>

        {showFilters && (
          <div className="flex flex-1 items-center gap-4 px-4 md:px-8">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar sessoes..."
                className="pl-8"
                value={searchValue}
                onChange={handleSearchChange}
              />
            </div>
            <Select onValueChange={onFilterStatus} defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="connected">Conectado</SelectItem>
                <SelectItem value="connecting">Conectando</SelectItem>
                <SelectItem value="disconnected">Desconectado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
