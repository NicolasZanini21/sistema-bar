import { createClient } from "@/lib/supabase/server";
import type { Usuario } from "@/types/database";

/**
 * Devuelve el usuario logueado (con su rol) o null si no hay sesión.
 * Pensado para usarse en Server Components de las pantallas por rol.
 */
export async function getUsuarioActual(): Promise<Usuario | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .single<Usuario>();

  return usuario ?? null;
}
