"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { marcarEntregado } from "@/app/mozo/mesa/[id]/actions";
import { BotonAccion } from "@/components/BotonAccion";
import type { EstadoItem, ItemPedidoConProducto } from "@/types/database";

const LABEL_ESTADO: Record<EstadoItem, string> = {
  PENDIENTE: "Pendiente",
  EN_PREPARACION: "En preparación",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
};

const COLOR_ESTADO: Record<EstadoItem, string> = {
  PENDIENTE: "text-neutral-400",
  EN_PREPARACION: "text-sky-400",
  LISTO: "text-emerald-400",
  ENTREGADO: "text-neutral-600",
};

export function ListaItemsPedido({
  pedidoId,
  itemsIniciales,
  cuentaYaPedida,
  accionPedirCuenta,
}: {
  pedidoId: string;
  itemsIniciales: ItemPedidoConProducto[];
  cuentaYaPedida: boolean;
  accionPedirCuenta: (formData: FormData) => void;
}) {
  const [items, setItems] = useState<ItemPedidoConProducto[]>(itemsIniciales);

  useEffect(() => {
    setItems(itemsIniciales);
  }, [itemsIniciales]);

  useEffect(() => {
    const supabase = createClient();

    const refetch = async () => {
      const { data } = await supabase
        .from("items_pedido")
        .select("*, productos(*)")
        .eq("pedido_id", pedidoId)
        .returns<ItemPedidoConProducto[]>();
      if (data) setItems(data);
    };

    const canal = supabase
      .channel(`items-pedido-mesa-${pedidoId}`)
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
  }, [pedidoId]);

  const total = items.reduce(
    (acc, item) => acc + item.productos.precio * item.cantidad,
    0
  );
  const todoEntregado =
    items.length > 0 && items.every((item) => item.estado === "ENTREGADO");

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 hover:border-neutral-700 transition-colors animate-fade-in"
        >
          <div>
            <div className="text-sm">
              {item.cantidad}× {item.productos.nombre}
            </div>
            <div className="text-xs text-neutral-500">
              {item.destino === "COCINA" ? "Cocina" : "Barra"}
            </div>
          </div>

          {item.estado === "LISTO" ? (
            <form action={marcarEntregado.bind(null, item.id)}>
              <BotonAccion variant="primary" pendingText="Marcando…">
                Marcar entregado
              </BotonAccion>
            </form>
          ) : (
            <span
              className={`text-sm font-medium inline-flex items-center gap-1.5 ${COLOR_ESTADO[item.estado]}`}
            >
              {item.estado === "EN_PREPARACION" && (
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
              )}
              {LABEL_ESTADO[item.estado]}
            </span>
          )}
        </div>
      ))}

      <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
        <span className="text-sm text-neutral-400">
          Total: <span className="text-neutral-200 font-medium">${total.toLocaleString("es-AR")}</span>
        </span>

        {cuentaYaPedida ? (
          <span className="text-sm text-violet-400">
            Cuenta pedida — esperando pago en caja
          </span>
        ) : (
          todoEntregado && (
            <form action={accionPedirCuenta}>
              <BotonAccion variant="accent" pendingText="Pidiendo…">
                Pedir la cuenta
              </BotonAccion>
            </form>
          )
        )}
      </div>
    </div>
  );
}
