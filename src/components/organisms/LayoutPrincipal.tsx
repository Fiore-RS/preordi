import { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useTransicionPantalla } from '../../lib/movimiento';
import { BarraInferior } from './BarraInferior';
import { MarcoApp } from './MarcoApp';

/**
 * Contenedor con scroll de la tarjeta. Cada pantalla nueva arranca desde arriba,
 * en vez de heredar el scroll de la anterior (el contenedor es el mismo entre rutas).
 * La `key` por ruta vuelve a montar la pantalla en cada navegación; la animación la decide
 * useTransicionPantalla (lib/movimiento.ts), como en Teleo: las pestañas solo se animan la
 * primera vez y las pantallas secundarias entran y salen desde el costado.
 * overflow-x-hidden: mientras una pantalla entra desde el costado no aparece scroll horizontal.
 */
function Pantalla({ className }: { className: string }) {
  const { pathname } = useLocation();
  const contenedor = useRef<HTMLDivElement>(null);
  const transicion = useTransicionPantalla();

  useLayoutEffect(() => {
    contenedor.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div ref={contenedor} className={`no-scrollbar flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto ${className}`}>
      <div key={pathname} className={`flex flex-1 flex-col ${transicion}`}>
        <Outlet />
      </div>
    </div>
  );
}

/** Pantallas con barra inferior: Inicio, Preórdenes, Deseos e Historial. */
export function LayoutConBarra() {
  return (
    <MarcoApp>
      <Pantalla className="pb-6" />
      <BarraInferior />
    </MarcoApp>
  );
}

/** Pantallas sin barra inferior: detalle, nueva/editar preorden y configuración. */
export function LayoutSinBarra() {
  return (
    <MarcoApp>
      <Pantalla className="" />
    </MarcoApp>
  );
}
