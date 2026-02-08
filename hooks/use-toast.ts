"use client";

import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toastState: Toast[] = [];
let toastId = 0;

function dispatch(toasts: Toast[]) {
  toastState = toasts;
  for (const listener of toastListeners) {
    listener(toasts);
  }
}

export function toast({
  title,
  description,
  variant = "default",
  duration = 4000,
}: Omit<Toast, "id"> & { duration?: number }) {
  const id = String(++toastId);
  const newToast: Toast = { id, title, description, variant };
  dispatch([...toastState, newToast]);

  setTimeout(() => {
    dispatch(toastState.filter((t) => t.id !== id));
  }, duration);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastState);

  // Subscribe to external state
  useState(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts);
    };
  });

  const dismiss = useCallback((id: string) => {
    dispatch(toastState.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}
