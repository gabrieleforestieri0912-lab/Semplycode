"use client";

import { useEffect, useRef } from "react";

// Simple focus trap for small modals/panels. It focuses the container on mount
// and restores focus to previously focused element on unmount.
export default function FocusTrap({ children, onClose, ariaLabel }) {
  const ref = useRef(null);
  const previousActive = useRef(null);

  useEffect(() => {
    previousActive.current = document.activeElement;
    const el = ref.current;
    if (el) el.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
      // Basic tab trap
      if (e.key === "Tab") {
        const focusable = el.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
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
        previousActive.current?.focus?.();
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
