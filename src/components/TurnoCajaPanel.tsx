import { abrirTurno, cerrarTurno } from "@/app/caja/actions";
import { BotonAccion } from "@/components/BotonAccion";
import type { TurnoCajaConUsuario } from "@/types/database";

function formatoHora(fecha: string) {
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TurnoCajaPanel({
  turno,
  ultimoCerrado,
}: {
  turno: TurnoCajaConUsuario | null;
  ultimoCerrado: TurnoCajaConUsuario | null;
}) {
  if (!turno) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-5 mb-6">
        <h2 className="text-base font-semibold mb-1">No hay un turno abierto</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Abrí un turno para empezar a registrar pagos.
        </p>
        <form action={abrirTurno} className="flex items-center gap-2">
          <input
            name="monto_inicial"
            type="number"
            step="1"
            min="0"
            placeholder="Monto inicial en caja"
            defaultValue={0}
            className="rounded-md bg-neutral-900 border border-neutral-700 text-sm px-3 py-1.5 w-48"
          />
          <BotonAccion variant="primary" pendingText="Abriendo…">
            Abrir turno
          </BotonAccion>
        </form>

        {ultimoCerrado && (
          <div className="mt-5 pt-4 border-t border-neutral-800 text-xs text-neutral-500">
            Último turno cerrado por{" "}
            <span className="text-neutral-300">
              {ultimoCerrado.usuarios?.nombre}
            </span>{" "}
            el {formatoHora(ultimoCerrado.cerrado_en!)} — total $
            {(
              (ultimoCerrado.total_efectivo ?? 0) +
              (ultimoCerrado.total_tarjeta ?? 0) +
              (ultimoCerrado.total_transferencia ?? 0)
            ).toLocaleString("es-AR")}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-violet-900/50 bg-gradient-to-br from-violet-950/30 to-neutral-950 p-5 mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold text-violet-300 inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          Turno abierto
        </h2>
        <p className="text-sm text-neutral-400">
          {turno.usuarios?.nombre} · desde {formatoHora(turno.abierto_en)} ·
          base ${turno.monto_inicial.toLocaleString("es-AR")}
        </p>
      </div>
      <form action={cerrarTurno.bind(null, turno.id)}>
        <BotonAccion
          variant="danger"
          className="border border-neutral-700 hover:border-rose-800"
          confirmMessage="¿Cerrar el turno de caja? Se van a calcular los totales cobrados."
          pendingText="Cerrando…"
        >
          Cerrar turno
        </BotonAccion>
      </form>
    </div>
  );
}
