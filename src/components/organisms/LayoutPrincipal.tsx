import { Outlet, useLocation } from 'react-router';
import { BarraInferior } from './BarraInferior';
import { MarcoApp } from './MarcoApp';

/**
 * Envuelve cada pantalla con una animación corta de entrada, como en Sobres.
 * La `key` por ruta hace que React la vuelva a montar (y a animar) en cada navegación.
 */
function PantallaAnimada() {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="flex flex-1 flex-col animate-[entrar_200ms_ease-out]">
      <Outlet />
    </div>
  );
}

/** Pantallas con barra inferior: Inicio, Preórdenes, Deseos e Historial. */
export function LayoutConBarra() {
  return (
    <MarcoApp>
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pb-6">
        <PantallaAnimada />
      </div>
      <BarraInferior />
    </MarcoApp>
  );
}

/** Pantallas sin barra inferior: detalle, nueva/editar preorden y configuración. */
export function LayoutSinBarra() {
  return (
    <MarcoApp>
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
        <PantallaAnimada />
      </div>
    </MarcoApp>
  );
}
