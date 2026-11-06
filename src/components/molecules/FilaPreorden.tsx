import { Link } from 'react-router';
import { saldoPendiente } from '../../lib/calculos';
import { formatearMonto } from '../../lib/dinero';
import { formatearFechaEstimada } from '../../lib/fechas';
import type { Preorden } from '../../types';
import { BadgeEstado, BadgePago, claseTonoEstado } from '../atoms/Badge';
import { Icono } from '../atoms/Icono';

interface Props {
  preorden: Preorden;
  tienda?: string;
}

/**
 * Fila compacta para "Próximas llegadas" en Inicio (especificación 8.1).
 * A la derecha va el saldo; si ya está pagada, el estado (en camino) o "Pagado".
 */
export function FilaPreorden({ preorden: p, tienda }: Props) {
  const saldo = saldoPendiente(p);
  const detalle = [tienda, formatearFechaEstimada(p.fechaEstimada)].filter(Boolean).join(' · ');

  return (
    <Link
      to={`/preordenes/${p.id}`}
      className="flex items-center gap-3 rounded-[14px] border border-borde-suave bg-superficie p-2.5 transition-colors hover:border-borde-fuerte"
    >
      <span
        aria-hidden="true"
        className={`flex size-[52px] shrink-0 items-center justify-center rounded-[10px] ${claseTonoEstado(p.estado)}`}
      >
        <Icono nombre="imagen" tamano={22} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-medium">{p.nombre}</span>
        <span className="truncate text-[13px] text-tinta-suave">{detalle}</span>
      </span>
      {saldo > 0 ? (
        <span className="flex shrink-0 flex-col items-end">
          <span className="text-xs text-tinta-suave">Saldo</span>
          <span className="text-[15px] font-bold tabular-nums">{formatearMonto(saldo)}</span>
        </span>
      ) : (
        <span className="shrink-0">
          {p.estado === 'en_camino' ? <BadgeEstado estado="en_camino" /> : <BadgePago estadoPago="completo" />}
        </span>
      )}
    </Link>
  );
}
