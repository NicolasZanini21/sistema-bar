"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import type { MetodoPago } from "@/types/database";

const METODOS_VALIDOS: MetodoPago[] = ["EFECTIVO", "TARJETA", "TRANSFERENCIA"];

async function requireCaja() {
  const usuario = await getUsuarioActual();
  if (!usuario || (usuario.rol !== "CAJA" && usuario.rol !== "ADMIN")) {
    redirect("/login");
  }
  return usuario;
}

/**
 * Registra el pago de un pedido con cuenta pedida: crea el pago (vinculado
 * al turno de caja abierto), cierra el pedido y libera la mesa.
 */
export async function registrarPago(
  pedidoId: string,
  mesaId: string | null,
  monto: number,
  formData: FormData
) {
  await requireCaja();

  const metodoPago = formData.get("metodo_pago") as string;
  if (!METODOS_VALIDOS.includes(metodoPago as MetodoPago)) return;

  const supabase = await createClient();

  const { data: turno } = await supabase
    .from("turnos_caja")
    .select("id")
    .eq("estado", "ABIERTO")
    .maybeSingle<{ id: string }>();

  if (!turno) {
    redirect("/caja?error=Tenés que abrir un turno de caja primero");
  }

  const { error: pagoError } = await supabase.from("pagos").insert({
    pedido_id: pedidoId,
    monto,
    metodo_pago: metodoPago,
    turno_id: turno.id,
  });

  if (pagoError) return;

  await supabase
    .from("pedidos")
    .update({ estado: "CERRADO", cerrado_en: new Date().toISOString() })
    .eq("id", pedidoId);

  if (mesaId) {
    await supabase.from("mesas").update({ estado: "LIBRE" }).eq("id", mesaId);
  }

  revalidatePath("/caja");
  revalidatePath("/mozo");
}

/**
 * Abre un turno de caja nuevo, con el monto inicial en caja (base para vueltos).
 * No deja abrir dos turnos a la vez.
 */
export async function abrirTurno(formData: FormData) {
  const usuario = await requireCaja();
  const montoInicial = Number(formData.get("monto_inicial") ?? 0);

  const supabase = await createClient();

  const { data: turnoExistente } = await supabase
    .from("turnos_caja")
    .select("id")
    .eq("estado", "ABIERTO")
    .maybeSingle<{ id: string }>();

  if (turnoExistente) {
    redirect("/caja?error=Ya hay un turno de caja abierto");
  }

  const { error } = await supabase.from("turnos_caja").insert({
    usuario_id: usuario.id,
    monto_inicial: montoInicial,
    estado: "ABIERTO",
  });

  if (error) redirect(`/caja?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/caja");
}

/**
 * Cierra el turno de caja abierto, calculando el total cobrado por método
 * a partir de los pagos registrados durante el turno.
 */
export async function cerrarTurno(turnoId: string) {
  await requireCaja();
  const supabase = await createClient();

  const { data: pagos } = await supabase
    .from("pagos")
    .select("monto, metodo_pago")
    .eq("turno_id", turnoId)
    .returns<{ monto: number; metodo_pago: MetodoPago }[]>();

  const totales = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 };
  for (const pago of pagos ?? []) {
    totales[pago.metodo_pago] += Number(pago.monto);
  }

  const { error } = await supabase
    .from("turnos_caja")
    .update({
      estado: "CERRADO",
      cerrado_en: new Date().toISOString(),
      total_efectivo: totales.EFECTIVO,
      total_tarjeta: totales.TARJETA,
      total_transferencia: totales.TRANSFERENCIA,
    })
    .eq("id", turnoId);

  if (error) redirect(`/caja?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/caja");
}
