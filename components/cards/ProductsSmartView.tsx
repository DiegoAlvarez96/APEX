"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, PackagePlus, Plus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, SectionTitle } from "@/components/ui/Card";
import { InlineStatus, LoadingButton } from "@/components/ui/Loading";
import { dateKey, formatDateKey } from "@/lib/date";
import { productSuggestions, productTemplates, type ProductTemplate } from "@/lib/shopping";
import { formatAmount, productDisplayName, productInitialStock, stockColor } from "@/lib/stock";
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
  lowAt: z.coerce.number().min(0),
  recommendedConsumption: z.coerce.number().min(0).optional(),
  dailyConsumptionEstimate: z.coerce.number().min(0).optional()
});

type ProductForm = z.infer<typeof productSchema>;

export function ProductsSmartView({
  summaries,
  onAddProduct,
  onAddConsumption
}: {
  summaries: ProductStockSummary[];
  onAddProduct: (product: Omit<Product, "id" | "createdAt">) => Promise<void> | void;
  onAddConsumption: (productId: number, amount: number, note?: string) => void;
}) {
  const [image, setImage] = useState<string>();
  const [group, setGroup] = useState<ProductGroup>("nutrition");
  const [loading, setLoading] = useState<"image" | "save" | undefined>();
  const [status, setStatus] = useState<{ message?: string; tone?: "info" | "success" | "error" }>({});
  const { register, handleSubmit, reset, setValue } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { unit: "g", purchaseDate: dateKey(), lowAt: 20, cost: 0, initialStock: 100, size: 100 }
  });

  async function submit(values: ProductForm) {
    setLoading("save");
    setStatus({ message: "Guardando producto...", tone: "info" });
    try {
      await onAddProduct({ ...values, group, image, quantity: values.initialStock });
      setImage(undefined);
      reset();
      setStatus({ message: "Producto guardado.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo guardar el producto.", tone: "error" });
    } finally {
      setLoading(undefined);
    }
  }

  async function handleImage(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      setImage(reader.result);
      setLoading("image");
      setStatus({ message: "Analizando producto...", tone: "info" });
      try {
        const response = await fetch("/api/ai/vision/product", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result })
        });
        if (response.ok) applyTemplate(await response.json() as ProductTemplate & { image?: string });
        setStatus({ message: "Producto detectado.", tone: "success" });
      } catch {
        setStatus({ message: "No se pudo analizar la imagen.", tone: "error" });
      } finally {
        setLoading(undefined);
      }
    };
    reader.readAsDataURL(file);
  }

  function applyTemplate(template: ProductTemplate) {
    setGroup(template.group);
    setValue("commercialName", template.commercialName);
    setValue("name", template.name);
    setValue("brand", template.brand);
    setValue("category", template.category);
    setValue("size", template.size);
    setValue("initialStock", template.initialStock);
    setValue("unit", template.unit);
    setValue("recommendedConsumption", template.recommendedConsumption);
    setValue("dailyConsumptionEstimate", template.dailyConsumptionEstimate);
    if (template.image) setImage(template.image);
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
          <HelpField label="Nombre comercial" help="Nombre visible del producto, por ejemplo Proteina ENA Whey.">
            <input className="mt-1 w-full bg-transparent outline-none" placeholder="Nombre comercial" {...register("commercialName")} />
          </HelpField>
          <HelpField label="Tipo de producto" help={categoryHelp[group]}>
            <select className="mt-1 w-full bg-transparent outline-none" value={group} onChange={(event) => setGroup(event.target.value as ProductGroup)}>
              <option value="nutrition">Alimentacion</option>
              <option value="personalCare">Cuidado personal</option>
              <option value="supplement">Suplementos</option>
              <option value="other">Otros</option>
            </select>
          </HelpField>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {productSuggestions[group].map((suggestion) => (
              <button key={suggestion} onClick={() => applyTemplate(productTemplates[suggestion])} className="shrink-0 rounded-full bg-white/[0.08] px-3 py-2 text-xs light:bg-black/[0.05]" type="button">
                {suggestion}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <HelpField label="Producto" help="Nombre base que usa APEX para buscarlo y calcular stock.">
              <input className="mt-1 w-full bg-transparent outline-none" placeholder="Producto" {...register("name")} />
            </HelpField>
            <HelpField label="Marca" help="Marca real o sugerida del producto.">
              <input className="mt-1 w-full bg-transparent outline-none" placeholder="Marca" {...register("brand")} />
            </HelpField>
            <HelpField label="Categoria" help="Subgrupo interno: whey, skincare, higiene, vitaminas, comida.">
              <input className="mt-1 w-full bg-transparent outline-none" placeholder="Categoria" {...register("category")} />
            </HelpField>
            <HelpField label="Unidad" help="Unidad de medida: g, ml, caps, un.">
              <input className="mt-1 w-full bg-transparent outline-none" placeholder="Unidad" {...register("unit")} />
            </HelpField>
            <HelpField label="Stock inicial" help="Cantidad completa al empezar el seguimiento.">
              <input className="mt-1 w-full bg-transparent outline-none" type="number" placeholder="Stock inicial" {...register("initialStock")} />
            </HelpField>
            <HelpField label="Tamano" help="Tamano del envase o presentacion comercial.">
              <input className="mt-1 w-full bg-transparent outline-none" type="number" placeholder="Tamano" {...register("size")} />
            </HelpField>
            <HelpField label="Fecha de compra" help="Dia desde el que APEX estima consumo y reposicion.">
              <input className="mt-1 w-full bg-transparent outline-none" type="date" {...register("purchaseDate")} />
            </HelpField>
            <HelpField label="Costo" help="Precio pagado para futuras comparaciones de reposicion.">
              <input className="mt-1 w-full bg-transparent outline-none" type="number" placeholder="Costo" {...register("cost")} />
            </HelpField>
            <HelpField label="Alerta baja" help="Cantidad minima para considerar que falta reponer.">
              <input className="mt-1 w-full bg-transparent outline-none" type="number" placeholder="Alerta baja" {...register("lowAt")} />
            </HelpField>
            <HelpField label="Consumo recomendado" help="Dosis recomendada por toma o uso habitual.">
              <input className="mt-1 w-full bg-transparent outline-none" type="number" placeholder="Consumo recomendado" {...register("recommendedConsumption")} />
            </HelpField>
            <HelpField label="Consumo diario" help="Promedio diario esperado si todavia no hay historial real.">
              <input className="mt-1 w-full bg-transparent outline-none" type="number" placeholder="Consumo diario estimado" {...register("dailyConsumptionEstimate")} />
            </HelpField>
          </div>
          <LoadingButton loading={loading === "save"} loadingLabel="Guardando..." className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-limeglass font-semibold text-black" type="submit">
            <PackagePlus size={18} /> Guardar producto
          </LoadingButton>
          <InlineStatus message={loading === "image" ? "Analizando imagen..." : status.message} tone={status.tone} />
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

const categoryHelp: Record<ProductGroup, string> = {
  nutrition: "Alimentacion: productos que afectan comidas, macros y energia diaria.",
  supplement: "Suplementos: creatina, omega, vitaminas y apoyo nutricional.",
  personalCare: "Cuidado personal: skincare, cabello, barba, higiene, minoxidil y productos de rutina.",
  other: "Otros: productos generales que queres controlar sin categoria especifica."
};

function HelpField({ label, help, children }: { label: string; help: string; children: ReactNode }) {
  return (
    <label className="block rounded-2xl bg-white/[0.08] px-4 py-3 light:bg-black/[0.05]">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      <span className="mt-1 block text-[11px] leading-4 text-white/40 light:text-black/40">{help}</span>
    </label>
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
        <ProductImage image={product.image ?? automaticProductImage(product)} name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{name}</p>
              <p className="text-sm text-white/45 light:text-black/45">{product.brand || "Sin marca"} - {product.category}</p>
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
        <Stat label="Tamano" value={`${formatAmount(product.size ?? productInitialStock(product))} ${product.unit}`} />
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
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image]);
  const showImage = image && !failed;
  return (
    <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-[26px] bg-white/[0.08] light:bg-black/[0.04]">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className="text-3xl font-semibold text-white/35 light:text-black/35">{name.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

function automaticProductImage(product: Product) {
  const value = `${product.name} ${product.commercialName ?? ""} ${product.category} ${product.group ?? ""}`.toLowerCase();
  if (/prote|whey|creatina|omega|vitamina|magnesio|suplement/.test(value)) return "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=240&q=70";
  if (/protector|retinol|limpiador|skincare|crema/.test(value)) return "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=240&q=70";
  if (/shampoo|higiene|cabello/.test(value)) return "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=240&q=70";
  if (/avena|arroz|yogur|atun|alimento|nutri|comida/.test(value)) return "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=240&q=70";
  return undefined;
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
