import { Link } from 'react-router';
import { NOMBRE_ESTADO } from '../../lib/acciones';
import { estadoPago, progresoPago, reprogramaciones, saldoPendiente, vencida } from '../../lib/calculos';
import { formatearFechaEstimada } from '../../lib/fechas';
import { useImagen } from '../../lib/useImagen';
import type { Preorden } from '../../types';
import { claseTonoEstado } from '../atoms/Badge';
import { Icono } from '../atoms/Icono';
import { Monto } from '../atoms/Monto';
import { PortadaSinFoto } from '../atoms/PortadaSinFoto';

interface Props {
  preorden: Preorden;
  tienda?: string;
  hoy: string;
  /** Mostrar el estado (en "Activas" y "Todas", donde se mezclan estados). */
  conEstado?: boolean;
}

/**
 * Fila de la lista de Preórdenes — especificación 8.2, en la dirección Vitrina (10.9):
 * portada vertical a la izquierda, sin caja alrededor, el saldo grande a la derecha.
 */
export function TarjetaPreorden({ preorden: p, tienda, hoy, conEstado = false }: Props) {
  const url = useImagen(p.imagenId);
  const saldo = saldoPendiente(p);
  const pago = estadoPago(p);
  const estaVencida = vencida(p, hoy);
  const veces = reprogramaciones(p);
  const fecha = formatearFechaEstimada(p.fechaEstimada);

  return (
    <Link
      to={`/preordenes/${p.id}`}
      className="-mx-2 flex gap-3.5 rounded-[20px] px-2 py-3 transition-colors hover:bg-superficie-suave"
    >
      <span className="relative h-[96px] w-[76px] shrink-0 overflow-hidden rounded-2xl bg-marino-500">
        {url ? (
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <PortadaSinFoto nombre={p.nombre} estado={p.estado} className="pt-5 text-[52px]" />
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
        <span className="flex items-start justify-between gap-3">
          <span className="line-clamp-2 font-display text-base leading-tight font-bold">{p.nombre}</span>
          <span className="flex shrink-0 flex-col items-end">
            {saldo > 0 ? (
              <Monto monto={saldo} className="font-display text-lg leading-tight font-extrabold" />
            ) : (
              <span className="flex items-center gap-1 text-[13px] font-bold text-tinta-suave">
                <Icono nombre="check" tamano={14} grosor={2.6} />
                {pago === 'completo' ? 'Pagada' : '—'}
              </span>
            )}
          </span>
        </span>

        <span className={`truncate text-[13px] ${estaVencida ? 'font-bold text-acento-texto' : 'text-tinta-suave'}`}>
          {estaVencida && <Icono nombre="alerta" tamano={13} grosor={2.4} className="mr-1 inline align-[-2px]" />}
          {estaVencida ? `Vencida · esperada en ${fecha}` : [tienda, fecha].filter(Boolean).join(' · ')}
        </span>

        <span className="mt-auto flex items-center gap-2">
          {conEstado && (
            <span className={`rounded-md px-1.5 py-px text-[11px] font-bold ${claseTonoEstado(p.estado)}`}>
              {NOMBRE_ESTADO[p.estado]}
            </span>
          )}
          {saldo > 0 && (
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-borde-suave">
              <span
                className="block h-full rounded-full bg-naranja-500"
                style={{ width: `${Math.round(progresoPago(p) * 100)}%` }}
              />
            </span>
          )}
          {veces > 0 && (
            <span className="shrink-0 text-[11px] text-tinta-suave">
              {veces === 1 ? 'reprogramada' : `reprogramada ${veces}×`}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
