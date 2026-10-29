"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import type { EstadoItem } from "@/types/database";

/**
 * Cambia el estado de un ítem de pedido. Lo usan tanto cocina como barra
 * para ir tomando y marcando listos sus propios ítems.
 */
export async function actualizarEstadoItem(
  itemId: string,
  nuevoEstado: EstadoItem
) {
  const usuario = await getUsuarioActual();
  if (!usuario) return;

  const rolesPermitidos = ["COCINA", "BARRA", "ADMIN"];
  if (!rolesPermitidos.includes(usuario.rol)) return;

  const supabase = await createClient();

  const { data: item } = await supabase
    .from("items_pedido")
    .select("destino")
    .eq("id", itemId)
    .single<{ destino: "COCINA" | "BARRA" }>();

  if (!item) return;

  // Cocina solo puede tocar ítems de cocina, barra solo los de barra
  if (usuario.rol !== "ADMIN" && usuario.rol !== item.destino) return;

  await supabase
    .from("items_pedido")
    .update({ estado: nuevoEstado })
    .eq("id", itemId);

  revalidatePath("/cocina");
  revalidatePath("/barra");
}
