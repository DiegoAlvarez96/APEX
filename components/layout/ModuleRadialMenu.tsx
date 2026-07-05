"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import type { ViewKey } from "@/components/layout/BottomNav";
import { enabledModules, getModuleIdentity } from "@/lib/modules";

const menuOrder: ViewKey[] = ["nutrition", "calendar", "finance", "dashboard", "ai", "physical", "shopping", "training"];

export function ModuleRadialMenu({
  active,
  open,
  onClose,
  onNavigate
}: {
  active: ViewKey;
  open: boolean;
  onClose: () => void;
  onNavigate: (view: ViewKey) => void;
}) {
  const modules = menuOrder
    .map((key) => enabledModules().find((module) => module.key === key))
    .filter((module): module is NonNullable<typeof module> => Boolean(module));
  const activeTheme = getModuleIdentity(active);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-black/66 px-5 backdrop-blur-[34px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      onClick={onClose}
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(circle at 50% 42%, ${activeTheme.strongTint}, transparent 30%), radial-gradient(circle at 18% 72%, rgba(var(--ai), 0.30), transparent 22%), radial-gradient(circle at 78% 68%, rgba(var(--agenda), 0.24), transparent 24%), radial-gradient(circle at 74% 22%, rgba(var(--habits), 0.18), transparent 20%)`
        }}
      />
      <motion.div
        className="relative h-[340px] w-full max-w-[340px] overflow-hidden rounded-[30px] border border-white/10 bg-[rgb(var(--surface-strong))]/54 shadow-[0_28px_90px_rgba(0,0,0,0.58)] backdrop-blur-3xl"
        initial={{ scale: 0.94, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 46%, rgba(255,255,255,0.10), transparent 23%), radial-gradient(circle at 22% 72%, rgba(var(--health),0.26), transparent 20%), radial-gradient(circle at 78% 28%, rgba(var(--agenda),0.22), transparent 22%), linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))"
          }}
        />

        <div className="absolute left-4 top-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">APEX</p>
          <p className="mt-0.5 text-xs text-white/45">{activeTheme.label}</p>
        </div>

        {modules.map((item, index) => {
          const Icon = item.icon;
          const moduleTheme = getModuleIdentity(item.key);
          const angle = (-90 + index * (360 / modules.length)) * (Math.PI / 180);
          const x = Math.round(Math.cos(angle) * 114);
          const y = Math.round(Math.sin(angle) * 106);

          return (
            <button
              key={item.key}
              type="button"
              className="absolute left-1/2 top-1/2 flex w-[64px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center transition active:scale-95"
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
              onClick={() => onNavigate(item.key)}
              aria-label={item.label}
            >
              <span
                className="grid size-12 place-items-center rounded-full border shadow-soft backdrop-blur-xl"
                style={{ background: moduleTheme.strongTint, borderColor: moduleTheme.border, color: moduleTheme.accent }}
              >
                <Icon size={19} strokeWidth={2.3} />
              </span>
              <span className="max-w-[64px] truncate text-[10px] font-semibold leading-3 text-white/85">{item.shortLabel}</span>
            </button>
          );
        })}

        <button
          type="button"
          className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/12 bg-black/42 text-white shadow-[0_18px_42px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition active:scale-95"
          onClick={onClose}
          aria-label="Cerrar menu"
        >
          <X size={23} strokeWidth={2.1} />
        </button>
      </motion.div>
    </motion.div>
  );
}
