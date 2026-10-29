"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Mesa, EstadoMesa } from "@/types/database";

const ESTILOS_ESTADO: Record<EstadoMesa, string> = {
  LIBRE:
    "border-emerald-800/60 bg-gradient-to-br from-emerald-950 to-neutral-950 text-emerald-400 hover:border-emerald-600",
  OCUPADA:
    "border-rose-800/60 bg-gradient-to-br from-rose-950 to-neutral-950 text-rose-400 hover:border-rose-600",
  CUENTA_PEDIDA:
    "border-violet-700/70 bg-gradient-to-br from-violet-950 to-neutral-950 text-violet-300 hover:border-violet-500 animate-pulse-slow",
};

const LABEL_ESTADO: Record<EstadoMesa, string> = {
  LIBRE: "Libre",
  OCUPADA: "Ocupada",
  CUENTA_PEDIDA: "Cuenta pedida",
};

const DOT_ESTADO: Record<EstadoMesa, string> = {
  LIBRE: "bg-emerald-400",
  OCUPADA: "bg-rose-400",
  CUENTA_PEDIDA: "bg-violet-400",
};

type ItemResumen = { nombre: string; cantidad: number; precio: number };

type PedidoConItems = {
  mesa_id: string | null;
  items_pedido: {
    cantidad: number;
    productos: { nombre: string; precio: number } | null;
  }[];
};

export function MapaMesas({ mesasIniciales }: { mesasIniciales: Mesa[] }) {
  const [mesas, setMesas] = useState<Mesa[]>(mesasIniciales);
  const [resumen, setResumen] = useState<Record<string, ItemResumen[]>>({});

  useEffect(() => {
    const supabase = createClient();

    const refetchResumen = async () => {
      const { data } = await supabase
        .from("pedidos")
        .select("mesa_id, items_pedido(cantidad, productos(nombre, precio))")
        .in("estado", ["ABIERTO", "EN_PREPARACION", "CUENTA_PEDIDA"])
        .returns<PedidoConItems[]>();

      const nuevoResumen: Record<string, ItemResumen[]> = {};
      for (const pedido of data ?? []) {
        if (!pedido.mesa_id) continue;
        nuevoResumen[pedido.mesa_id] = pedido.items_pedido.map((item) => ({
          nombre: item.productos?.nombre ?? "?",
          cantidad: item.cantidad,
          precio: item.productos?.precio ?? 0,
        }));
      }
      setResumen(nuevoResumen);
    };

    refetchResumen();

    const canalMesas = supabase
      .channel("mesas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mesas" },
        (payload) => {
          setMesas((actuales) => {
            if (payload.eventType === "INSERT") {
              return [...actuales, payload.new as Mesa].sort(
                (a, b) => a.numero - b.numero
              );
            }
            if (payload.eventType === "UPDATE") {
              return actuales.map((mesa) =>
                mesa.id === (payload.new as Mesa).id
                  ? (payload.new as Mesa)
                  : mesa
              );
            }
            if (payload.eventType === "DELETE") {
              return actuales.filter(
                (mesa) => mesa.id !== (payload.old as Mesa).id
              );
            }
            return actuales;
          });
          refetchResumen();
        }
      )
      .subscribe();

    const canalItems = supabase
      .channel("mesas-items-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items_pedido" },
        () => {
          refetchResumen();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        () => {
          refetchResumen();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalMesas);
      supabase.removeChannel(canalItems);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {mesas.map((mesa) => {
        const items = resumen[mesa.id];
        const total = items?.reduce(
          (acc, item) => acc + item.precio * item.cantidad,
          0
        );
        return (
          <Link
            key={mesa.id}
            href={`/mozo/mesa/${mesa.id}`}
            className={`group rounded-xl border-2 px-4 py-6 text-center shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
              ESTILOS_ESTADO[mesa.estado]
            }`}
          >
            <div className="text-2xl font-bold tracking-tight">
              Mesa {mesa.numero}
            </div>
            <div className="text-sm mt-1 inline-flex items-center gap-1.5 justify-center">
              <span
                className={`h-1.5 w-1.5 rounded-full ${DOT_ESTADO[mesa.estado]}`}
              />
              {LABEL_ESTADO[mesa.estado]}
            </div>
            {mesa.estado !== "LIBRE" && items && items.length > 0 && (
              <div className="mt-3 pt-2 border-t border-white/10 text-xs opacity-80 text-left">
                {items.map((item, i) => (
                  <div key={i}>
                    {item.cantidad}× {item.nombre}
                  </div>
                ))}
                {total !== undefined && (
                  <div className="mt-1.5 font-semibold text-sm opacity-100">
                    ${total.toLocaleString("es-AR")}
                  </div>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
