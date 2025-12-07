"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface SettingSwitchProps {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function SettingSwitch({ 
  id, 
  label, 
  checked, 
  onCheckedChange,
  disabled 
}: SettingSwitchProps) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="text-sm cursor-pointer">
        {label}
      </Label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  )
}
