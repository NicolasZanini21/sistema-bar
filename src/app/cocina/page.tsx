import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PantallaRol } from "@/components/PantallaRol";
import { ColaPreparacion } from "@/components/ColaPreparacion";
import type { ItemPedidoParaCola } from "@/types/database";

export default async function CocinaPage() {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "COCINA") redirect("/login");

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items_pedido")
    .select("*, productos(*), pedidos(*, mesas(numero))")
    .eq("destino", "COCINA")
    .in("estado", ["PENDIENTE", "EN_PREPARACION", "LISTO"])
    .order("id")
    .returns<ItemPedidoParaCola[]>();

  return (
    <PantallaRol titulo="Cola de cocina" nombre={usuario.nombre}>
      <ColaPreparacion destino="COCINA" itemsIniciales={items ?? []} />
    </PantallaRol>
  );
}
