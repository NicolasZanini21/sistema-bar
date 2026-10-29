import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { RUTA_POR_ROL } from "@/types/database";

export default async function Home() {
  const usuario = await getUsuarioActual();

  if (usuario) {
    redirect(RUTA_POR_ROL[usuario.rol]);
  }

  redirect("/login");
}
