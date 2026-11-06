import { Link } from 'react-router';
import { saldoPendiente } from '../../lib/calculos';
import { formatearMonto } from '../../lib/dinero';
import { formatearFechaEstimada } from '../../lib/fechas';
import type { Preorden } from '../../types';
import { BadgeEstado, BadgePago, claseTonoEstado } from '../atoms/Badge';
import { Miniatura } from '../atoms/Miniatura';

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
      <Miniatura
        imagenId={p.imagenId}
        className="size-[52px] rounded-[10px]"
        clasesMarcador={claseTonoEstado(p.estado)}
        tamanoIcono={22}
      />
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
