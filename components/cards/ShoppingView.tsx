"use client";

import { Check, ExternalLink, RefreshCw, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { InlineStatus, LoadingButton } from "@/components/ui/Loading";
import { productTemplates, recommendedPurchases } from "@/lib/shopping";
import type { ProductGroup, ShoppingItem } from "@/types/apex";

const labels: Record<ProductGroup, string> = { nutrition: "Alimentacion", personalCare: "Cuidado personal", supplement: "Suplementos", other: "Otros" };

export function ShoppingView({
  items,
  onSync,
  onUpdate
}: {
  items: ShoppingItem[];
  onSync: () => Promise<void> | void;
  onUpdate: (id: number, status: ShoppingItem["status"]) => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message?: string; tone?: "info" | "success" | "error" }>({});
  const grouped = items.filter((item) => item.status === "pending").reduce<Record<ProductGroup, ShoppingItem[]>>((acc, item) => ({ ...acc, [item.category]: [...(acc[item.category] ?? []), item] }), { nutrition: [], personalCare: [], supplement: [], other: [] });

  async function sync() {
    setLoading(true);
    setStatus({ message: "Actualizando lista inteligente...", tone: "info" });
    try {
      await onSync();
      setStatus({ message: "Lista actualizada.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo actualizar la lista.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between px-1 pt-2">
        <div><p className="text-sm text-white/45 light:text-black/45">Lista inteligente</p><h1 className="text-3xl font-semibold">Compras</h1></div>
        <LoadingButton loading={loading} loadingLabel="" className="grid size-11 place-items-center rounded-full bg-[rgb(var(--module-accent))] text-[rgb(var(--bg))]" onClick={() => void sync()}><RefreshCw size={18} /></LoadingButton>
      </header>
      <InlineStatus message={status.message} tone={status.tone} />

      <Card>
        <SectionTitle title="Lista Inteligente" eyebrow="Stock critico" />
        <div className="space-y-4">
          {Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group}>
              <p className="mb-2 text-sm font-semibold">{labels[group as ProductGroup]}</p>
              {groupItems.length ? groupItems.map((item) => (
                <div key={item.id} className="mb-2 flex items-center justify-between rounded-2xl bg-white/[0.06] p-3 text-sm light:bg-black/[0.04]">
                  <span>{item.title}</span>
                  <span className="flex gap-2">
                    <button onClick={() => item.id && void onUpdate(item.id, "bought")} type="button"><Check size={16} /></button>
                    <button onClick={() => item.id && void onUpdate(item.id, "ignored")} type="button"><X size={16} /></button>
                  </span>
                </div>
              )) : <p className="mb-2 text-sm text-white/45 light:text-black/45">Sin pendientes.</p>}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Compras sugeridas por IA" eyebrow="Centralizado" />
        <div className="space-y-3">
          {recommendedPurchases().flatMap((section) => section.items.map((name) => ({ section: section.section, name }))).map(({ section, name }) => {
            const template = productTemplates[name];
            const title = template?.commercialName ?? name;
            return (
              <div key={`${section}-${name}`} className="rounded-2xl bg-white/[0.06] p-3 light:bg-black/[0.04]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-xs text-white/45 light:text-black/45">{section} - Marca sugerida: {template?.brand ?? "A definir"}</p>
                    <p className="mt-1 text-xs leading-5 text-white/45 light:text-black/45">{reasonFor(section, title)}</p>
                  </div>
                  <Sparkles className="text-[rgb(var(--module-accent))]" size={18} />
                </div>
                <a className="mt-3 flex h-10 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-black" href={`https://www.mercadolibre.com.ar/jm/search?as_word=${encodeURIComponent(title)}`} target="_blank">
                  <ExternalLink size={15} /> Comprar
                </a>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function reasonFor(section: string, title: string) {
  if (section === "Nutricion") return `${title} ayuda a sostener energia, proteina o adherencia al plan diario.`;
  if (section === "Skincare") return `${title} complementa la rutina de piel y reduce carga manual de reposicion.`;
  if (section === "Suplementos") return `${title} se sugiere segun objetivos fisicos, stock y habitos registrados.`;
  return `${title} mantiene el cuidado personal cubierto sin esperar a quedarte sin stock.`;
}
