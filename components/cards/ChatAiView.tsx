"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import type { ChatMessage } from "@/types/apex";

export function ChatAiView({ messages, onSend }: { messages: ChatMessage[]; onSend: (content: string) => void }) {
  const [value, setValue] = useState("");
  function send() { if (!value.trim()) return; onSend(value); setValue(""); }
  return <div className="space-y-5"><header className="px-1 pt-2"><p className="text-sm text-white/45 light:text-black/45">Contextual</p><h1 className="text-3xl font-semibold">Asistente IA</h1></header>
    <Card className="min-h-[28rem]"><div className="space-y-3">{messages.map((m) => <div key={m.id} className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${m.role === "user" ? "ml-auto bg-limeglass text-black" : "bg-white/[0.08] light:bg-black/[0.05]"}`}>{m.content}</div>)}</div></Card>
    <div className="fixed inset-x-4 bottom-24 mx-auto flex max-w-xl gap-2"><input className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3 text-black outline-none" placeholder="Que deberia mejorar?" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} /><button className="grid size-12 place-items-center rounded-2xl bg-limeglass text-black" onClick={send}><Send size={18} /></button></div>
  </div>;
}
