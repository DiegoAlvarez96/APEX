"use client";

import { ExternalLink, Sparkles } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { productTemplates, recommendedPurchases } from "@/lib/shopping";

export function HealthAestheticView() {
  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-white/45 light:text-black/45">IA + contexto APEX</p>
        <h1 className="text-3xl font-semibold">Compras sugeridas</h1>
      </header>
      {recommendedPurchases().map((section) => (
        <Card key={section.section}>
          <SectionTitle title={section.section} eyebrow="Recomendado" />
          <div className="space-y-3">
            {section.items.map((name) => {
              const template = productTemplates[name];
              const title = template?.commercialName ?? name;
              return (
                <div key={name} className="rounded-2xl bg-white/[0.06] p-3 light:bg-black/[0.04]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="mt-1 text-xs text-white/45 light:text-black/45">Marca sugerida: {template?.brand ?? "A definir"}</p>
                      <p className="mt-1 text-xs leading-5 text-white/45 light:text-black/45">{reasonFor(section.section, title)}</p>
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
      ))}
    </div>
  );
}

function reasonFor(section: string, title: string) {
  if (section === "Nutricion") return `${title} ayuda a sostener energia, proteina o adherencia al plan diario.`;
  if (section === "Skincare") return `${title} complementa la rutina de piel y reduce carga manual de reposicion.`;
  if (section === "Suplementos") return `${title} se sugiere segun objetivos fisicos, stock y habitos registrados.`;
  return `${title} mantiene el cuidado personal cubierto sin esperar a quedarte sin stock.`;
}
