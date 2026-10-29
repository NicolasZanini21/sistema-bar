import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para usar en componentes del navegador ("use client").
 * Lee la URL y la anon key desde las variables de entorno públicas.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
