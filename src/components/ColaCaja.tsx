"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { registrarPago } from "@/app/caja/actions";
import { BotonAccion } from "@/components/BotonAccion";
import type { PedidoParaCaja } from "@/types/database";

export function ColaCaja({
  pedidosIniciales,
}: {
  pedidosIniciales: PedidoParaCaja[];
}) {
  const [pedidos, setPedidos] = useState<PedidoParaCaja[]>(pedidosIniciales);

  useEffect(() => {
    setPedidos(pedidosIniciales);
  }, [pedidosIniciales]);

  useEffect(() => {
    const supabase = createClient();

    const refetch = async () => {
      const { data } = await supabase
        .from("pedidos")
        .select("*, mesas(id, numero), items_pedido(*, productos(*))")
        .eq("estado", "CUENTA_PEDIDA")
        .order("creado_en")
        .returns<PedidoParaCaja[]>();
      if (data) setPedidos(data);
    };

    const canal = supabase
      .channel("caja-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        () => refetch()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items_pedido" },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  if (pedidos.length === 0) {
    return (
      <p className="text-neutral-500 text-sm">
        No hay mesas esperando el pago por ahora.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      {pedidos.map((pedido) => {
        const total = pedido.items_pedido.reduce(
          (acc, item) => acc + item.productos.precio * item.cantidad,
          0
        );

        return (
          <div
            key={pedido.id}
            className="rounded-lg border border-violet-900/40 bg-gradient-to-br from-violet-950/20 to-neutral-950 p-4 shadow-lg shadow-black/20 animate-fade-in"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">
                {pedido.mesas
                  ? `Mesa ${pedido.mesas.numero}`
                  : `Para llevar — ${pedido.cliente_nombre ?? "?"}`}
              </h2>
              <span className="text-sm font-medium text-violet-300">
                ${total.toLocaleString("es-AR")}
              </span>
            </div>

            <div className="text-sm text-neutral-400 mb-3">
              {pedido.items_pedido.map((item) => (
                <div key={item.id}>
                  {item.cantidad}× {item.productos.nombre}
                </div>
              ))}
            </div>

            <form
              action={registrarPago.bind(
                null,
                pedido.id,
                pedido.mesas?.id ?? null,
                total
              )}
              className="flex items-center gap-2"
            >
              <select
                name="metodo_pago"
                defaultValue="EFECTIVO"
                className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-2 py-1.5"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
              <BotonAccion variant="success" pendingText="Registrando…">
                Registrar pago
              </BotonAccion>
            </form>
          </div>
        );
      })}
    </div>
  );
}
