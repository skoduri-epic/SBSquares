"use client";

import { useToast } from "~/hooks/use-toast";
import { X } from "lucide-react";
import { cn } from "~/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "bg-card border border-border rounded-lg shadow-lg p-4 pr-8 relative animate-in slide-in-from-bottom-5 fade-in-0",
            toast.variant === "destructive" && "border-destructive bg-destructive/10"
          )}
        >
          {toast.title && (
            <p className="font-medium text-sm">{toast.title}</p>
          )}
          {toast.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {toast.description}
            </p>
          )}
          <button
            onClick={() => dismiss(toast.id)}
            className="absolute top-2 right-2 p-1 rounded hover:bg-secondary"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
