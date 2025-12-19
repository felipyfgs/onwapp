"use client"

import { Check, CheckCheck } from "lucide-react"

interface ReadReceiptProps {
  status: 'sent' | 'delivered' | 'read'
  className?: string
}

export function ReadReceipt({ status, className = "" }: ReadReceiptProps) {
  if (status === 'sent') {
    return <Check className={`h-3.5 w-3.5 text-muted-foreground ${className}`} />
  }
  
  if (status === 'delivered') {
    return <CheckCheck className={`h-3.5 w-3.5 text-muted-foreground ${className}`} />
  }
  
  return <CheckCheck className={`h-3.5 w-3.5 text-chart-2 ${className}`} />
}
