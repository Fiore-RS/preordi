// Filtros y orden de la lista de Preórdenes — especificación 8.2.

import type { ID, Preorden } from '../types';
import { saldoPendiente } from './calculos';
import { compararFechasEstimadas } from './fechas';

/** Pestañas de estado. Los deseos viven en su propia pantalla y nunca aparecen acá. */
export type PestanaEstado = 'activas' | 'apartada' | 'en_camino' | 'todas';
export type Orden = 'fecha' | 'saldo' | 'nombre' | 'recientes';

export interface FiltrosListado {
  estado: PestanaEstado;
  categoriaId: ID | null;
  tiendaId: ID | null;
  orden: Orden;
}

export const FILTROS_POR_DEFECTO: FiltrosListado = {
  estado: 'activas',
  categoriaId: null,
  tiendaId: null,
  orden: 'fecha',
};

export const PESTANAS: { valor: PestanaEstado; texto: string }[] = [
  { valor: 'activas', texto: 'Activas' },
  { valor: 'apartada', texto: 'Apartadas' },
  { valor: 'en_camino', texto: 'En camino' },
  { valor: 'todas', texto: 'Todas' },
];

export const ORDENES: { valor: Orden; texto: string }[] = [
  { valor: 'fecha', texto: 'Fecha estimada' },
  { valor: 'saldo', texto: 'Saldo mayor' },
  { valor: 'nombre', texto: 'Nombre' },
  { valor: 'recientes', texto: 'Más recientes' },
];

function cumpleEstado(p: Preorden, estado: PestanaEstado): boolean {
  if (p.estado === 'deseada') return false;
  if (estado === 'activas') return p.estado === 'apartada' || p.estado === 'en_camino';
  if (estado === 'todas') return true;
  return p.estado === estado;
}

const porNombre = (a: Preorden, b: Preorden) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });

const COMPARADORES: Record<Orden, (a: Preorden, b: Preorden) => number> = {
  fecha: (a, b) => compararFechasEstimadas(a.fechaEstimada, b.fechaEstimada) || porNombre(a, b),
  saldo: (a, b) => saldoPendiente(b) - saldoPendiente(a) || porNombre(a, b),
  nombre: porNombre,
  recientes: (a, b) => b.creadaEl.localeCompare(a.creadaEl),
};

export function filtrarYOrdenar(preordenes: Preorden[], f: FiltrosListado): Preorden[] {
  return preordenes
    .filter(
      (p) =>
        cumpleEstado(p, f.estado) &&
        (!f.categoriaId || p.categoriaId === f.categoriaId) &&
        (!f.tiendaId || p.tiendaId === f.tiendaId),
    )
    .sort(COMPARADORES[f.orden]);
}

/** Lee los filtros de la URL (?estado=…&categoria=…&tienda=…&orden=…), con valores por defecto si faltan o no sirven. */
export function filtrosDesdeURL(params: URLSearchParams): FiltrosListado {
  const estado = params.get('estado');
  const orden = params.get('orden');
  return {
    estado: PESTANAS.some((x) => x.valor === estado) ? (estado as PestanaEstado) : FILTROS_POR_DEFECTO.estado,
    categoriaId: params.get('categoria') || null,
    tiendaId: params.get('tienda') || null,
    orden: ORDENES.some((x) => x.valor === orden) ? (orden as Orden) : FILTROS_POR_DEFECTO.orden,
  };
}

/** Lo inverso: solo escribe en la URL lo que no es el valor por defecto. */
export function filtrosAURL(f: FiltrosListado): URLSearchParams {
  const params = new URLSearchParams();
  if (f.estado !== FILTROS_POR_DEFECTO.estado) params.set('estado', f.estado);
  if (f.categoriaId) params.set('categoria', f.categoriaId);
  if (f.tiendaId) params.set('tienda', f.tiendaId);
  if (f.orden !== FILTROS_POR_DEFECTO.orden) params.set('orden', f.orden);
  return params;
}
