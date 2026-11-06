import type { ButtonHTMLAttributes } from 'react';

type Variante = 'principal' | 'secundario' | 'discreto';

const ESTILOS: Record<Variante, string> = {
  // Uno solo por pantalla (especificación 10.7). Naranja con texto marino desde la Vitrina (10.9).
  principal: 'bg-principal text-principal-texto hover:bg-principal-hover',
  secundario: 'border-[1.5px] border-tinta text-tinta hover:bg-superficie-suave',
  // Sin borde punteado desde la Vitrina (10.9): relleno suave.
  discreto: 'bg-superficie-suave text-tinta hover:bg-borde-suave',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  /** Botón grande de 50 px (acción principal) o pequeño de 40 px. */
  tamano?: 'grande' | 'chico';
}

export function Boton({ variante = 'secundario', tamano = 'grande', className = '', type = 'button', ...resto }: Props) {
  const medidas =
    tamano === 'grande'
      ? 'min-h-[52px] rounded-2xl px-5 text-[15px] font-bold whitespace-nowrap'
      : 'min-h-10 rounded-xl px-3.5 text-sm font-medium';
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 transition-colors ${medidas} ${ESTILOS[variante]} ${className}`}
      {...resto}
    />
  );
}
