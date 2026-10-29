"use client";

import { useState } from "react";
import { BotonAccion } from "@/components/BotonAccion";
import type { Categoria, Producto } from "@/types/database";

export function NuevoPedidoForm({
  categorias,
  productos,
  error,
  accion,
  extra,
}: {
  categorias: Categoria[];
  productos: Producto[];
  error?: string;
  accion: (formData: FormData) => void;
  extra?: React.ReactNode;
}) {
  const [cantidades, setCantidades] = useState<Record<string, number>>({});

  const total = Object.entries(cantidades).reduce((acc, [id, cant]) => {
    const producto = productos.find((p) => p.id === id);
    return acc + (producto ? producto.precio * cant : 0);
  }, 0);

  return (
    <form action={accion} className="flex flex-col gap-6">
      {error && (
        <p className="text-sm text-rose-400 border border-rose-900 bg-rose-950/50 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {extra}

      {categorias.map((categoria) => {
        const productosCategoria = productos.filter(
          (p) => p.categoria_id === categoria.id
        );
        if (productosCategoria.length === 0) return null;

        return (
          <div key={categoria.id}>
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-2">
              {categoria.nombre}
            </h2>
            <div className="flex flex-col gap-2">
              {productosCategoria.map((producto) => {
                const cantidad = cantidades[producto.id] ?? 0;
                return (
                  <div
                    key={producto.id}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 transition-colors ${
                      cantidad > 0
                        ? "border-violet-800/60 bg-violet-950/10"
                        : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div>
                      <div className="text-sm">{producto.nombre}</div>
                      <div className="text-xs text-neutral-500">
                        ${producto.precio.toLocaleString("es-AR")} ·{" "}
                        {producto.destino === "COCINA" ? "Cocina" : "Barra"}
                      </div>
                    </div>
                    <input
                      type="number"
                      name={`cantidad-${producto.id}`}
                      min={0}
                      defaultValue={0}
                      className="w-16 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-center outline-none focus:border-violet-500"
                      onChange={(e) =>
                        setCantidades((actuales) => ({
                          ...actuales,
                          [producto.id]: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between border-t border-neutral-800 pt-4 sticky bottom-0 bg-black/40 backdrop-blur-sm -mx-1 px-1 pb-1">
        <span className="text-sm text-neutral-400">
          Total: <span className="text-neutral-100 font-semibold">${total.toLocaleString("es-AR")}</span>
        </span>
        <BotonAccion variant="accent" className="px-4 py-2" pendingText="Confirmando…">
          Confirmar pedido
        </BotonAccion>
      </div>
    </form>
  );
}
