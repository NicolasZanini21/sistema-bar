import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PantallaRol } from "@/components/PantallaRol";
import { BotonAccion } from "@/components/BotonAccion";
import {
  crearCategoria,
  eliminarCategoria,
  crearProducto,
  actualizarProducto,
  crearMesa,
  eliminarMesa,
  crearInsumo,
  actualizarInsumo,
  eliminarInsumo,
  agregarRecetaItem,
  eliminarRecetaItem,
} from "./actions";
import type {
  Categoria,
  Mesa,
  Usuario,
  TurnoCajaConUsuario,
  Insumo,
  ProductoConReceta,
} from "@/types/database";

function formatoHora(fecha: string) {
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "ADMIN") redirect("/login");

  const { error } = await searchParams;
  const supabase = await createClient();

  const [
    { data: categorias },
    { data: productos },
    { data: mesas },
    { data: usuarios },
    { data: turnos },
    { data: insumos },
  ] = await Promise.all([
    supabase.from("categorias").select("*").order("nombre").returns<Categoria[]>(),
    supabase
      .from("productos")
      .select("*, categorias(nombre), receta_items(*, insumos(nombre, unidad))")
      .order("nombre")
      .returns<ProductoConReceta[]>(),
    supabase.from("mesas").select("*").order("numero").returns<Mesa[]>(),
    supabase.from("usuarios").select("*").order("nombre").returns<Usuario[]>(),
    supabase
      .from("turnos_caja")
      .select("*, usuarios(nombre)")
      .order("abierto_en", { ascending: false })
      .limit(10)
      .returns<TurnoCajaConUsuario[]>(),
    supabase.from("insumos").select("*").order("nombre").returns<Insumo[]>(),
  ]);

  return (
    <PantallaRol titulo="Admin" nombre={usuario.nombre}>
      <div className="flex flex-col gap-10 max-w-3xl">
        {error && (
          <p className="text-sm text-rose-400 border border-rose-900 bg-rose-950/50 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {/* ---------- Categorías ---------- */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Categorías</h2>

          <form
            action={crearCategoria}
            className="flex items-center gap-2 mb-4"
          >
            <input
              name="nombre"
              placeholder="Nombre de la categoría"
              required
              className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-3 py-1.5 flex-1"
            />
            <BotonAccion variant="primary" pendingText="Agregando…">
              Agregar
            </BotonAccion>
          </form>

          <div className="flex flex-col gap-1">
            {(categorias ?? []).map((categoria) => (
              <div
                key={categoria.id}
                className="flex items-center justify-between text-sm border-b border-neutral-900 py-1.5"
              >
                <span>{categoria.nombre}</span>
                <form action={eliminarCategoria.bind(null, categoria.id)}>
                  <BotonAccion
                    variant="danger"
                    className="!px-0 !py-0 text-xs"
                    confirmMessage={`¿Borrar la categoría "${categoria.nombre}"?`}
                    pendingText="Borrando…"
                  >
                    Borrar
                  </BotonAccion>
                </form>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Productos ---------- */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Productos</h2>

          <form
            action={crearProducto}
            className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6 items-end"
          >
            <input
              name="nombre"
              placeholder="Nombre"
              required
              className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-3 py-1.5 col-span-2"
            />
            <input
              name="precio"
              type="number"
              step="1"
              min="1"
              placeholder="Precio"
              required
              className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-3 py-1.5"
            />
            <select
              name="categoria_id"
              className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-3 py-1.5"
            >
              <option value="">Sin categoría</option>
              {(categorias ?? []).map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
            <select
              name="destino"
              defaultValue="COCINA"
              className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-3 py-1.5"
            >
              <option value="COCINA">Cocina</option>
              <option value="BARRA">Barra</option>
            </select>
            <div className="col-span-2 sm:col-span-5">
              <BotonAccion
                variant="primary"
                className="w-full"
                pendingText="Agregando…"
              >
                Agregar producto
              </BotonAccion>
            </div>
          </form>

          <div className="flex flex-col gap-2">
            {(productos ?? []).map((producto) => (
              <form
                key={producto.id}
                action={actualizarProducto.bind(null, producto.id)}
                className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center border border-neutral-800 rounded-md p-2 hover:border-neutral-700 transition-colors"
              >
                <input
                  name="nombre"
                  defaultValue={producto.nombre}
                  required
                  className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-2 py-1 col-span-2"
                />
                <input
                  name="precio"
                  type="number"
                  step="1"
                  min="1"
                  defaultValue={producto.precio}
                  required
                  className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-2 py-1"
                />
                <select
                  name="categoria_id"
                  defaultValue={producto.categoria_id ?? ""}
                  className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-2 py-1"
                >
                  <option value="">Sin categoría</option>
                  {(categorias ?? []).map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
                <select
                  name="destino"
                  defaultValue={producto.destino}
                  className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-2 py-1"
                >
                  <option value="COCINA">Cocina</option>
                  <option value="BARRA">Barra</option>
                </select>
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1 text-xs text-neutral-400">
                    <input
                      type="checkbox"
                      name="activo"
                      defaultChecked={producto.activo}
                    />
                    Activo
                  </label>
                  <BotonAccion variant="ghost" className="text-xs !px-2 !py-1" pendingText="…">
                    Guardar
                  </BotonAccion>
                </div>
              </form>
            ))}
          </div>
        </section>

        {/* ---------- Mesas ---------- */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Mesas</h2>

          <form action={crearMesa} className="flex items-center gap-2 mb-4">
            <input
              name="numero"
              type="number"
              min="1"
              placeholder="Número de mesa"
              required
              className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-3 py-1.5"
            />
            <BotonAccion variant="primary" pendingText="Agregando…">
              Agregar mesa
            </BotonAccion>
          </form>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(mesas ?? []).map((mesa) => (
              <div
                key={mesa.id}
                className="flex items-center justify-between border border-neutral-800 rounded-md px-2 py-1.5 text-sm"
              >
                <span>Mesa {mesa.numero}</span>
                {mesa.estado === "LIBRE" && (
                  <form action={eliminarMesa.bind(null, mesa.id)}>
                    <BotonAccion
                      variant="danger"
                      className="!px-0 !py-0"
                      confirmMessage={`¿Borrar la Mesa ${mesa.numero}?`}
                      pendingText="…"
                    >
                      ✕
                    </BotonAccion>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Insumos ---------- */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Insumos</h2>
          <p className="text-xs text-neutral-500 mb-3">
            Stock de ingredientes/materias primas. Se descuenta solo cuando
            un producto con receta se pide.
          </p>

          <form
            action={crearInsumo}
            className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 items-start"
          >
            <label className="flex flex-col gap-1 col-span-2">
              <span className="text-xs text-neutral-500">Nombre</span>
              <input
                name="nombre"
                required
                className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-3 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-500">Unidad (ml, g, unidad…)</span>
              <input
                name="unidad"
                defaultValue="unidad"
                className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-3 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-500">Stock inicial (lo que tenés ahora)</span>
              <input
                name="stock_actual"
                type="number"
                step="0.1"
                min="0"
                defaultValue={0}
                className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-3 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-500">Stock mínimo (avisa si baja de esto)</span>
              <input
                name="stock_minimo"
                type="number"
                step="0.1"
                min="0"
                defaultValue={0}
                className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-3 py-1.5"
              />
            </label>
            <div className="col-span-2 sm:col-span-5">
              <BotonAccion variant="primary" className="w-full" pendingText="Agregando…">
                Agregar insumo
              </BotonAccion>
            </div>
          </form>

          <div className="flex flex-col gap-3">
            {(insumos ?? []).map((insumo) => {
              const bajoStock = insumo.stock_actual <= insumo.stock_minimo;
              return (
                <form
                  key={insumo.id}
                  action={actualizarInsumo.bind(null, insumo.id)}
                  className={`grid grid-cols-2 sm:grid-cols-5 gap-2 items-start border rounded-md p-2 transition-colors ${
                    bajoStock
                      ? "border-rose-800/60 bg-rose-950/10"
                      : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <label className="flex flex-col gap-1 col-span-2">
                    <span className="text-[10px] text-neutral-500">Nombre</span>
                    <input
                      name="nombre"
                      defaultValue={insumo.nombre}
                      required
                      className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-neutral-500">Unidad</span>
                    <input
                      name="unidad"
                      defaultValue={insumo.unidad}
                      className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-neutral-500">Stock actual</span>
                    <input
                      name="stock_actual"
                      type="number"
                      step="0.1"
                      defaultValue={insumo.stock_actual}
                      className={`rounded-md bg-neutral-900 border text-sm px-2 py-1 ${
                        bajoStock ? "border-rose-700 text-rose-300" : "border-neutral-700"
                      }`}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-neutral-500">Stock mínimo</span>
                    <input
                      name="stock_minimo"
                      type="number"
                      step="0.1"
                      defaultValue={insumo.stock_minimo}
                      className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-2 py-1"
                    />
                  </label>
                  <div className="col-span-2 sm:col-span-5 flex items-center justify-between pt-1">
                    {bajoStock && (
                      <span className="text-xs text-rose-400 font-medium">
                        Stock bajo
                      </span>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <BotonAccion variant="ghost" className="text-xs !px-2 !py-1" pendingText="…">
                        Guardar
                      </BotonAccion>
                      <BotonAccion
                        variant="danger"
                        className="text-xs"
                        confirmMessage={`¿Borrar el insumo "${insumo.nombre}"?`}
                        pendingText="…"
                      >
                        Borrar
                      </BotonAccion>
                    </div>
                  </div>
                </form>
              );
            })}
          </div>
        </section>

        {/* ---------- Recetas ---------- */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Recetas</h2>
          <p className="text-xs text-neutral-500 mb-3">
            Qué insumos (y cuánto de cada uno) consume una unidad de cada
            producto. Un producto sin receta no descuenta stock.
          </p>
          <p className="text-xs text-neutral-600 mb-3 border-l-2 border-neutral-800 pl-2">
            Usá recetas solo para lo que se sirve en cantidad fija y exacta
            (ej: 2 panes por hamburguesa, 1 lata de gaseosa). Para bebidas
            que se sirven "a ojo" (fernet, whisky, etc.) no les asignes
            receta — llevá esas botellas a mano desde Insumos.
          </p>

          <div className="flex flex-col gap-3">
            {(productos ?? []).map((producto) => (
              <div
                key={producto.id}
                className="border border-neutral-800 rounded-md p-3"
              >
                <h3 className="text-sm font-medium mb-2">{producto.nombre}</h3>

                {producto.receta_items.length > 0 && (
                  <div className="flex flex-col gap-1 mb-2">
                    {producto.receta_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-900 py-1"
                      >
                        <span>
                          {item.cantidad} {item.insumos.unidad} de{" "}
                          {item.insumos.nombre}
                        </span>
                        <form action={eliminarRecetaItem.bind(null, item.id)}>
                          <BotonAccion
                            variant="danger"
                            className="!px-0 !py-0 text-xs"
                            pendingText="…"
                          >
                            Quitar
                          </BotonAccion>
                        </form>
                      </div>
                    ))}
                  </div>
                )}

                <form
                  action={agregarRecetaItem.bind(null, producto.id)}
                  className="flex items-center gap-2"
                >
                  <select
                    name="insumo_id"
                    required
                    className="rounded-md bg-neutral-900 border border-neutral-700 text-xs px-2 py-1 flex-1"
                  >
                    <option value="">Elegir insumo…</option>
                    {(insumos ?? []).map((insumo) => (
                      <option key={insumo.id} value={insumo.id}>
                        {insumo.nombre} ({insumo.unidad})
                      </option>
                    ))}
                  </select>
                  <input
                    name="cantidad"
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="Cant. por unidad vendida"
                    title="Cuánto se consume de ese insumo por cada unidad de este producto vendida"
                    required
                    className="w-32 rounded-md bg-neutral-900 border border-neutral-700 text-xs px-2 py-1"
                  />
                  <BotonAccion variant="ghost" className="text-xs !px-2 !py-1" pendingText="…">
                    Agregar
                  </BotonAccion>
                </form>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Turnos de caja ---------- */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Turnos de caja</h2>
          <p className="text-xs text-neutral-500 mb-3">
            Últimos turnos abiertos o cerrados, con los montos manejados por
            método de pago.
          </p>
          <div className="flex flex-col gap-2">
            {(turnos ?? []).length === 0 && (
              <p className="text-sm text-neutral-600">
                Todavía no se abrió ningún turno.
              </p>
            )}
            {(turnos ?? []).map((turno) => {
              const total =
                (turno.total_efectivo ?? 0) +
                (turno.total_tarjeta ?? 0) +
                (turno.total_transferencia ?? 0);
              return (
                <Link
                  key={turno.id}
                  href={`/admin/turnos/${turno.id}`}
                  className="flex items-center justify-between text-sm border border-neutral-800 rounded-md px-3 py-2 hover:border-neutral-700 transition-colors"
                >
                  <div>
                    <span className="text-neutral-200">
                      {turno.usuarios?.nombre}
                    </span>{" "}
                    <span className="text-neutral-500">
                      · {formatoHora(turno.abierto_en)}
                      {turno.cerrado_en && ` → ${formatoHora(turno.cerrado_en)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {turno.estado === "ABIERTO" ? (
                      <span className="text-violet-400 text-xs font-medium">
                        Abierto
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-xs">
                        Efvo ${(turno.total_efectivo ?? 0).toLocaleString("es-AR")} ·
                        Tarj ${(turno.total_tarjeta ?? 0).toLocaleString("es-AR")} ·
                        Transf ${(turno.total_transferencia ?? 0).toLocaleString("es-AR")}
                        {" · "}
                        <span className="text-neutral-200 font-medium">
                          Total ${total.toLocaleString("es-AR")}
                        </span>
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ---------- Usuarios ---------- */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Usuarios</h2>
          <p className="text-xs text-neutral-500 mb-3">
            Los usuarios se crean desde el panel de Supabase (Authentication)
            — acá solo se muestran los roles asignados.
          </p>
          <div className="flex flex-col gap-1">
            {(usuarios ?? []).map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between text-sm border-b border-neutral-900 py-1.5"
              >
                <span>{u.nombre}</span>
                <span className="text-neutral-500">{u.rol}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PantallaRol>
  );
}
