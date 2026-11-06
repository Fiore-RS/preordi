// Historial de preórdenes recibidas y canceladas — especificación 8.8.

import type { ID, Preorden } from '../types';
import { totalPagado } from './calculos';

export type PestanaHistorial = 'recibidas' | 'canceladas';

/** Fecha que ubica a una preorden en el historial: cuándo llegó o cuándo se canceló. */
export function fechaHistorial(p: Preorden): string | null {
  if (p.estado === 'recibida') return p.fechaRecibida;
  if (p.estado === 'cancelada') return p.fechaCancelada;
  return null;
}

function delHistorial(preordenes: Preorden[], pestana: PestanaHistorial): Preorden[] {
  const estado = pestana === 'recibidas' ? 'recibida' : 'cancelada';
  return preordenes.filter((p) => p.estado === estado && fechaHistorial(p));
}

/** Años con algo en esa pestaña, del más reciente al más viejo. */
export function aniosDisponibles(preordenes: Preorden[], pestana: PestanaHistorial): number[] {
  const anios = new Set(delHistorial(preordenes, pestana).map((p) => Number(fechaHistorial(p)!.slice(0, 4))));
  return [...anios].sort((a, b) => b - a);
}

export interface ResumenHistorial {
  items: Preorden[];
  /** Recibidas: lo gastado. Canceladas: lo pagado que no volvió. */
  total: number;
  /** Solo recibidas: lo gastado por categoría, de mayor a menor. */
  porCategoria: { categoriaId: ID; monto: number }[];
}

export function resumenHistorial(preordenes: Preorden[], pestana: PestanaHistorial, anio: number): ResumenHistorial {
  const items = delHistorial(preordenes, pestana)
    .filter((p) => fechaHistorial(p)!.startsWith(`${anio}-`))
    .sort((a, b) => fechaHistorial(b)!.localeCompare(fechaHistorial(a)!) || a.nombre.localeCompare(b.nombre, 'es'));

  const pagado = (p: Preorden) => Math.max(0, totalPagado(p));
  const total = items.reduce((suma, p) => suma + pagado(p), 0);

  const montos = new Map<ID, number>();
  if (pestana === 'recibidas') {
    for (const p of items) montos.set(p.categoriaId, (montos.get(p.categoriaId) ?? 0) + pagado(p));
  }
  const porCategoria = [...montos]
    .map(([categoriaId, monto]) => ({ categoriaId, monto }))
    .filter((c) => c.monto > 0)
    .sort((a, b) => b.monto - a.monto);

  return { items, total, porCategoria };
}
