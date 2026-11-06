import { Link } from 'react-router';
import { Icono } from '../components/atoms/Icono';
import { usePreordi } from '../context/PreordiContext';
import { totales } from '../lib/calculos';
import { formatearMonto } from '../lib/dinero';

// Especificación 8.1 — por ahora: total pendiente y estado vacío.
export function Inicio() {
  const { datos } = usePreordi();
  const t = totales(datos.preordenes);
  const progreso = t.comprometido > 0 ? t.yaPagado / t.comprometido : 0;

  return (
    <main className="flex flex-col gap-5 px-5 pt-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-naranja-500 text-marino-500">
            <Icono nombre="caja" tamano={22} grosor={2} />
          </span>
          <span className="font-display text-2xl font-bold tracking-tight">Preordi</span>
        </div>
        <Link to="/config" aria-label="Configuración" className="flex size-11 items-center justify-center rounded-full">
          <Icono nombre="ajustes" tamano={22} />
        </Link>
      </header>

      <section className="flex flex-col gap-3.5 rounded-[20px] bg-marino-500 p-5 text-papel">
        <div className="flex flex-col">
          <span className="text-sm text-marino-300">Total pendiente</span>
          <span className="font-display text-[42px] leading-tight font-bold tracking-tight tabular-nums">
            {formatearMonto(t.totalPendiente)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-marino-700">
          <div className="h-2 rounded-full bg-naranja-500" style={{ width: `${Math.round(progreso * 100)}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <span className="text-[13px] text-marino-300">Comprometido</span>
            <span className="text-[17px] font-medium tabular-nums">{formatearMonto(t.comprometido)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] text-marino-300">Ya pagado</span>
            <span className="text-[17px] font-medium tabular-nums">{formatearMonto(t.yaPagado)}</span>
          </div>
        </div>
      </section>

      {datos.preordenes.length === 0 && (
        <section className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-tono-naranja text-tono-naranja-texto">
            <Icono nombre="caja" tamano={32} grosor={1.6} />
          </span>
          <p className="font-display text-xl font-bold">Todavía no hay preórdenes</p>
          <Link
            to="/preordenes/nueva"
            className="flex min-h-[50px] items-center rounded-full bg-principal px-6 font-bold text-principal-texto"
          >
            Agregar preorden
          </Link>
        </section>
      )}

      <Link
        to="/preordenes/nueva"
        aria-label="Agregar preorden"
        className="absolute right-5 bottom-24 z-10 flex size-15 items-center justify-center rounded-full bg-naranja-500 text-marino-500"
      >
        <Icono nombre="mas" tamano={28} grosor={2.2} />
      </Link>
    </main>
  );
}
