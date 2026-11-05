import type { ButtonHTMLAttributes } from 'react';

type Variante = 'principal' | 'secundario' | 'discreto';

const ESTILOS: Record<Variante, string> = {
  // Uno solo por pantalla (especificación 10.7).
  principal: 'bg-marino-500 text-papel hover:bg-marino-700',
  secundario: 'border-[1.5px] border-marino-500 text-marino-500 hover:bg-marino-50',
  discreto: 'border border-dashed border-marino-300 text-marino-500 hover:bg-marino-50',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  /** Botón grande de 50 px (acción principal) o pequeño de 40 px. */
  tamano?: 'grande' | 'chico';
}

export function Boton({ variante = 'secundario', tamano = 'grande', className = '', type = 'button', ...resto }: Props) {
  const medidas = tamano === 'grande' ? 'min-h-[50px] px-5 text-[15px] font-bold whitespace-nowrap' : 'min-h-10 px-3.5 text-sm font-medium';
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full transition-colors ${medidas} ${ESTILOS[variante]} ${className}`}
      {...resto}
    />
  );
}
