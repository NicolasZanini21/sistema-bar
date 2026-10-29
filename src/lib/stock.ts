import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecetaItem } from "@/types/database";

/**
 * Descuenta stock de insumos según la receta de cada producto pedido
 * (si la tiene). Productos sin receta asignada no descuentan nada.
 */
export async function descontarStockDePedido(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  productoIds: string[],
  cantidades: Map<string, number>
) {
  const { data: recetas } = await supabase
    .from("receta_items")
    .select("*")
    .in("producto_id", productoIds)
    .returns<RecetaItem[]>();

  if (!recetas || recetas.length === 0) return;

  const consumoPorInsumo = new Map<string, number>();
  for (const receta of recetas) {
    const cantidadPedida = cantidades.get(receta.producto_id) ?? 0;
    const consumo = receta.cantidad * cantidadPedida;
    consumoPorInsumo.set(
      receta.insumo_id,
      (consumoPorInsumo.get(receta.insumo_id) ?? 0) + consumo
    );
  }

  await Promise.all(
    Array.from(consumoPorInsumo.entries()).map(([insumoId, cantidad]) =>
      supabase.rpc("descontar_stock", {
        p_insumo_id: insumoId,
        p_cantidad: cantidad,
      })
    )
  );
}
