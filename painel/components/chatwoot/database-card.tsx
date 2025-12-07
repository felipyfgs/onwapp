"use client"

import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DatabaseCardProps {
  host: string
  port: number
  user: string
  pass: string
  name: string
  onHostChange: (value: string) => void
  onPortChange: (value: number) => void
  onUserChange: (value: string) => void
  onPassChange: (value: string) => void
  onNameChange: (value: string) => void
}

export function DatabaseCard({
  host,
  port,
  user,
  pass,
  name,
  onHostChange,
  onPortChange,
  onUserChange,
  onPassChange,
  onNameChange,
}: DatabaseCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Banco de Dados</CardTitle>
        <CardDescription>Conexao direta para sincronizacao (opcional)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Host</label>
            <Input
              placeholder="localhost"
              value={host}
              onChange={(e) => onHostChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Porta</label>
            <Input
              type="number"
              placeholder="5432"
              value={port || ""}
              onChange={(e) => onPortChange(parseInt(e.target.value) || 5432)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Usuario</label>
            <Input
              placeholder="postgres"
              value={user}
              onChange={(e) => onUserChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Senha</label>
            <Input
              type="password"
              placeholder="Senha"
              value={pass}
              onChange={(e) => onPassChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Database</label>
          <Input
            placeholder="chatwoot_production"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
