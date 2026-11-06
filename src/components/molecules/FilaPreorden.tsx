import { Link } from 'react-router';
import { saldoPendiente } from '../../lib/calculos';
import { formatearFechaEstimada } from '../../lib/fechas';
import type { Preorden } from '../../types';
import { BadgeEstado, BadgePago, claseTonoEstado } from '../atoms/Badge';
import { Miniatura } from '../atoms/Miniatura';
import { Monto } from '../atoms/Monto';

interface Props {
  preorden: Preorden;
  tienda?: string;
}

/**
 * Fila compacta para "También por pagar" en Inicio (especificación 8.1).
 * A la derecha va el saldo; si ya está pagada, el estado (en camino) o "Pagado".
 */
export function FilaPreorden({ preorden: p, tienda }: Props) {
  const saldo = saldoPendiente(p);
  const detalle = [tienda, formatearFechaEstimada(p.fechaEstimada)].filter(Boolean).join(' · ');

  return (
    <Link
      to={`/preordenes/${p.id}`}
      className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-superficie-suave"
    >
      <Miniatura
        imagenId={p.imagenId}
        className="size-[54px] rounded-[14px]"
        clasesMarcador={claseTonoEstado(p.estado)}
        tamanoIcono={22}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-medium">{p.nombre}</span>
        <span className="truncate text-[13px] text-tinta-suave">{detalle}</span>
      </span>
      {saldo > 0 ? (
        <span className="flex shrink-0 flex-col items-end">
          <span className="text-[11px] text-tinta-suave">Saldo</span>
          <Monto monto={saldo} className="font-display text-[17px] leading-tight font-extrabold" />
        </span>
      ) : (
        <span className="shrink-0">
          {p.estado === 'en_camino' ? <BadgeEstado estado="en_camino" /> : <BadgePago estadoPago="completo" />}
        </span>
      )}
    </Link>
  );
}
