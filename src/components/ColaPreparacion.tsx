"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { actualizarEstadoItem } from "@/lib/itemsActions";
import { BotonAccion } from "@/components/BotonAccion";
import type { DestinoProducto, ItemPedidoParaCola } from "@/types/database";

export function ColaPreparacion({
  destino,
  itemsIniciales,
}: {
  destino: DestinoProducto;
  itemsIniciales: ItemPedidoParaCola[];
}) {
  const [items, setItems] = useState<ItemPedidoParaCola[]>(itemsIniciales);

  // Si el servidor nos manda una lista nueva (ej. al revalidar la ruta),
  // la tomamos como punto de partida.
  useEffect(() => {
    setItems(itemsIniciales);
  }, [itemsIniciales]);

  useEffect(() => {
    const supabase = createClient();

    const refetch = async () => {
      const { data } = await supabase
        .from("items_pedido")
        .select("*, productos(*), pedidos(*, mesas(numero))")
        .eq("destino", destino)
        .in("estado", ["PENDIENTE", "EN_PREPARACION", "LISTO"])
        .order("id")
        .returns<ItemPedidoParaCola[]>();
      if (data) setItems(data);
    };

    const canal = supabase
      .channel(`items-pedido-${destino}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items_pedido" },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [destino]);

  if (items.length === 0) {
    return (
      <p className="text-neutral-500 text-sm">No hay ítems pendientes.</p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-neutral-800 p-4 flex flex-col gap-3 shadow-lg shadow-black/20 hover:border-neutral-700 transition-colors animate-fade-in"
        >
          <div>
            <div className="text-xs text-neutral-500">
              {item.pedidos.mesas
                ? `Mesa ${item.pedidos.mesas.numero}`
                : `Para llevar — ${item.pedidos.cliente_nombre ?? "?"}`}
            </div>
            <div className="text-lg font-medium">
              {item.cantidad}× {item.productos.nombre}
            </div>
            {item.notas && (
              <div className="text-xs text-neutral-400 mt-1">
                {item.notas}
              </div>
            )}
          </div>

          {item.estado === "PENDIENTE" && (
            <form
              action={actualizarEstadoItem.bind(
                null,
                item.id,
                "EN_PREPARACION"
              )}
            >
              <BotonAccion
                variant="primary"
                className="w-full"
                pendingText="Tomando…"
              >
                Tomar
              </BotonAccion>
            </form>
          )}

          {item.estado === "EN_PREPARACION" && (
            <form action={actualizarEstadoItem.bind(null, item.id, "LISTO")}>
              <BotonAccion
                variant="success"
                className="w-full"
                pendingText="Marcando…"
              >
                Marcar listo
              </BotonAccion>
            </form>
          )}

          {item.estado === "LISTO" && (
            <div className="text-center text-sm text-emerald-400 py-1.5 inline-flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Listo — esperando al mozo
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
