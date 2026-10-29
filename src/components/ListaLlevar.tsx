"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PedidoParaLlevar } from "@/types/database";

type PedidoLlevarConItems = PedidoParaLlevar & {
  items_pedido: {
    cantidad: number;
    productos: { nombre: string; precio: number } | null;
  }[];
};

export function ListaLlevar({
  pedidosIniciales,
}: {
  pedidosIniciales: PedidoLlevarConItems[];
}) {
  const [pedidos, setPedidos] = useState<PedidoLlevarConItems[]>(
    pedidosIniciales
  );

  useEffect(() => {
    setPedidos(pedidosIniciales);
  }, [pedidosIniciales]);

  useEffect(() => {
    const supabase = createClient();

    const refetch = async () => {
      const { data } = await supabase
        .from("pedidos")
        .select("*, items_pedido(cantidad, productos(nombre, precio))")
        .eq("tipo_pedido", "LLEVAR")
        .in("estado", ["ABIERTO", "EN_PREPARACION", "CUENTA_PEDIDA"])
        .order("creado_en")
        .returns<PedidoLlevarConItems[]>();
      if (data) setPedidos(data);
    };

    const canal = supabase
      .channel("llevar-realtime")
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
        No hay pedidos para llevar en curso.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {pedidos.map((pedido) => {
        const total = pedido.items_pedido.reduce(
          (acc, item) => acc + (item.productos?.precio ?? 0) * item.cantidad,
          0
        );
        const esCuentaPedida = pedido.estado === "CUENTA_PEDIDA";

        return (
          <Link
            key={pedido.id}
            href={`/mozo/llevar/${pedido.id}`}
            className={`group rounded-xl border-2 px-4 py-6 text-center shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
              esCuentaPedida
                ? "border-violet-700/70 bg-gradient-to-br from-violet-950 to-neutral-950 text-violet-300 hover:border-violet-500 animate-pulse-slow"
                : "border-sky-800/60 bg-gradient-to-br from-sky-950 to-neutral-950 text-sky-400 hover:border-sky-600"
            }`}
          >
            <div className="text-lg font-bold tracking-tight truncate">
              {pedido.cliente_nombre}
            </div>
            <div className="text-sm mt-1 inline-flex items-center gap-1.5 justify-center">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  esCuentaPedida ? "bg-violet-400" : "bg-sky-400"
                }`}
              />
              {esCuentaPedida ? "Cuenta pedida" : "Para llevar"}
            </div>
            {pedido.items_pedido.length > 0 && (
              <div className="mt-3 pt-2 border-t border-white/10 text-xs opacity-80 text-left">
                {pedido.items_pedido.map((item, i) => (
                  <div key={i}>
                    {item.cantidad}× {item.productos?.nombre ?? "?"}
                  </div>
                ))}
                <div className="mt-1.5 font-semibold text-sm opacity-100">
                  ${total.toLocaleString("es-AR")}
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
