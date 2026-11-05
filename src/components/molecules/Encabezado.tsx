import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icono } from '../atoms/Icono';

interface Props {
  titulo: ReactNode;
  /** Ruta para el botón de volver. Sin ella, se muestra el acceso a Configuración. */
  volverA?: string;
  /** "cerrar" (X) para formularios; "atras" (flecha) para el resto. */
  iconoVolver?: 'atras' | 'cerrar';
}

export function Encabezado({ titulo, volverA, iconoVolver = 'atras' }: Props) {
  if (volverA) {
    return (
      <header className="flex items-center gap-2 px-3 pt-4 pb-2">
        <Link
          to={volverA}
          aria-label={iconoVolver === 'cerrar' ? 'Cerrar' : 'Volver'}
          className="flex size-11 items-center justify-center rounded-full"
        >
          <Icono nombre={iconoVolver} tamano={22} grosor={2} />
        </Link>
        <h1 className="text-[22px] font-bold">{titulo}</h1>
      </header>
    );
  }
  return (
    <header className="flex items-center justify-between px-5 pt-6">
      <h1 className="text-[28px] font-bold tracking-tight">{titulo}</h1>
      <Link to="/config" aria-label="Configuración" className="flex size-11 items-center justify-center rounded-full">
        <Icono nombre="ajustes" tamano={22} />
      </Link>
    </header>
  );
}
