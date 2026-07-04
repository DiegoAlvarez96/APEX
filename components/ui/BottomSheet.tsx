"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function BottomSheet({
  open,
  title,
  eyebrow,
  children,
  onClose
}: {
  open: boolean;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Cerrar panel" onClick={onClose} />
          <motion.section
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 360 }}
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[78dvh] max-w-xl overflow-hidden rounded-t-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-strong))] shadow-panel"
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[rgb(var(--border))]" />
            <header className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{eyebrow}</p> : null}
                <h2 className="truncate text-base font-semibold">{title}</h2>
              </div>
              <button type="button" className="grid size-8 shrink-0 place-items-center rounded-full bg-[rgb(var(--surface))]" onClick={onClose} aria-label="Cerrar">
                <X size={14} />
              </button>
            </header>
            <div className="max-h-[calc(78dvh-72px)] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+18px)]">{children}</div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
