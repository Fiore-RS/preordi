import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Icono } from '../atoms/Icono';

interface Props {
  /** Puede faltar solo con textoVolver, cuando la pantalla muestra su propio título más abajo. */
  titulo?: ReactNode;
  /** Adónde volver si no hay pantalla anterior. Sin ella, se muestra el acceso a Configuración. */
  volverA?: string;
  /** "cerrar" (X) para formularios; "atras" (flecha) para el resto. */
  iconoVolver?: 'atras' | 'cerrar';
  /**
   * Texto junto a la flecha con el nombre de adónde se vuelve (ej. "Inicio").
   * Con él, el título queda solo para lectores de pantalla.
   */
  textoVolver?: string;
}

export function Encabezado({ titulo, volverA, iconoVolver = 'atras', textoVolver }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  if (volverA) {
    // Vuelve a la pantalla anterior (con sus filtros); si se abrió directo, a `volverA`.
    const volver = () => (location.key !== 'default' ? navigate(-1) : navigate(volverA));
    if (textoVolver) {
      return (
        <header className="flex items-center px-3 pt-4 pb-2">
          <button
            type="button"
            onClick={volver}
            className="flex min-h-11 items-center gap-1 rounded-full pr-3 pl-1.5 text-[17px] font-bold"
          >
            <Icono nombre={iconoVolver} tamano={22} grosor={2} />
            {textoVolver}
          </button>
          {titulo && <h1 className="sr-only">{titulo}</h1>}
        </header>
      );
    }
    return (
      <header className="flex items-center gap-2 px-3 pt-4 pb-2">
        <button
          type="button"
          onClick={volver}
          aria-label={iconoVolver === 'cerrar' ? 'Cerrar' : 'Volver'}
          className="flex size-11 items-center justify-center rounded-full"
        >
          <Icono nombre={iconoVolver} tamano={22} grosor={2} />
        </button>
        <h1 className="text-[22px] font-extrabold tracking-tight">{titulo}</h1>
      </header>
    );
  }
  return (
    <header className="flex items-center justify-between px-5 pt-6">
      <h1 className="text-[30px] font-extrabold tracking-tight">{titulo}</h1>
      <Link to="/config" aria-label="Configuración" className="-mr-2 flex size-11 items-center justify-center rounded-full">
        <Icono nombre="ajustes" tamano={22} />
      </Link>
    </header>
  );
}
