import { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BarraInferior } from './BarraInferior';
import { MarcoApp } from './MarcoApp';

/**
 * Contenedor con scroll de la tarjeta. Cada pantalla nueva arranca desde arriba,
 * en vez de heredar el scroll de la anterior (el contenedor es el mismo entre rutas).
 * Envuelve cada pantalla con una animación corta de entrada, como en Sobres:
 * la `key` por ruta hace que React la vuelva a montar (y a animar) en cada navegación.
 */
function Pantalla({ className }: { className: string }) {
  const { pathname } = useLocation();
  const contenedor = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    contenedor.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div ref={contenedor} className={`no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto ${className}`}>
      <div key={pathname} className="flex flex-1 flex-col animate-[entrar_200ms_ease-out]">
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
