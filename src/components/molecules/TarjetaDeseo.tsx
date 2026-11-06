import { Link } from 'react-router';
import { costoTotal } from '../../lib/calculos';
import { useImagen } from '../../lib/useImagen';
import type { Preorden } from '../../types';
import { Monto } from '../atoms/Monto';
import { PortadaSinFoto } from '../atoms/PortadaSinFoto';

/**
 * Tarjeta alta de la cuadrícula de Deseos (Vitrina, especificación 10.9): la foto de fondo,
 * la categoría arriba y el nombre con el precio sobre el degradado. Colores fijos en los dos modos.
 */
export function TarjetaDeseo({ preorden: p, categoria }: { preorden: Preorden; categoria?: string }) {
  const url = useImagen(p.imagenId);
  return (
    <Link
      to={`/preordenes/${p.id}`}
      className="relative flex aspect-[3/4] w-full overflow-hidden rounded-[20px] bg-marino-500"
    >
      {url ? (
        <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <PortadaSinFoto nombre={p.nombre} estado={p.estado} className="pt-6 text-[110px]" />
      )}
      {url && <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-marino-900/0 from-40% to-marino-900/90" />}
      {categoria && (
        <span className="absolute top-2.5 left-2.5 rounded-md bg-papel px-1.5 py-0.5 text-[11px] font-bold text-marino-500">
          {categoria}
        </span>
      )}
      <span className={`relative mt-auto flex w-full flex-col gap-1 p-3 ${url ? 'text-papel' : 'text-marino-500'}`}>
        <span className="line-clamp-2 font-display text-[15px] leading-[1.15] font-bold">{p.nombre}</span>
        <Monto monto={costoTotal(p)} className={`font-display text-xl leading-none font-extrabold ${url ? 'text-amarillo-500' : ''}`} />
      </span>
    </Link>
  );
}
