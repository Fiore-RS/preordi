import { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router';
import { useTransicionPantalla } from '../../lib/movimiento';
import { BarraInferior } from './BarraInferior';
import { MarcoApp } from './MarcoApp';

/**
 * Dónde quedó el scroll de cada entrada del historial (location.key). Vive fuera del componente
 * porque pasar de una pantalla con barra a una sin barra vuelve a montar el contenedor.
 * Solo en memoria: al cerrar la app se olvida.
 */
const posiciones = new Map<string, number>();

/**
 * Contenedor con scroll de la tarjeta (el mismo entre rutas del mismo layout).
 * - Al entrar a una pantalla nueva arranca desde arriba.
 * - Al volver (atrás de la app o del teléfono, navegación POP) recupera dónde se había quedado.
 * - Cambiar filtros en la misma pantalla no mueve el scroll.
 * La `key` por ruta vuelve a montar la pantalla en cada navegación; la animación la decide
 * useTransicionPantalla (lib/movimiento.ts), como en Teleo: las pestañas solo se animan la
 * primera vez y las pantallas secundarias entran y salen desde el costado.
 * overflow-x-hidden: mientras una pantalla entra desde el costado no aparece scroll horizontal.
 */
function Pantalla({ className }: { className: string }) {
  const { pathname, key } = useLocation();
  const tipoNavegacion = useNavigationType();
  const contenedor = useRef<HTMLDivElement>(null);
  const claveActual = useRef(key);
  const rutaPrevia = useRef<string | null>(null);
  const transicion = useTransicionPantalla();

  useLayoutEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    claveActual.current = key;
    const cambioDePantalla = rutaPrevia.current !== pathname;
    rutaPrevia.current = pathname;

    const guardada = tipoNavegacion === 'POP' ? posiciones.get(key) : undefined;
    if (guardada === undefined) {
      if (cambioDePantalla) el.scrollTo({ top: 0 });
      return;
    }

    el.scrollTop = guardada;
    // Si la pantalla todavía no alcanza esa altura (algo que termina de cargar), reintenta
    // unos cuadros. Se detiene apenas llega, o si la persona toca la pantalla.
    let raf = 0;
    let intentos = 0;
    const detener = () => cancelAnimationFrame(raf);
    const reintentar = () => {
      if (el.scrollHeight - el.clientHeight >= guardada || ++intentos > 30) {
        el.scrollTop = guardada;
        return;
      }
      el.scrollTop = guardada;
      raf = requestAnimationFrame(reintentar);
    };
    if (el.scrollTop < guardada - 1) raf = requestAnimationFrame(reintentar);
    el.addEventListener('touchstart', detener, { once: true, passive: true });
    el.addEventListener('wheel', detener, { once: true, passive: true });
    return () => {
      detener();
      el.removeEventListener('touchstart', detener);
      el.removeEventListener('wheel', detener);
    };
  }, [key, pathname, tipoNavegacion]);

  return (
    <div
      ref={contenedor}
      onScroll={(e) => posiciones.set(claveActual.current, e.currentTarget.scrollTop)}
      className={`no-scrollbar flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto ${className}`}
    >
      <div key={pathname} className={`flex flex-1 flex-col ${transicion}`}>
        <Outlet />
      </div>
    </div>
  );
}

/** Espacio al final de las pantallas con barra, para que lo último no quede debajo de la barra. */
const ESPACIO_BARRA = 'pb-[calc(6.5rem+env(safe-area-inset-bottom))]';

/** Pantallas con barra inferior: Inicio, Preórdenes, Deseos e Historial. */
export function LayoutConBarra() {
  return (
    <MarcoApp>
      <Pantalla className={ESPACIO_BARRA} />
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
