"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tag } from "@/lib/nats/nats-types"

interface TagBadgesProps {
  tags: Tag[]
  maxVisible?: number
  size?: 'sm' | 'md'
}

const tagColorClasses = [
  "bg-chart-1 text-primary-foreground",
  "bg-chart-2 text-primary-foreground",
  "bg-chart-3 text-primary-foreground",
  "bg-chart-4 text-primary-foreground",
  "bg-chart-5 text-primary-foreground",
]

function getTagColorClass(index: number, customClass?: string): string {
  if (customClass) return customClass
  return tagColorClasses[index % tagColorClasses.length]
}

export function TagBadges({ tags, maxVisible = 3, size = 'sm' }: TagBadgesProps) {
  if (!tags || tags.length === 0) return null

  const visibleTags = tags.slice(0, maxVisible)
  const remainingCount = tags.length - maxVisible
  const sizeClasses = size === 'sm' ? 'text-[9px] px-1.5 py-0 h-4' : 'text-[10px] px-2 py-0.5 h-5'

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 flex-wrap">
        {visibleTags.map((tag, index) => (
          <Tooltip key={tag.id}>
            <TooltipTrigger asChild>
              <Badge 
                className={`${getTagColorClass(index, tag.colorClass)} ${sizeClasses} font-medium cursor-default`}
              >
                {tag.name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover text-popover-foreground border-border">
              <p className="text-xs">{tag.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`${sizeClasses} font-medium cursor-default border-border text-muted-foreground`}
              >
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover text-popover-foreground border-border">
              <div className="text-xs space-y-1">
                {tags.slice(maxVisible).map(tag => (
                  <p key={tag.id}>{tag.name}</p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
