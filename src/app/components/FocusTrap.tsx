"use client";

import { useEffect, useRef, ReactNode } from "react";

interface FocusTrapProps {
  children: ReactNode;
  onClose?: () => void;
  ariaLabel?: string;
}

export default function FocusTrap({ children, onClose, ariaLabel }: FocusTrapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const previousActive = useRef<Element | null>(null);

  useEffect(() => {
    previousActive.current = document.activeElement;
    const el = ref.current;
    if (el) el.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
      if (e.key === "Tab") {
        const focusable = el?.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || !focusable.length) return;
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      try {
        (previousActive.current as HTMLElement)?.focus?.();
      } catch {}
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={ariaLabel || "Dialog"}
      tabIndex={-1}
      className="focus-trap-root"
    >
      {children}
    </div>
  );
}
