import type { PagoConDetalle } from "@/types/database";

const LABEL_METODO: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

function formatoHora(fecha: string) {
  return new Date(fecha).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DetalleTurno({ pagos }: { pagos: PagoConDetalle[] }) {
  if (pagos.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        Todavía no se registró ningún cobro en este turno.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {pagos.map((pago) => (
        <div
          key={pago.id}
          className="rounded-md border border-neutral-800 px-3 py-2 text-sm"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {pago.pedidos?.mesas
                ? `Mesa ${pago.pedidos.mesas.numero}`
                : `Para llevar — ${pago.pedidos?.cliente_nombre ?? "?"}`}
            </span>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <span>{formatoHora(pago.fecha)}</span>
              <span className="rounded-full border border-neutral-700 px-2 py-0.5">
                {LABEL_METODO[pago.metodo_pago] ?? pago.metodo_pago}
              </span>
              <span className="text-neutral-200 font-semibold">
                ${Number(pago.monto).toLocaleString("es-AR")}
              </span>
            </div>
          </div>
          {pago.pedidos?.items_pedido && (
            <div className="mt-1 text-xs text-neutral-500">
              {pago.pedidos.items_pedido
                .map((item) => `${item.cantidad}× ${item.productos.nombre}`)
                .join(" · ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
