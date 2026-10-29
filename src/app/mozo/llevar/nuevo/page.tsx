import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { crearPedidoLlevar } from "../actions";
import { NuevoPedidoForm } from "@/components/NuevoPedidoForm";
import type { Categoria, Producto } from "@/types/database";

export default async function NuevoPedidoLlevarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "MOZO") redirect("/login");

  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: categorias } = await supabase
    .from("categorias")
    .select("*")
    .returns<Categoria[]>();

  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .returns<Producto[]>();

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <header className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
        <div>
          <Link href="/mozo" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← Volver al mapa
          </Link>
          <h1 className="text-xl font-semibold mt-1">Nuevo pedido para llevar</h1>
        </div>
      </header>

      <NuevoPedidoForm
        categorias={categorias ?? []}
        productos={productos ?? []}
        error={error}
        accion={crearPedidoLlevar}
        extra={
          <div>
            <label
              htmlFor="cliente_nombre"
              className="block text-sm font-medium text-neutral-300 mb-1"
            >
              Nombre del cliente
            </label>
            <input
              id="cliente_nombre"
              type="text"
              name="cliente_nombre"
              required
              placeholder="Ej: Juan"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
        }
      />
    </main>
  );
}
