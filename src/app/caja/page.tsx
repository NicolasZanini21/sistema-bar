import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PantallaRol } from "@/components/PantallaRol";
import { ColaCaja } from "@/components/ColaCaja";
import { TurnoCajaPanel } from "@/components/TurnoCajaPanel";
import { DetalleTurno } from "@/components/DetalleTurno";
import type {
  PedidoParaCaja,
  TurnoCajaConUsuario,
  PagoConDetalle,
} from "@/types/database";

export default async function CajaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "CAJA") redirect("/login");

  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: turno }, { data: ultimoCerrado }, { data: pedidos }] =
    await Promise.all([
      supabase
        .from("turnos_caja")
        .select("*, usuarios(nombre)")
        .eq("estado", "ABIERTO")
        .maybeSingle<TurnoCajaConUsuario>(),
      supabase
        .from("turnos_caja")
        .select("*, usuarios(nombre)")
        .eq("estado", "CERRADO")
        .order("cerrado_en", { ascending: false })
        .limit(1)
        .maybeSingle<TurnoCajaConUsuario>(),
      supabase
        .from("pedidos")
        .select("*, mesas(id, numero), items_pedido(*, productos(*))")
        .eq("estado", "CUENTA_PEDIDA")
        .order("creado_en")
        .returns<PedidoParaCaja[]>(),
    ]);

  let pagosDelTurno: PagoConDetalle[] = [];
  if (turno) {
    const { data } = await supabase
      .from("pagos")
      .select("*, pedidos(*, mesas(numero), items_pedido(*, productos(*)))")
      .eq("turno_id", turno.id)
      .order("fecha", { ascending: false })
      .returns<PagoConDetalle[]>();
    pagosDelTurno = data ?? [];
  }

  return (
    <PantallaRol titulo="Caja" nombre={usuario.nombre}>
      {error && (
        <p className="text-sm text-rose-400 border border-rose-900 bg-rose-950/50 rounded-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <TurnoCajaPanel turno={turno} ultimoCerrado={ultimoCerrado} />

      {turno ? (
        <div className="flex flex-col gap-8 max-w-xl">
          <ColaCaja pedidosIniciales={pedidos ?? []} />

          <section>
            <h2 className="text-base font-semibold mb-2">
              Cobrado en este turno
            </h2>
            <DetalleTurno pagos={pagosDelTurno} />
          </section>
        </div>
      ) : (
        <p className="text-neutral-500 text-sm">
          Abrí un turno para ver las mesas que están esperando el pago.
        </p>
      )}
    </PantallaRol>
  );
}
