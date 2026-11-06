import { Link } from 'react-router';
import { Icono } from '../components/atoms/Icono';
import { FilaPreorden } from '../components/molecules/FilaPreorden';
import { usePreordi } from '../context/PreordiContext';
import { saldoPendiente, totales } from '../lib/calculos';
import { formatearMonto } from '../lib/dinero';
import { formatearFechaEstimada, hoy as fechaDeHoy } from '../lib/fechas';
import { resumenInicio } from '../lib/inicio';
import type { Preorden } from '../types';

interface PropsAlerta {
  a: string;
  titulo: string;
  detalle: string;
}

function Alerta({ a, titulo, detalle }: PropsAlerta) {
  return (
    <Link
      to={a}
      className="flex items-center gap-3 rounded-[14px] border border-acento-borde bg-acento-tenue px-3.5 py-3 text-acento-tenue-texto"
    >
      <Icono nombre="alerta" tamano={22} className="shrink-0 text-acento-texto" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-bold">{titulo}</span>
        <span className="truncate text-[13px]">{detalle}</span>
      </span>
      <Icono nombre="adelante" tamano={18} className="shrink-0" />
    </Link>
  );
}

/** Con una sola preorden, la alerta lleva directo a ella; con varias, a la lista. */
const destino = (lista: Preorden[], listaUrl: string) => (lista.length === 1 ? `/preordenes/${lista[0].id}` : listaUrl);

const nombres = (lista: Preorden[]) =>
  lista.length <= 2 ? lista.map((p) => p.nombre).join(' y ') : `${lista[0].nombre}, ${lista[1].nombre} y ${lista.length - 2} más`;

// Especificación 8.1.
export function Inicio() {
  const { datos } = usePreordi();
  const hoy = fechaDeHoy();
  const t = totales(datos.preordenes);
  const r = resumenInicio(datos.preordenes, hoy);
  const progreso = t.comprometido > 0 ? t.yaPagado / t.comprometido : 0;
  const nombreTienda = new Map(datos.tiendas.map((x) => [x.id, x.nombre]));
  const sinNada = datos.preordenes.length === 0;

  const chips = [
    { cantidad: r.apartadas, texto: r.apartadas === 1 ? 'apartada' : 'apartadas', a: '/preordenes?estado=apartada', tono: 'bg-tono-naranja text-tono-naranja-texto' },
    { cantidad: r.enCamino, texto: 'en camino', a: '/preordenes?estado=en_camino', tono: 'bg-tono-celeste text-tono-celeste-texto' },
    { cantidad: r.deseos, texto: r.deseos === 1 ? 'deseo' : 'deseos', a: '/deseos', tono: 'bg-tono-amarillo text-tono-amarillo-texto' },
  ].filter((c) => c.cantidad > 0);

  return (
    <main className="flex flex-col gap-5 px-5 pt-6 pb-20">
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

      <section aria-label="Resumen de dinero" className="flex flex-col gap-3.5 rounded-[20px] bg-marino-500 p-5 text-papel">
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

      {chips.length > 0 && (
        <nav aria-label="Resumen por estado" className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <Link
              key={c.a}
              to={c.a}
              className={`flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium ${c.tono}`}
            >
              <span className="font-bold tabular-nums">{c.cantidad}</span> {c.texto}
            </Link>
          ))}
        </nav>
      )}

      {(r.vencidas.length > 0 || r.recibidasConSaldo.length > 0) && (
        <div className="flex flex-col gap-2">
          {r.vencidas.length > 0 && (
            <Alerta
              a={destino(r.vencidas, '/preordenes')}
              titulo={r.vencidas.length === 1 ? '1 preorden vencida' : `${r.vencidas.length} preórdenes vencidas`}
              detalle={
                r.vencidas.length === 1
                  ? `${r.vencidas[0].nombre} · esperada en ${formatearFechaEstimada(r.vencidas[0].fechaEstimada)}`
                  : nombres(r.vencidas)
              }
            />
          )}
          {r.recibidasConSaldo.length > 0 && (
            <Alerta
              a={destino(r.recibidasConSaldo, '/preordenes?estado=todas&orden=saldo')}
              titulo={r.recibidasConSaldo.length === 1 ? '1 recibida con saldo' : `${r.recibidasConSaldo.length} recibidas con saldo`}
              detalle={
                r.recibidasConSaldo.length === 1
                  ? `${r.recibidasConSaldo[0].nombre} · faltan ${formatearMonto(saldoPendiente(r.recibidasConSaldo[0]))}`
                  : nombres(r.recibidasConSaldo)
              }
            />
          )}
        </div>
      )}

      {sinNada ? (
        <section className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-tono-naranja text-tono-naranja-texto">
            <Icono nombre="caja" tamano={32} grosor={1.6} />
          </span>
          <p className="font-display text-xl font-bold">Todavía no hay preórdenes</p>
          <p className="text-sm text-tinta-suave">Agregá lo que ya apartaste o lo que tenés en la mira.</p>
          <Link
            to="/preordenes/nueva"
            className="mt-1 flex min-h-[50px] items-center rounded-full bg-principal px-6 font-bold text-principal-texto"
          >
            Agregar preorden
          </Link>
        </section>
      ) : (
        <section aria-labelledby="titulo-proximas" className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <h2 id="titulo-proximas" className="text-xl font-bold">
              Próximas llegadas
            </h2>
            {r.proximas.length > 0 && (
              <Link to="/preordenes" className="text-sm font-medium text-acento-texto">
                Ver todas
              </Link>
            )}
          </div>
          {r.proximas.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {r.proximas.map((p) => (
                <li key={p.id}>
                  <FilaPreorden preorden={p} tienda={p.tiendaId ? nombreTienda.get(p.tiendaId) : undefined} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-borde px-4 py-5 text-center text-sm text-tinta-suave">
              {r.vencidas.length > 0 ? 'Todo lo que esperás ya está atrasado.' : 'No tenés nada en camino por ahora.'}
            </p>
          )}
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
