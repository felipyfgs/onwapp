"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type?: "auto" | "always" | "scroll" | "hover"
  }
>(({ className, type = "scroll", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "h-full w-full overflow-y-auto overflow-x-hidden",
          type === "always" && "overflow-y-scroll",
          type === "scroll" && "overflow-y-scroll",
          type === "auto" && "overflow-y-auto",
          type === "hover" && "overflow-y-hidden hover:overflow-y-auto"
        )}
        {...props}
      />
    </div>
  )
})
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }