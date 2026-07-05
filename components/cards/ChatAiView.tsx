"use client";

import { RotateCcw, Send } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { InlineStatus, LoadingButton } from "@/components/ui/Loading";
import type { ChatMessage } from "@/types/apex";

export function ChatAiView({ messages, aiStatus, onSend, onNewChat }: { messages: ChatMessage[]; aiStatus: "available" | "offline" | "checking"; onSend: (content: string) => Promise<void> | void; onNewChat: () => Promise<void> | void }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function send() {
    if (!value.trim() || loading) return;
    const next = value;
    setValue("");
    setLoading(true);
    setError("");
    try {
      await onSend(next);
    } catch {
      setError("No se pudo consultar la IA.");
    } finally {
      setLoading(false);
    }
  }
  const status = loading ? { label: "Consultando OpenAI...", className: "bg-sky-400" } : aiStatus === "available" ? { label: "OpenAI disponible.", className: "bg-[rgb(var(--module-accent))]" } : { label: "Sin conexion.", className: "bg-white/45 light:bg-black/35" };
  return <div className="space-y-5"><header className="flex items-center justify-between px-1 pt-2"><div><p className="text-sm text-white/45 light:text-black/45">Contextual</p><h1 className="text-3xl font-semibold">Asistente IA</h1><div className="mt-2 flex items-center gap-2 text-xs text-white/50 light:text-black/50"><span className={`size-2 rounded-full ${status.className}`} />{status.label}</div></div><button className="flex h-10 items-center gap-2 rounded-2xl bg-white/[0.08] px-3 text-xs light:bg-black/[0.05]" onClick={onNewChat} type="button"><RotateCcw size={14} />Nuevo chat</button></header>
    <Card className="min-h-[28rem]"><div className="space-y-3">{messages.map((m) => <div key={m.id} className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${m.role === "user" ? "ml-auto bg-[rgb(var(--module-accent))] text-[rgb(var(--bg))]" : "bg-white/[0.08] light:bg-black/[0.05]"}`}>{m.content}</div>)}</div></Card>
    <InlineStatus message={loading ? "Consultando IA..." : error} tone={error ? "error" : "info"} />
    <div className="fixed inset-x-4 bottom-24 mx-auto flex max-w-xl gap-2"><input className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3 text-black outline-none disabled:opacity-70" disabled={loading} placeholder="Pregunta cualquier cosa..." value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void send()} /><LoadingButton loading={loading} loadingLabel="" className="grid size-12 place-items-center rounded-2xl bg-[rgb(var(--module-accent))] text-[rgb(var(--bg))]" onClick={() => void send()}><Send size={18} /></LoadingButton></div>
  </div>;
}
