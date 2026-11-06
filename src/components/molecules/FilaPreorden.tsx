import { Link } from 'react-router';
import { saldoPendiente } from '../../lib/calculos';
import { formatearFechaEstimada } from '../../lib/fechas';
import type { Preorden } from '../../types';
import { BadgeEstado, BadgePago } from '../atoms/Badge';
import { PortadaSinFoto } from '../atoms/PortadaSinFoto';
import { useImagen } from '../../lib/useImagen';
import { Monto } from '../atoms/Monto';

interface Props {
  preorden: Preorden;
  tienda?: string;
}

/**
 * Fila compacta de Inicio ("Más adelante" y "También por pagar") (especificación 8.1).
 * A la derecha va el saldo; si ya está pagada, el estado (en camino) o "Pagado".
 */
export function FilaPreorden({ preorden: p, tienda }: Props) {
  const url = useImagen(p.imagenId);
  const saldo = saldoPendiente(p);
  const detalle = [tienda, formatearFechaEstimada(p.fechaEstimada)].filter(Boolean).join(' · ');

  return (
    <Link
      to={`/preordenes/${p.id}`}
      className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-superficie-suave"
    >
      <span className="relative size-[54px] shrink-0 overflow-hidden rounded-[14px] bg-marino-500">
        {url ? (
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <PortadaSinFoto nombre={p.nombre} estado={p.estado} className="pt-2 text-[34px]" />
        )}
      </span>
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
