"use client";

import { Button } from "@/components/ui/button";

interface RecordingIndicatorProps {
  formattedTime: string;
  onCancel: () => void;
  onSend: () => void;
}

export function RecordingIndicator({
  formattedTime,
  onCancel,
  onSend,
}: RecordingIndicatorProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        <span className="text-xs text-red-700 dark:text-red-300">
          Gravando... {formattedTime}
        </span>
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-100"
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={onSend}
          className="h-6 px-2 text-xs bg-red-500 hover:bg-red-600 text-white"
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}
