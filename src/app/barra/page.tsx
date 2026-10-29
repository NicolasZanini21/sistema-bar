import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PantallaRol } from "@/components/PantallaRol";
import { ColaPreparacion } from "@/components/ColaPreparacion";
import type { ItemPedidoParaCola } from "@/types/database";

export default async function BarraPage() {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "BARRA") redirect("/login");

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items_pedido")
    .select("*, productos(*), pedidos(*, mesas(numero))")
    .eq("destino", "BARRA")
    .in("estado", ["PENDIENTE", "EN_PREPARACION", "LISTO"])
    .order("id")
    .returns<ItemPedidoParaCola[]>();

  return (
    <PantallaRol titulo="Cola de barra" nombre={usuario.nombre}>
      <ColaPreparacion destino="BARRA" itemsIniciales={items ?? []} />
    </PantallaRol>
  );
}
