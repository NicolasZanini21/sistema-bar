import { logout } from "@/app/login/actions";

export function PantallaRol({
  titulo,
  nombre,
  children,
}: {
  titulo: string;
  nombre: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen p-6 animate-fade-in">
      <header className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            {titulo}
          </h1>
          <p className="text-sm text-neutral-500">
            Hola, <span className="text-neutral-300">{nombre}</span>
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm rounded-md border border-neutral-700 px-3 py-1.5 hover:bg-neutral-900 hover:border-neutral-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </header>
      {children ?? (
        <p className="text-neutral-500 text-sm">
          Esta pantalla todavía no tiene contenido — la vamos a ir
          completando en los próximos pasos del roadmap.
        </p>
      )}
    </main>
  );
}
