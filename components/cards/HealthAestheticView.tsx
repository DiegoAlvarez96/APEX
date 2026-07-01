"use client";

import { ExternalLink } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { skincareProducts } from "@/lib/routines";

const recommended: Record<string, string> = {
  effaclar: "La Roche Posay Effaclar",
  niacinamida: "The Ordinary Niacinamide",
  adapaleno: "La Roche Posay Retinol",
  glicolico: "The Ordinary Glycolic Acid",
  hydro: "Neutrogena Hydro Boost",
  fps: "La Roche Posay Anthelios"
};

export function HealthAestheticView() {
  const sections = ["Piel", "Barba", "Cabello", "Implante Capilar"];
  return <div className="space-y-5"><header className="px-1 pt-2"><p className="text-sm text-white/45 light:text-black/45">Seguimiento medico no sustitutivo</p><h1 className="text-3xl font-semibold">Salud y Estetica</h1></header>
    {sections.map((section) => <Card key={section}><SectionTitle title={section} />{section === "Piel" ? skincareProducts.map((product) => <div key={product.id} className="mb-2 flex items-center justify-between rounded-2xl bg-white/[0.06] p-3 text-sm light:bg-black/[0.04]"><div><p className="font-medium">{product.name}</p><p className="text-xs text-white/45 light:text-black/45">Recomendado: {recommended[product.id] ?? product.name}</p></div><a className="grid size-9 place-items-center rounded-full bg-white text-black" href={`https://www.mercadolibre.com.ar/jm/search?as_word=${encodeURIComponent(recommended[product.id] ?? product.name)}`} target="_blank"><ExternalLink size={15} /></a></div>) : <div className="grid gap-2">{["Rutina", "Productos", "Fotos", "Recomendaciones IA"].map((item) => <div key={item} className="rounded-2xl bg-white/[0.06] p-3 text-sm light:bg-black/[0.04]">{item}</div>)}</div>}</Card>)}
  </div>;
}
