import { useLocation } from 'react-router';

/*
 * Movimiento al cambiar de pantalla, con la misma idea que en Teleo (lib/motion.ts):
 * animar solo lo que comunica algo, no cada visita.
 *
 * - Pestañas (Inicio, Preórdenes, Deseos, Historial): la entrada suave solo la primera vez
 *   que se abre cada una en la sesión. Al volver a una pestaña, aparece de una.
 * - Pantallas secundarias (detalle, nueva/editar preorden, configuración): entrar "más
 *   adentro" llega desde la derecha; volver hacia afuera llega un poco desde la izquierda.
 * - Cualquier otro cambio (por ejemplo, de una pantalla secundaria a otra del mismo nivel):
 *   sin animación.
 *
 * Todo vive en memoria: al cerrar y volver a abrir la app, la primera visita vuelve a animarse.
 */

export type ClaseTransicion = '' | 'animate-entrar' | 'animate-subpantalla-entra' | 'animate-subpantalla-vuelve';

/** Profundidad de cada pantalla. Las pestañas están en el nivel 0. */
export function nivelDe(ruta: string): number {
  if (ruta === '/config') return 1;
  if (/^\/preordenes\/[^/]+\/editar$/.test(ruta)) return 2;
  if (/^\/preordenes\/[^/]+$/.test(ruta)) return 1; // detalle y /preordenes/nueva
  return 0;
}

/** Decide la animación al pasar de `desde` (null en la primera pantalla) a `hacia`. */
export function transicionEntre(desde: string | null, hacia: string, yaVista: boolean): ClaseTransicion {
  if (desde === hacia) return '';
  const nivelHacia = nivelDe(hacia);
  if (desde !== null) {
    const nivelDesde = nivelDe(desde);
    if (nivelHacia > nivelDesde) return 'animate-subpantalla-entra';
    if (nivelHacia < nivelDesde) return 'animate-subpantalla-vuelve';
  }
  if (nivelHacia === 0 && !yaVista) return 'animate-entrar';
  return '';
}

const vistas = new Set<string>();
let rutaAnterior: string | null = null;
let ultimaClave: string | null = null;
let ultimaClase: ClaseTransicion = '';

/**
 * Clase de animación para la pantalla actual. Se calcula una sola vez por cada entrada del
 * historial (location.key), así los re-render (y el doble render de StrictMode) no la
 * cambian. Vive fuera de los componentes porque pasar de una pantalla con barra a una sin
 * barra vuelve a montar todo el layout.
 */
export function useTransicionPantalla(): ClaseTransicion {
  const { pathname, key } = useLocation();
  if (key !== ultimaClave) {
    ultimaClase = transicionEntre(rutaAnterior, pathname, vistas.has(pathname));
    ultimaClave = key;
    rutaAnterior = pathname;
    vistas.add(pathname);
  }
  return ultimaClase;
}
