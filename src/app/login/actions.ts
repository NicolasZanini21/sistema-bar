"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RUTA_POR_ROL, type RolUsuario } from "@/types/database";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Completá email y contraseña");
  }

  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (authError || !authData.user) {
    // Mensaje temporal con el detalle real, para diagnosticar.
    redirect(
      `/login?error=${encodeURIComponent(
        authError?.message ?? "Error desconocido al iniciar sesión"
      )}`
    );
  }

  // Buscamos el rol del usuario para saber a qué pantalla mandarlo
  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", authData.user.id)
    .single<{ rol: RolUsuario }>();

  if (usuarioError || !usuario) {
    await supabase.auth.signOut();
    redirect(
      "/login?error=Tu usuario no tiene un rol asignado. Avisá al admin."
    );
  }

  redirect(RUTA_POR_ROL[usuario.rol]);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
