import type { Estado } from '../../types';

// Colores fijos de la bandera según el estado (no cambian en modo oscuro).
const FONDO: Partial<Record<Estado, string>> = {
  deseada: 'bg-amarillo-500 text-marino-500',
  apartada: 'bg-naranja-500 text-marino-500',
  en_camino: 'bg-celeste-500 text-marino-500',
  recibida: 'bg-amarillo-500 text-marino-500',
};

interface Props {
  nombre: string;
  estado: Estado;
  /** Tamaño de la inicial y espacio arriba (ej. "pt-9 text-[150px]"). */
  className?: string;
}

/** Portada de relleno para una preorden sin foto: el color del estado y la inicial grande (10.9). */
export function PortadaSinFoto({ nombre, estado, className = 'pt-9 text-[150px]' }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-0 flex items-start justify-center overflow-hidden ${FONDO[estado] ?? 'bg-marino-300 text-marino-500'} ${className}`}
    >
      <span className="font-display leading-none font-extrabold">{nombre.trim().charAt(0).toUpperCase()}</span>
    </span>
  );
}
