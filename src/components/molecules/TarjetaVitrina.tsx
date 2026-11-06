import { Link } from 'react-router';
import { saldoPendiente } from '../../lib/calculos';
import { NOMBRE_ESTADO } from '../../lib/acciones';
import { formatearFechaEstimada } from '../../lib/fechas';
import { useImagen } from '../../lib/useImagen';
import type { Preorden } from '../../types';
import { Icono } from '../atoms/Icono';
import { Monto } from '../atoms/Monto';
import { PortadaSinFoto } from '../atoms/PortadaSinFoto';

/**
 * Tarjeta alta con la foto de fondo para "Llegan pronto" (Vitrina, especificación 10.9).
 * Los colores son fijos (no cambian en modo oscuro): el texto siempre va sobre el degradado oscuro.
 */
export function TarjetaVitrina({ preorden: p }: { preorden: Preorden }) {
  const url = useImagen(p.imagenId);
  const saldo = saldoPendiente(p);
  const fecha = p.fechaEstimada ? formatearFechaEstimada(p.fechaEstimada) : 'Sin fecha';

  return (
    <Link
      to={`/preordenes/${p.id}`}
      className="relative flex h-[264px] w-[196px] shrink-0 snap-start overflow-hidden rounded-[22px] bg-marino-500"
    >
      {url ? (
        <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <PortadaSinFoto nombre={p.nombre} estado={p.estado} />
      )}
      {url && <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-marino-900/0 from-35% to-marino-900/90" />}

      <span className="absolute top-3 left-3 rounded-md bg-papel px-2 py-0.5 text-[11px] font-bold text-marino-500">
        {fecha}
      </span>

      <span className={`relative mt-auto flex w-full flex-col gap-1 p-3.5 pr-12 ${url ? 'text-papel' : 'text-marino-500'}`}>
        <span className="line-clamp-2 font-display text-[17px] leading-[1.15] font-bold">{p.nombre}</span>
        {saldo > 0 ? (
          <Monto monto={saldo} className={`font-display text-2xl leading-none font-extrabold ${url ? 'text-amarillo-500' : ''}`} />
        ) : (
          <span className={`font-display text-lg leading-none font-extrabold ${url ? 'text-amarillo-500' : ''}`}>Pagada</span>
        )}
        <span className={`mt-0.5 self-start rounded-[5px] px-1.5 py-0.5 text-[11px] ${url ? 'bg-papel/15' : 'bg-marino-500/15'}`}>
          {saldo > 0 ? 'saldo · ' : ''}
          {NOMBRE_ESTADO[p.estado].toLowerCase()}
        </span>
      </span>

      <span
        aria-hidden="true"
        className="absolute right-0 bottom-0 flex size-11 items-center justify-center rounded-tl-[18px] bg-naranja-500 text-marino-500"
      >
        <Icono nombre="adelante" tamano={20} grosor={2.4} />
      </span>
    </Link>
  );
}
