import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PantallaRol } from "@/components/PantallaRol";
import { MapaMesas } from "@/components/MapaMesas";
import { ListaLlevar } from "@/components/ListaLlevar";
import type { Mesa, PedidoParaLlevar } from "@/types/database";

export default async function MozoPage() {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "MOZO") redirect("/login");

  const supabase = await createClient();
  const { data: mesas } = await supabase
    .from("mesas")
    .select("*")
    .order("numero")
    .returns<Mesa[]>();

  const { data: pedidosLlevar } = await supabase
    .from("pedidos")
    .select("*, items_pedido(cantidad, productos(nombre, precio))")
    .eq("tipo_pedido", "LLEVAR")
    .in("estado", ["ABIERTO", "EN_PREPARACION", "CUENTA_PEDIDA"])
    .order("creado_en")
    .returns<
      (PedidoParaLlevar & {
        items_pedido: {
          cantidad: number;
          productos: { nombre: string; precio: number } | null;
        }[];
      })[]
    >();

  return (
    <PantallaRol titulo="Mapa de mesas" nombre={usuario.nombre}>
      <MapaMesas mesasIniciales={mesas ?? []} />

      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
            Para llevar
          </h2>
          <Link
            href="/mozo/llevar/nuevo"
            className="text-sm rounded-md bg-sky-600 text-white font-medium px-3 py-1.5 hover:bg-sky-500 transition-colors"
          >
            + Nuevo pedido para llevar
          </Link>
        </div>
        <ListaLlevar pedidosIniciales={pedidosLlevar ?? []} />
      </section>
    </PantallaRol>
  );
}
