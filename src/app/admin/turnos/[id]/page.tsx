import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PantallaRol } from "@/components/PantallaRol";
import { DetalleTurno } from "@/components/DetalleTurno";
import type { TurnoCajaConUsuario, PagoConDetalle } from "@/types/database";

function formatoHora(fecha: string) {
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DetalleTurnoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "ADMIN") redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const { data: turno } = await supabase
    .from("turnos_caja")
    .select("*, usuarios(nombre)")
    .eq("id", id)
    .single<TurnoCajaConUsuario>();

  if (!turno) notFound();

  const { data: pagos } = await supabase
    .from("pagos")
    .select("*, pedidos(*, mesas(numero), items_pedido(*, productos(*)))")
    .eq("turno_id", id)
    .order("fecha", { ascending: false })
    .returns<PagoConDetalle[]>();

  const total =
    (turno.total_efectivo ?? 0) +
    (turno.total_tarjeta ?? 0) +
    (turno.total_transferencia ?? 0);

  return (
    <PantallaRol titulo="Detalle de turno" nombre={usuario.nombre}>
      <div className="max-w-xl flex flex-col gap-6">
        <Link
          href="/admin"
          className="text-sm text-neutral-500 hover:text-neutral-300 w-fit"
        >
          ← Volver a Admin
        </Link>

        <div className="rounded-lg border border-neutral-800 p-4">
          <h2 className="font-semibold mb-1">{turno.usuarios?.nombre}</h2>
          <p className="text-sm text-neutral-500 mb-3">
            {formatoHora(turno.abierto_en)}
            {turno.cerrado_en && ` → ${formatoHora(turno.cerrado_en)}`} ·
            base ${turno.monto_inicial.toLocaleString("es-AR")}
          </p>

          {turno.estado === "CERRADO" ? (
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div>
                <div className="text-neutral-500 text-xs">Efectivo</div>
                <div className="font-medium">
                  ${(turno.total_efectivo ?? 0).toLocaleString("es-AR")}
                </div>
              </div>
              <div>
                <div className="text-neutral-500 text-xs">Tarjeta</div>
                <div className="font-medium">
                  ${(turno.total_tarjeta ?? 0).toLocaleString("es-AR")}
                </div>
              </div>
              <div>
                <div className="text-neutral-500 text-xs">Transferencia</div>
                <div className="font-medium">
                  ${(turno.total_transferencia ?? 0).toLocaleString("es-AR")}
                </div>
              </div>
              <div>
                <div className="text-neutral-500 text-xs">Total</div>
                <div className="font-semibold">
                  ${total.toLocaleString("es-AR")}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-violet-400 text-sm font-medium">
              Turno abierto
            </span>
          )}
        </div>

        <section>
          <h2 className="text-base font-semibold mb-2">
            Pedidos cobrados ({pagos?.length ?? 0})
          </h2>
          <DetalleTurno pagos={pagos ?? []} />
        </section>
      </div>
    </PantallaRol>
  );
}
