import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { pedirCuentaLlevar } from "../actions";
import { ListaItemsPedido } from "@/components/ListaItemsPedido";
import type { Pedido, ItemPedidoConProducto } from "@/types/database";

export default async function PedidoLlevarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "MOZO") redirect("/login");

  const { id: pedidoId } = await params;
  const supabase = await createClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("*")
    .eq("id", pedidoId)
    .eq("tipo_pedido", "LLEVAR")
    .single<Pedido>();

  if (!pedido) notFound();

  const { data } = await supabase
    .from("items_pedido")
    .select("*, productos(*)")
    .eq("pedido_id", pedido.id)
    .returns<ItemPedidoConProducto[]>();

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <header className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
        <div>
          <Link href="/mozo" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← Volver al mapa
          </Link>
          <h1 className="text-xl font-semibold mt-1">
            Para llevar — {pedido.cliente_nombre}
          </h1>
        </div>
      </header>

      <p className="text-sm text-neutral-500 mb-4">
        Pedido abierto — los ítems se van actualizando a medida que cocina y
        barra los preparan.
      </p>

      <ListaItemsPedido
        pedidoId={pedido.id}
        itemsIniciales={data ?? []}
        cuentaYaPedida={pedido.estado === "CUENTA_PEDIDA"}
        accionPedirCuenta={pedirCuentaLlevar.bind(null, pedido.id)}
      />
    </main>
  );
}
