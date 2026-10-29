"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { descontarStockDePedido } from "@/lib/stock";
import type { Producto } from "@/types/database";

/**
 * Crea un nuevo pedido en una mesa libre, con los productos elegidos,
 * y la pasa a OCUPADA. Cada ítem queda PENDIENTE en la cola de su destino
 * (cocina o barra).
 */
export async function crearPedido(mesaId: string, formData: FormData) {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "MOZO") redirect("/login");

  const supabase = await createClient();

  // formData trae un campo "cantidad-<productoId>" por cada producto del catálogo
  const cantidades = new Map<string, number>();
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("cantidad-")) continue;
    const cantidad = Number(value);
    if (cantidad > 0) {
      cantidades.set(key.replace("cantidad-", ""), cantidad);
    }
  }

  if (cantidades.size === 0) {
    redirect(`/mozo/mesa/${mesaId}?error=Elegí al menos un producto`);
  }

  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .in("id", Array.from(cantidades.keys()))
    .returns<Producto[]>();

  if (!productos || productos.length === 0) {
    redirect(`/mozo/mesa/${mesaId}?error=No se encontraron los productos`);
  }

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({ mesa_id: mesaId, mozo_id: usuario.id, estado: "ABIERTO" })
    .select("id")
    .single<{ id: string }>();

  if (pedidoError || !pedido) {
    redirect(`/mozo/mesa/${mesaId}?error=No se pudo crear el pedido`);
  }

  const items = productos!.map((producto) => ({
    pedido_id: pedido!.id,
    producto_id: producto.id,
    cantidad: cantidades.get(producto.id)!,
    destino: producto.destino,
    estado: "PENDIENTE" as const,
  }));

  const { error: itemsError } = await supabase
    .from("items_pedido")
    .insert(items);

  if (itemsError) {
    redirect(`/mozo/mesa/${mesaId}?error=No se pudieron cargar los ítems`);
  }

  await supabase
    .from("mesas")
    .update({ estado: "OCUPADA" })
    .eq("id", mesaId);

  // Descuenta stock según la receta de cada producto pedido (si tiene).
  await descontarStockDePedido(
    supabase,
    productos!.map((p) => p.id),
    cantidades
  );

  revalidatePath("/mozo");
  revalidatePath("/admin");
  redirect(`/mozo/mesa/${mesaId}`);
}

/**
 * El mozo marca un ítem LISTO como ENTREGADO, cuando lo lleva a la mesa.
 */
export async function marcarEntregado(itemId: string) {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "MOZO") return;

  const supabase = await createClient();

  await supabase
    .from("items_pedido")
    .update({ estado: "ENTREGADO" })
    .eq("id", itemId)
    .eq("estado", "LISTO");

  revalidatePath("/mozo");
}

/**
 * Pide la cuenta: solo si todos los ítems del pedido ya están ENTREGADOs.
 * Pasa el pedido a CUENTA_PEDIDA y la mesa también, para que caja la vea.
 */
export async function pedirCuenta(pedidoId: string, mesaId: string) {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "MOZO") return;

  const supabase = await createClient();

  const { data: items } = await supabase
    .from("items_pedido")
    .select("estado")
    .eq("pedido_id", pedidoId)
    .returns<{ estado: string }[]>();

  const todoEntregado =
    !!items && items.length > 0 && items.every((i) => i.estado === "ENTREGADO");

  if (!todoEntregado) {
    redirect(
      `/mozo/mesa/${mesaId}?error=Todavía hay ítems sin entregar`
    );
  }

  await supabase
    .from("pedidos")
    .update({ estado: "CUENTA_PEDIDA" })
    .eq("id", pedidoId);

  await supabase
    .from("mesas")
    .update({ estado: "CUENTA_PEDIDA" })
    .eq("id", mesaId);

  revalidatePath("/mozo");
  redirect(`/mozo/mesa/${mesaId}`);
}
