"use client";

export function TypingIndicator() {
  return (
    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex gap-1">
        <div 
          className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" 
          style={{ animationDelay: '0ms' }} 
        />
        <div 
          className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" 
          style={{ animationDelay: '150ms' }} 
        />
        <div 
          className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" 
          style={{ animationDelay: '300ms' }} 
        />
      </div>
      <span>Digitando...</span>
    </div>
  );
}
