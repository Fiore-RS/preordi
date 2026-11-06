import { Link } from 'react-router';
import { estadoPago, progresoPago, reprogramaciones, saldoPendiente, vencida } from '../../lib/calculos';
import { formatearMonto } from '../../lib/dinero';
import { formatearFechaEstimada } from '../../lib/fechas';
import type { Preorden } from '../../types';
import { Badge, BadgeEstado, BadgePago, BadgeVencida, claseTonoEstado } from '../atoms/Badge';
import { Icono } from '../atoms/Icono';

interface Props {
  preorden: Preorden;
  tienda?: string;
  hoy: string;
  /** Mostrar el badge de estado (en "Activas" y "Todas", donde se mezclan estados). */
  conEstado?: boolean;
}

/** Tarjeta de la lista de Preórdenes — especificación 8.2. */
export function TarjetaPreorden({ preorden: p, tienda, hoy, conEstado = false }: Props) {
  const saldo = saldoPendiente(p);
  const pago = estadoPago(p);
  const estaVencida = vencida(p, hoy);
  const veces = reprogramaciones(p);
  const detalle = [tienda, formatearFechaEstimada(p.fechaEstimada)].filter(Boolean).join(' · ');

  return (
    <Link
      to={`/preordenes/${p.id}`}
      className={`flex gap-3 rounded-2xl border bg-superficie p-3 transition-colors hover:border-borde-fuerte ${
        estaVencida ? 'border-acento-borde' : 'border-borde-suave'
      }`}
    >
      {/* Miniatura (la imagen llega en la fase 6) */}
      <span
        aria-hidden="true"
        className={`flex size-[72px] shrink-0 items-center justify-center rounded-xl ${claseTonoEstado(p.estado)}`}
      >
        <Icono nombre="imagen" tamano={26} grosor={1.6} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 text-[15px] leading-snug font-medium">{p.nombre}</span>
          <span className={`text-[15px] font-bold whitespace-nowrap tabular-nums ${saldo === 0 ? 'text-tinta-suave' : ''}`}>
            {formatearMonto(saldo)}
          </span>
        </span>
        {detalle && <span className="truncate text-[13px] text-tinta-suave">{detalle}</span>}
        <span className="flex flex-wrap gap-1.5">
          {conEstado && <BadgeEstado estado={p.estado} />}
          {estaVencida && <BadgeVencida />}
          <BadgePago estadoPago={pago} />
          {veces > 0 && (
            <Badge tono="gris">
              Reprogramada {veces} {veces === 1 ? 'vez' : 'veces'}
            </Badge>
          )}
        </span>
        {pago === 'parcial' && (
          <span className="mt-0.5 h-[5px] overflow-hidden rounded-full bg-superficie-suave">
            <span className="block h-full rounded-full bg-naranja-500" style={{ width: `${Math.round(progresoPago(p) * 100)}%` }} />
          </span>
        )}
      </span>
    </Link>
  );
}
