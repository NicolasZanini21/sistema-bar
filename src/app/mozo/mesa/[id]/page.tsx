import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { crearPedido, pedirCuenta } from "./actions";
import { NuevoPedidoForm } from "@/components/NuevoPedidoForm";
import { ListaItemsPedido } from "@/components/ListaItemsPedido";
import type {
  Mesa,
  Categoria,
  Producto,
  Pedido,
  ItemPedidoConProducto,
} from "@/types/database";

export default async function MesaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "MOZO") redirect("/login");

  const { id: mesaId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: mesa } = await supabase
    .from("mesas")
    .select("*")
    .eq("id", mesaId)
    .single<Mesa>();

  if (!mesa) notFound();

  // Pedido abierto (todavía no cerrado/cancelado) en esta mesa
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("*")
    .eq("mesa_id", mesaId)
    .in("estado", ["ABIERTO", "EN_PREPARACION", "CUENTA_PEDIDA"])
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle<Pedido>();

  let items: ItemPedidoConProducto[] = [];
  if (pedido) {
    const { data } = await supabase
      .from("items_pedido")
      .select("*, productos(*)")
      .eq("pedido_id", pedido.id)
      .returns<ItemPedidoConProducto[]>();
    items = data ?? [];
  }

  const { data: categorias } = await supabase
    .from("categorias")
    .select("*")
    .returns<Categoria[]>();

  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .returns<Producto[]>();

  const crearPedidoDeEstaMesa = crearPedido.bind(null, mesaId);

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <header className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
        <div>
          <Link href="/mozo" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← Volver al mapa
          </Link>
          <h1 className="text-xl font-semibold mt-1">Mesa {mesa.numero}</h1>
        </div>
      </header>

      {!pedido ? (
        <NuevoPedidoForm
          categorias={categorias ?? []}
          productos={productos ?? []}
          error={error}
          accion={crearPedidoDeEstaMesa}
        />
      ) : (
        <div>
          <p className="text-sm text-neutral-500 mb-4">
            Pedido abierto — los ítems se van actualizando a medida que cocina
            y barra los preparan.
          </p>
          <ListaItemsPedido
            pedidoId={pedido.id}
            itemsIniciales={items}
            cuentaYaPedida={pedido.estado === "CUENTA_PEDIDA"}
            accionPedirCuenta={pedirCuenta.bind(null, pedido.id, mesa.id)}
          />
        </div>
      )}
    </main>
  );
}
