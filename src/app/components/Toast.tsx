"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, AlertCircle } from "lucide-react";

type ToastTone = "success" | "error";

export function useToast() {
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    setToast({ message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  return { toast, showToast };
}

export default function Toast({ toast }: { toast: { message: string; tone: ToastTone } | null }) {
  const isError = toast?.tone === "error";
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white text-sm font-medium rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-2 ${
            isError ? "bg-red-900/95 border border-red-500/30" : "bg-[#0f172a]"
          }`}
        >
          {isError ? (
            <AlertCircle size={15} className="text-red-400" />
          ) : (
            <Check size={15} className="text-emerald-400" />
          )}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
