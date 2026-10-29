"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { descontarStockDePedido } from "@/lib/stock";
import type { Producto } from "@/types/database";

/**
 * Crea un pedido para llevar (sin mesa asociada), con los productos
 * elegidos. Igual que crearPedido pero sin tocar mesas.
 */
export async function crearPedidoLlevar(formData: FormData) {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "MOZO") redirect("/login");

  const supabase = await createClient();

  const clienteNombre = (formData.get("cliente_nombre") as string)?.trim();
  if (!clienteNombre) {
    redirect("/mozo/llevar/nuevo?error=Poné el nombre del cliente");
  }

  const cantidades = new Map<string, number>();
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("cantidad-")) continue;
    const cantidad = Number(value);
    if (cantidad > 0) {
      cantidades.set(key.replace("cantidad-", ""), cantidad);
    }
  }

  if (cantidades.size === 0) {
    redirect("/mozo/llevar/nuevo?error=Elegí al menos un producto");
  }

  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .in("id", Array.from(cantidades.keys()))
    .returns<Producto[]>();

  if (!productos || productos.length === 0) {
    redirect("/mozo/llevar/nuevo?error=No se encontraron los productos");
  }

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      mesa_id: null,
      mozo_id: usuario.id,
      estado: "ABIERTO",
      tipo_pedido: "LLEVAR",
      cliente_nombre: clienteNombre,
    })
    .select("id")
    .single<{ id: string }>();

  if (pedidoError || !pedido) {
    redirect("/mozo/llevar/nuevo?error=No se pudo crear el pedido");
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
    redirect("/mozo/llevar/nuevo?error=No se pudieron cargar los ítems");
  }

  // Descuenta stock según la receta de cada producto pedido (si tiene).
  await descontarStockDePedido(
    supabase,
    productos!.map((p) => p.id),
    cantidades
  );

  revalidatePath("/mozo");
  revalidatePath("/admin");
  redirect(`/mozo/llevar/${pedido!.id}`);
}

/**
 * Pide la cuenta de un pedido para llevar: solo si todos los ítems ya
 * están ENTREGADOs. Pasa el pedido a CUENTA_PEDIDA (no hay mesa que tocar).
 */
export async function pedirCuentaLlevar(pedidoId: string) {
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
    redirect(`/mozo/llevar/${pedidoId}?error=Todavía hay ítems sin entregar`);
  }

  await supabase
    .from("pedidos")
    .update({ estado: "CUENTA_PEDIDA" })
    .eq("id", pedidoId);

  revalidatePath("/mozo");
  redirect(`/mozo/llevar/${pedidoId}`);
}
