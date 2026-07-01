"use client";

import { Check, RefreshCw, X } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import type { ProductGroup, ShoppingItem } from "@/types/apex";

const labels: Record<ProductGroup, string> = { nutrition: "Alimentacion", personalCare: "Cuidado personal", supplement: "Suplementos", other: "Otros" };

export function ShoppingView({ items, onSync, onUpdate }: { items: ShoppingItem[]; onSync: () => void; onUpdate: (id: number, status: ShoppingItem["status"]) => void }) {
  const grouped = items.filter((item) => item.status === "pending").reduce<Record<ProductGroup, ShoppingItem[]>>((acc, item) => ({ ...acc, [item.category]: [...(acc[item.category] ?? []), item] }), { nutrition: [], personalCare: [], supplement: [], other: [] });
  return <div className="space-y-5"><header className="flex items-center justify-between px-1 pt-2"><div><p className="text-sm text-white/45 light:text-black/45">Lista inteligente</p><h1 className="text-3xl font-semibold">Compras</h1></div><button className="grid size-11 place-items-center rounded-full bg-limeglass text-black" onClick={onSync} type="button"><RefreshCw size={18} /></button></header>
    {Object.entries(grouped).map(([group, groupItems]) => <Card key={group}><SectionTitle title={labels[group as ProductGroup]} />{groupItems.length ? groupItems.map((item) => <div key={item.id} className="mb-2 flex items-center justify-between rounded-2xl bg-white/[0.06] p-3 text-sm light:bg-black/[0.04]"><span>{item.title}</span><span className="flex gap-2"><button onClick={() => item.id && onUpdate(item.id, "bought")}><Check size={16} /></button><button onClick={() => item.id && onUpdate(item.id, "ignored")}><X size={16} /></button></span></div>) : <p className="text-sm text-white/45 light:text-black/45">Sin pendientes.</p>}</Card>)}
  </div>;
}
