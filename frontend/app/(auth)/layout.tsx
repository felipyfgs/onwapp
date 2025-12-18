"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme, setTheme } = useTheme()

  // Garante que o tema seja aplicado corretamente
  useEffect(() => {
    // Sincroniza com o preferência do sistema se necessário
    const savedTheme = localStorage.getItem("next-theme")
    if (!savedTheme) {
      setTheme("system")
    }
  }, [setTheme])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="w-full max-w-md mx-auto p-6">
        {children}
      </div>
    </div>
  )
}
