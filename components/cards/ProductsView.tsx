"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, SectionTitle } from "@/components/ui/Card";
import { dateKey, formatDateKey } from "@/lib/date";
import type { Product } from "@/types/apex";

const productSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  quantity: z.coerce.number().min(0),
  unit: z.string().min(1),
  purchaseDate: z.string().min(1),
  cost: z.coerce.number().min(0),
  lowAt: z.coerce.number().min(0)
});

type ProductForm = z.infer<typeof productSchema>;

export function ProductsView({
  products,
  onAddProduct,
  onUpdateQuantity
}: {
  products: Product[];
  onAddProduct: (product: Omit<Product, "id" | "createdAt">) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
}) {
  const { register, handleSubmit, reset } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { unit: "ml", purchaseDate: dateKey(), lowAt: 20, cost: 0, quantity: 100 }
  });

  function submit(values: ProductForm) {
    onAddProduct(values);
    reset();
  }

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-white/45 light:text-black/45">Inventario</p>
        <h1 className="text-3xl font-semibold">Productos</h1>
      </header>

      <Card>
        <SectionTitle title="Agregar producto" />
        <form onSubmit={handleSubmit(submit)} className="grid gap-3">
          <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" placeholder="Nombre" {...register("name")} />
          <div className="grid grid-cols-2 gap-3">
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" placeholder="Categoria" {...register("category")} />
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" placeholder="Unidad" {...register("unit")} />
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" type="number" placeholder="Cantidad" {...register("quantity")} />
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" type="number" placeholder="Avisar en" {...register("lowAt")} />
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" type="date" {...register("purchaseDate")} />
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" type="number" placeholder="Costo" {...register("cost")} />
          </div>
          <button className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-limeglass font-semibold text-black" type="submit">
            <Plus size={18} /> Guardar
          </button>
        </form>
      </Card>

      <div className="space-y-3">
        {products.map((product) => {
          const low = product.quantity <= product.lowAt;
          return (
            <Card key={product.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-white/45 light:text-black/45">{product.category} · comprado {formatDateKey(product.purchaseDate)}</p>
                </div>
                {low ? <AlertTriangle className="text-coral" size={20} /> : null}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <input
                  className="h-2 flex-1 accent-limeglass"
                  type="range"
                  min={0}
                  max={Math.max(product.quantity, 100)}
                  value={product.quantity}
                  onChange={(event) => product.id && onUpdateQuantity(product.id, Number(event.target.value))}
                />
                <span className="w-20 text-right text-sm font-medium">{product.quantity} {product.unit}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
