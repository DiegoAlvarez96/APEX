"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, PackagePlus, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, SectionTitle } from "@/components/ui/Card";
import { dateKey, formatDateKey } from "@/lib/date";
import { productSuggestions } from "@/lib/shopping";
import { formatAmount, productDisplayName, stockColor } from "@/lib/stock";
import type { Product, ProductGroup, ProductStockSummary } from "@/types/apex";

const productSchema = z.object({
  name: z.string().min(2),
  commercialName: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().min(2),
  initialStock: z.coerce.number().min(0),
  size: z.coerce.number().min(0),
  unit: z.string().min(1),
  purchaseDate: z.string().min(1),
  cost: z.coerce.number().min(0),
  lowAt: z.coerce.number().min(0)
});

type ProductForm = z.infer<typeof productSchema>;

export function ProductsSmartView({
  summaries,
  onAddProduct,
  onAddConsumption
}: {
  summaries: ProductStockSummary[];
  onAddProduct: (product: Omit<Product, "id" | "createdAt">) => void;
  onAddConsumption: (productId: number, amount: number, note?: string) => void;
}) {
  const [image, setImage] = useState<string>();
  const [group, setGroup] = useState<ProductGroup>("nutrition");
  const { register, handleSubmit, reset } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { unit: "g", purchaseDate: dateKey(), lowAt: 20, cost: 0, initialStock: 100, size: 100 }
  });

  function submit(values: ProductForm) {
    onAddProduct({ ...values, group, image, quantity: values.initialStock });
    setImage(undefined);
    reset();
  }

  async function handleImage(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImage(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-white/45 light:text-black/45">Stock inteligente</p>
        <h1 className="text-3xl font-semibold">Productos</h1>
      </header>

      <Card>
        <SectionTitle title="Agregar producto" eyebrow="Inventario visual" />
        <form onSubmit={handleSubmit(submit)} className="grid gap-3">
          <label className="flex min-h-28 cursor-pointer items-center gap-4 rounded-3xl border border-dashed border-white/20 bg-white/[0.04] p-4 light:border-black/15 light:bg-black/[0.03]">
            <ProductImage image={image} name="Nuevo producto" />
            <span className="text-sm text-white/55 light:text-black/55">
              <Camera className="mb-1" size={18} /> Imagen del producto
            </span>
            <input className="hidden" type="file" accept="image/*" onChange={(event) => void handleImage(event.target.files?.[0] ?? null)} />
          </label>
          <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" placeholder="Nombre comercial" {...register("commercialName")} />
          <select className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" value={group} onChange={(event) => setGroup(event.target.value as ProductGroup)}>
            <option value="nutrition">Alimentacion</option>
            <option value="personalCare">Cuidado personal</option>
            <option value="supplement">Suplementos</option>
            <option value="other">Otros</option>
          </select>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {productSuggestions[group].map((suggestion) => (
              <button key={suggestion} className="shrink-0 rounded-full bg-white/[0.08] px-3 py-2 text-xs light:bg-black/[0.05]" type="button">
                {suggestion}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" placeholder="Producto" {...register("name")} />
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" placeholder="Marca" {...register("brand")} />
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" placeholder="Categoria" {...register("category")} />
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" placeholder="Unidad" {...register("unit")} />
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" type="number" placeholder="Stock inicial" {...register("initialStock")} />
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" type="number" placeholder="Tamano" {...register("size")} />
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" type="date" {...register("purchaseDate")} />
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" type="number" placeholder="Costo" {...register("cost")} />
          </div>
          <button className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-limeglass font-semibold text-black" type="submit">
            <PackagePlus size={18} /> Guardar producto
          </button>
        </form>
      </Card>

      <div className="space-y-4">
        {summaries.map((summary) => (
          <ProductStockCard key={summary.product.id} summary={summary} onAddConsumption={onAddConsumption} />
        ))}
      </div>
    </div>
  );
}

function ProductStockCard({ summary, onAddConsumption }: { summary: ProductStockSummary; onAddConsumption: (productId: number, amount: number) => void }) {
  const [amount, setAmount] = useState("");
  const product = summary.product;
  const name = productDisplayName(product);

  function submitConsumption() {
    if (!product.id) return;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onAddConsumption(product.id, parsed);
    setAmount("");
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex gap-4 p-4">
        <ProductImage image={product.image} name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{name}</p>
              <p className="text-sm text-white/45 light:text-black/45">{product.brand || "Sin marca"} · {product.category}</p>
            </div>
            <BrandMark brand={product.brand} logo={product.brandLogo} />
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/10 light:bg-black/10">
            <div className={`h-full rounded-full ${stockColor(summary.status)}`} style={{ width: `${summary.percent}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <Stat label="Quedan" value={`${summary.percent}%`} />
            <Stat label="Dias" value={summary.estimatedDaysLeft === null ? "-" : `${summary.estimatedDaysLeft}`} />
            <Stat label="Diario" value={`${formatAmount(summary.dailyAverage)} ${product.unit}`} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4 text-sm light:border-black/10">
        <Stat label="Stock actual" value={`${formatAmount(summary.currentStock)} ${product.unit}`} />
        <Stat label="Compra aprox." value={summary.estimatedRestockDate ? formatDateKey(summary.estimatedRestockDate) : "-"} />
        <Stat label="Semanal" value={`${formatAmount(summary.weeklyConsumption)} ${product.unit}`} />
        <Stat label="Mensual" value={`${formatAmount(summary.monthlyConsumption)} ${product.unit}`} />
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <input
          className="min-w-0 flex-1 rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]"
          type="number"
          placeholder={`Consumo ${product.unit}`}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <button className="grid size-12 place-items-center rounded-2xl bg-white text-black" type="button" onClick={submitConsumption} aria-label="Registrar consumo">
          <Plus size={18} />
        </button>
      </div>
    </Card>
  );
}

function ProductImage({ image, name }: { image?: string; name: string }) {
  return (
    <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-[26px] bg-white/[0.08] light:bg-black/[0.04]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="size-full object-cover" />
      ) : (
        <span className="text-3xl font-semibold text-white/35 light:text-black/35">{name.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

function BrandMark({ brand, logo }: { brand?: string; logo?: string }) {
  return (
    <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/[0.08] text-xs font-bold light:bg-black/[0.05]">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={brand ?? "Marca"} className="size-full object-cover" />
      ) : (
        <span>{(brand ?? "AP").slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-white/40 light:text-black/40">{label}</p>
      <p className="truncate font-semibold">{value}</p>
    </div>
  );
}
