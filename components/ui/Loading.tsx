"use client";

import type { ReactNode } from "react";

export function Spinner({ className = "" }: { className?: string }) {
  return <span className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} aria-hidden="true" />;
}

export function LoadingButton({
  loading,
  loadingLabel,
  children,
  className,
  disabled,
  onClick,
  type = "button"
}: {
  loading: boolean;
  loadingLabel: string;
  children: ReactNode;
  className: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button className={`${className} disabled:cursor-not-allowed disabled:opacity-60`} disabled={disabled || loading} onClick={onClick} type={type}>
      {loading ? <><Spinner /> {loadingLabel}</> : children}
    </button>
  );
}

export function InlineStatus({ message, tone = "info" }: { message?: string; tone?: "info" | "success" | "error" }) {
  if (!message) return null;
  const toneClass = {
    info: "bg-white/[0.08] text-white/65 light:bg-black/[0.05] light:text-black/65",
    success: "bg-[rgba(var(--module-accent),0.15)] text-[rgb(var(--module-accent))]",
    error: "bg-red-500/15 text-red-200 light:text-red-700"
  }[tone];
  return <p className={`rounded-2xl p-3 text-center text-sm ${toneClass}`}>{message}</p>;
}
