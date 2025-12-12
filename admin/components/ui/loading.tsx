"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  className, 
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  );
}

interface LoadingProps {
  variant?: "spinner" | "skeleton" | "dots" | "pulse";
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ 
  variant = "spinner",
  size = "md", 
  className, 
  text,
  fullScreen = false
}: LoadingProps) {
  const containerClasses = cn(
    "flex items-center justify-center",
    fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
    className
  );

  if (variant === "skeleton") {
    return <LoadingSkeleton size={size} className={className} />;
  }

  if (variant === "dots") {
    return <LoadingDots size={size} className={className} text={text} />;
  }

  if (variant === "pulse") {
    return <LoadingPulse size={size} className={className} text={text} />;
  }

  return (
    <div className={containerClasses}>
      <LoadingSpinner size={size} text={text} />
    </div>
  );
}

function LoadingSkeleton({ size, className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const skeletonClasses = {
    sm: "h-4 w-16",
    md: "h-6 w-24", 
    lg: "h-8 w-32"
  };

  return (
    <div className={cn("animate-pulse", className)}>
      <div className={cn(
        "rounded bg-muted",
        skeletonClasses[size || "md"]
      )} />
    </div>
  );
}

function LoadingDots({ size, className, text }: { size?: "sm" | "md" | "lg"; className?: string; text?: string }) {
  const dotSize = {
    sm: "h-1 w-1",
    md: "h-1.5 w-1.5", 
    lg: "h-2 w-2"
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className={cn("bg-primary rounded-full animate-bounce", dotSize[size || "md"])} 
           style={{ animationDelay: '0ms' }} />
      <div className={cn("bg-primary rounded-full animate-bounce", dotSize[size || "md"])} 
           style={{ animationDelay: '150ms' }} />
      <div className={cn("bg-primary rounded-full animate-bounce", dotSize[size || "md"])} 
           style={{ animationDelay: '300ms' }} />
      {text && (
        <span className="ml-2 text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  );
}

function LoadingPulse({ size, className, text }: { size?: "sm" | "md" | "lg"; className?: string; text?: string }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "rounded-full bg-primary animate-pulse",
        sizeClasses[size || "md"]
      )} />
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">{text}</span>
      )}
    </div>
  );
}

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingCard({ title, description, className }: LoadingCardProps) {
  return (
    <div className={cn(
      "rounded-xl border bg-card p-6 space-y-4 animate-fade-in",
      className
    )}>
      <div className="space-y-2">
        <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoadingProgressProps {
  value: number;
  max?: number;
  text?: string;
  showPercentage?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingProgress({ 
  value, 
  max = 100, 
  text, 
  showPercentage = true,
  className,
  size = "md"
}: LoadingProgressProps) {
  const percentage = Math.round((value / max) * 100);
  
  const sizeClasses = {
    sm: "h-1",
    md: "h-2", 
    lg: "h-3"
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{text}</span>
        {showPercentage && (
          <span className="font-medium">{percentage}%</span>
        )}
      </div>
      
      <div className={cn(
        "w-full bg-muted rounded-full overflow-hidden",
        sizeClasses[size]
      )}>
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}