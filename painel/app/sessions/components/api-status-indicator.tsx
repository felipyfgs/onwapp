'use client'

import { useEffect, useState } from 'react'
import { Activity, Database, Server } from 'lucide-react'
import { getAPIHealth } from '@/lib/actions/sessions'
import { APIHealthResponse } from '@/types/session'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function APIStatusIndicator() {
  const [health, setHealth] = useState<APIHealthResponse | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function checkHealth() {
      try {
        const data = await getAPIHealth()
        setHealth(data)
        setError(false)
      } catch {
        setError(true)
        setHealth(null)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-xs font-medium text-red-700">API Offline</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Nao foi possivel conectar a API</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (!health) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full animate-pulse">
        <span className="h-2 w-2 rounded-full bg-gray-300" />
        <span className="text-xs font-medium text-gray-500">Verificando...</span>
      </div>
    )
  }

  const isHealthy = health.status === 'healthy'
  const dbConnected = health.database === 'connected'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
            isHealthy
              ? 'bg-green-50 border-green-200 hover:bg-green-100'
              : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                isHealthy ? 'bg-green-400' : 'bg-yellow-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isHealthy ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
            </span>
            <span className={`text-xs font-medium ${
              isHealthy ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {isHealthy ? 'Online' : 'Degradado'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Versao: {health.version}</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className={`h-4 w-4 ${dbConnected ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-sm">
                Database: {dbConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                {new Date(health.time).toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
