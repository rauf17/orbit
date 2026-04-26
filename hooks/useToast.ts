"use client";

import { useToast as useToastContext } from "../components/ToastProvider";

export function useToast() {
  const { showToast, dismissToast, toasts } = useToastContext();
  return { showToast, dismissToast, toasts };
}
