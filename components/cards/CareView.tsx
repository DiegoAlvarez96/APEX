"use client";

import { Camera, Scissors, Sparkles } from "lucide-react";
import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatDate } from "@/lib/date";
import { skincareProducts } from "@/lib/routines";
import type { ProgressPhoto, ProgressPhotoZone } from "@/types/apex";

type Tab = "skin" | "beard" | "hair";

const tabMeta = {
  skin: { title: "Skincare", icon: Sparkles, label: "Piel" },
  beard: { title: "Barba", icon: Scissors, label: "Barba" },
  hair: { title: "Implante", icon: Camera, label: "Implante" }
} satisfies Record<Tab, { title: string; label: string; icon: typeof Camera }>;

export function CareView({ photos, onAddPhoto }: { photos: ProgressPhoto[]; onAddPhoto: (photo: { zone: ProgressPhotoZone; image: string; note?: string }) => void }) {
  const [tab, setTab] = useState<Tab>("skin");
  const filtered = photos.filter((photo) => photo.zone === tab);

  async function handlePhoto(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onAddPhoto({ zone: tab, image: reader.result });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-white/45 light:text-black/45">Rutinas y progreso</p>
        <h1 className="text-3xl font-semibold">{tabMeta[tab].title}</h1>
      </header>
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: "skin", label: "Piel" },
          { value: "beard", label: "Barba" },
          { value: "hair", label: "Implante" }
        ]}
      />

      {tab === "skin" ? (
        <Card>
          <SectionTitle eyebrow="Orden configurable" title="Productos activos" />
          <div className="space-y-3">
            {skincareProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-2xl bg-white/[0.06] p-3 light:bg-black/[0.04]">
                <div>
                  <p className="font-medium">{product.order}. {product.name}</p>
                  <p className="text-xs text-white/40 light:text-black/40">{product.waitMinutes ? `Esperar ${product.waitMinutes} minutos` : "Aplicacion directa"}</p>
                </div>
                <span className="rounded-full bg-limeglass/15 px-3 py-1 text-xs text-limeglass light:text-black">Activo</span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <SectionTitle title={tab === "beard" ? "Plan barba" : "Seguimiento capilar"} />
          <div className="grid gap-3">
            {(tab === "beard" ? ["Minoxidil oral diario", "Minoxidil topico diario", "Dermaroller jueves 0.5 mm"] : ["Fotos semanales", "Cronologia por fecha", "Comparacion lado a lado"]).map((item) => (
              <div key={item} className="rounded-2xl bg-white/[0.06] p-4 text-sm light:bg-black/[0.04]">{item}</div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle eyebrow="Offline" title="Fotos de progreso" />
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/[0.04] text-center light:border-black/15 light:bg-black/[0.03]">
          <Camera className="mb-2 text-limeglass" />
          <span className="text-sm font-medium">Agregar foto de {tabMeta[tab].label.toLowerCase()}</span>
          <input className="hidden" type="file" accept="image/*" onChange={(event) => void handlePhoto(event.target.files?.[0] ?? null)} />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {filtered.map((photo) => (
            <figure key={photo.id} className="overflow-hidden rounded-3xl bg-white/[0.06] light:bg-black/[0.04]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.image} alt="" className="aspect-[4/5] w-full object-cover" />
              <figcaption className="p-2 text-xs text-white/45 light:text-black/45">{formatDate(photo.createdAt)}</figcaption>
            </figure>
          ))}
        </div>
      </Card>
    </div>
  );
}
