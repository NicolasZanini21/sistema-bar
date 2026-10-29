"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import type { DestinoProducto } from "@/types/database";

async function requireAdmin() {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "ADMIN") redirect("/login");
  return usuario;
}

// ---------- Categorías ----------

export async function crearCategoria(formData: FormData) {
  await requireAdmin();
  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) redirect("/admin?error=Falta el nombre de la categoría");

  const supabase = await createClient();
  const { error } = await supabase.from("categorias").insert({ nombre });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
}

export async function eliminarCategoria(categoriaId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias")
    .delete()
    .eq("id", categoriaId);

  if (error) {
    redirect(
      `/admin?error=${encodeURIComponent(
        "No se pudo borrar: tiene productos asociados"
      )}`
    );
  }

  revalidatePath("/admin");
}

// ---------- Productos ----------

export async function crearProducto(formData: FormData) {
  await requireAdmin();
  const nombre = (formData.get("nombre") as string)?.trim();
  const precio = Number(formData.get("precio"));
  const categoriaId = (formData.get("categoria_id") as string) || null;
  const destino = formData.get("destino") as DestinoProducto;

  if (!nombre || !precio || precio <= 0) {
    redirect("/admin?error=Completá nombre y precio del producto");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("productos").insert({
    nombre,
    precio,
    categoria_id: categoriaId,
    destino,
    activo: true,
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
}

export async function actualizarProducto(
  productoId: string,
  formData: FormData
) {
  await requireAdmin();
  const nombre = (formData.get("nombre") as string)?.trim();
  const precio = Number(formData.get("precio"));
  const categoriaId = (formData.get("categoria_id") as string) || null;
  const destino = formData.get("destino") as DestinoProducto;
  const activo = formData.get("activo") === "on";

  if (!nombre || !precio || precio <= 0) {
    redirect("/admin?error=Completá nombre y precio del producto");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("productos")
    .update({
      nombre,
      precio,
      categoria_id: categoriaId,
      destino,
      activo,
    })
    .eq("id", productoId);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
}

// ---------- Mesas ----------

export async function crearMesa(formData: FormData) {
  await requireAdmin();
  const numero = Number(formData.get("numero"));
  if (!numero || numero <= 0) {
    redirect("/admin?error=Número de mesa inválido");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("mesas")
    .insert({ numero, estado: "LIBRE" });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
  revalidatePath("/mozo");
}

export async function eliminarMesa(mesaId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("mesas")
    .delete()
    .eq("id", mesaId)
    .eq("estado", "LIBRE");

  if (error) {
    redirect(
      `/admin?error=${encodeURIComponent(
        "No se pudo borrar: la mesa no está libre o tiene pedidos"
      )}`
    );
  }

  revalidatePath("/admin");
  revalidatePath("/mozo");
}

// ---------- Insumos ----------

export async function crearInsumo(formData: FormData) {
  await requireAdmin();
  const nombre = (formData.get("nombre") as string)?.trim();
  const unidad = ((formData.get("unidad") as string) || "unidad").trim();
  const stockActual = Number(formData.get("stock_actual") ?? 0);
  const stockMinimo = Number(formData.get("stock_minimo") ?? 0);

  if (!nombre) redirect("/admin?error=Falta el nombre del insumo");

  const supabase = await createClient();
  const { error } = await supabase.from("insumos").insert({
    nombre,
    unidad,
    stock_actual: stockActual,
    stock_minimo: stockMinimo,
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
}

export async function actualizarInsumo(insumoId: string, formData: FormData) {
  await requireAdmin();
  const nombre = (formData.get("nombre") as string)?.trim();
  const unidad = ((formData.get("unidad") as string) || "unidad").trim();
  const stockActual = Number(formData.get("stock_actual") ?? 0);
  const stockMinimo = Number(formData.get("stock_minimo") ?? 0);

  if (!nombre) redirect("/admin?error=Falta el nombre del insumo");

  const supabase = await createClient();
  const { error } = await supabase
    .from("insumos")
    .update({
      nombre,
      unidad,
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
    })
    .eq("id", insumoId);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
}

export async function eliminarInsumo(insumoId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("insumos").delete().eq("id", insumoId);

  if (error) {
    redirect(
      `/admin?error=${encodeURIComponent(
        "No se pudo borrar: el insumo está en una receta"
      )}`
    );
  }

  revalidatePath("/admin");
}

// ---------- Recetas ----------

export async function agregarRecetaItem(
  productoId: string,
  formData: FormData
) {
  await requireAdmin();
  const insumoId = formData.get("insumo_id") as string;
  const cantidad = Number(formData.get("cantidad"));

  if (!insumoId || !cantidad || cantidad <= 0) {
    redirect("/admin?error=Elegí un insumo y una cantidad válida");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("receta_items").insert({
    producto_id: productoId,
    insumo_id: insumoId,
    cantidad,
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
}

export async function eliminarRecetaItem(recetaItemId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("receta_items").delete().eq("id", recetaItemId);

  revalidatePath("/admin");
}
