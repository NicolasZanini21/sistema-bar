import { login } from "./actions";
import { BotonAccion } from "@/components/BotonAccion";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 text-xl font-bold text-white shadow-lg shadow-violet-900/40">
            SB
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sistema Bar</h1>
          <p className="text-neutral-500 mt-1">Iniciá sesión con tu usuario</p>
        </div>

        <form
          action={login}
          className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-950/60 p-6 shadow-xl shadow-black/30"
        >
          <div>
            <label htmlFor="email" className="block text-sm mb-1 text-neutral-400">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none transition-colors focus:border-violet-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-1 text-neutral-400">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none transition-colors focus:border-violet-500"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-400 text-center">{error}</p>
          )}

          <BotonAccion variant="accent" className="mt-2 w-full py-2" pendingText="Entrando…">
            Entrar
          </BotonAccion>
        </form>
      </div>
    </main>
  );
}
