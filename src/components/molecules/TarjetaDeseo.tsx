import { Link } from 'react-router';
import { costoTotal } from '../../lib/calculos';
import type { InfoPreventa } from '../../lib/preventa';
import { useImagen } from '../../lib/useImagen';
import type { Preorden } from '../../types';
import { Monto } from '../atoms/Monto';
import { PortadaSinFoto } from '../atoms/PortadaSinFoto';

// Etiqueta de preventa sobre la foto (5.9). Colores fijos, como el resto de la tarjeta.
function claseEtiqueta(info: InfoPreventa): string {
  if (info.fase === 'cerrada') return 'bg-marino-700 text-papel';
  if (info.urgencia === 'hoy') return 'bg-naranja-500 text-marino-900';
  if (info.urgencia === 'urgente') return 'bg-naranja-300 text-marino-900';
  if (info.urgencia === 'aviso') return 'bg-amarillo-500 text-marino-900';
  return 'bg-papel/90 text-marino-500';
}

interface Props {
  preorden: Preorden;
  categoria?: string;
  info?: InfoPreventa;
  /** Texto corto de la preventa ("Cierra en 3 días", "Cerrada"…). */
  etiqueta?: string | null;
}

/**
 * Tarjeta alta de la cuadrícula de Deseos (Vitrina, especificación 10.9): la foto de fondo,
 * la categoría arriba y el nombre con el precio sobre el degradado. Colores fijos en los dos modos.
 * Si la preventa ya cerró, la tarjeta queda en escala de grises.
 */
export function TarjetaDeseo({ preorden: p, categoria, info, etiqueta }: Props) {
  const url = useImagen(p.imagenId);
  const cerrada = info?.fase === 'cerrada';
  return (
    <Link
      to={`/preordenes/${p.id}`}
      className={`relative flex aspect-[3/4] w-full overflow-hidden rounded-[20px] bg-marino-500 ${cerrada ? 'grayscale' : ''}`}
    >
      {url ? (
        <img src={url} alt="" className={`absolute inset-0 size-full object-cover ${cerrada ? 'opacity-75' : ''}`} />
      ) : (
        <PortadaSinFoto nombre={p.nombre} estado={p.estado} className="pt-6 text-[110px]" />
      )}
      {url && <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-marino-900/0 from-40% to-marino-900/90" />}
      <span className="absolute inset-x-2.5 top-2.5 flex flex-wrap items-start justify-between gap-1">
        {categoria && (
          <span className="rounded-md bg-papel px-1.5 py-0.5 text-[11px] font-bold text-marino-500">{categoria}</span>
        )}
        {etiqueta && info && (
          <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[11px] font-bold ${claseEtiqueta(info)}`}>{etiqueta}</span>
        )}
      </span>
      <span className={`relative mt-auto flex w-full flex-col gap-1 p-3 ${url ? 'text-papel' : 'text-marino-500'}`}>
        <span className="line-clamp-2 font-display text-[15px] leading-[1.15] font-bold">{p.nombre}</span>
        <Monto monto={costoTotal(p)} className={`font-display text-xl leading-none font-extrabold ${url && !cerrada ? 'text-amarillo-500' : ''}`} />
      </span>
    </Link>
  );
}
