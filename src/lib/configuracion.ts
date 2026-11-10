// Categorías y tiendas — especificación 8.9 y 5.7.

import type { Categoria, ID, Preorden } from '../types';

/** Valida el nombre de una categoría o tienda: obligatorio y sin repetir (sin importar mayúsculas ni tildes). */
export function validarNombre(
  nombre: string,
  existentes: { id: ID; nombre: string }[],
  idActual?: ID,
): string | null {
  const limpio = nombre.trim();
  if (!limpio) return 'Escribí un nombre.';
  const clave = (s: string) => s.trim().toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (existentes.some((e) => e.id !== idActual && clave(e.nombre) === clave(limpio))) return 'Ya existe uno con ese nombre.';
  return null;
}

/** Cuántas preórdenes (incluye deseos) usan cada categoría y cada tienda. */
export function contarUso(preordenes: Preorden[]): { categorias: Map<ID, number>; tiendas: Map<ID, number> } {
  const categorias = new Map<ID, number>();
  const tiendas = new Map<ID, number>();
  for (const p of preordenes) {
    categorias.set(p.categoriaId, (categorias.get(p.categoriaId) ?? 0) + 1);
    if (p.tiendaId) tiendas.set(p.tiendaId, (tiendas.get(p.tiendaId) ?? 0) + 1);
  }
  return { categorias, tiendas };
}

/** Sube o baja una categoría un lugar y renumera `orden` de 0 en adelante. */
export function moverCategoria(categorias: Categoria[], id: ID, direccion: -1 | 1): Categoria[] {
  const ordenadas = [...categorias].sort((a, b) => a.orden - b.orden);
  const i = ordenadas.findIndex((c) => c.id === id);
  const j = i + direccion;
  if (i === -1 || j < 0 || j >= ordenadas.length) return categorias;
  [ordenadas[i], ordenadas[j]] = [ordenadas[j], ordenadas[i]];
  return ordenadas.map((c, orden) => ({ ...c, orden }));
}

/** Saca el elemento de la posición `desde` y lo pone en `hacia` (arrastrar para ordenar). */
export function moverA<T>(lista: T[], desde: number, hacia: number): T[] {
  if (desde === hacia || desde < 0 || hacia < 0 || desde >= lista.length || hacia >= lista.length) return lista;
  const copia = [...lista];
  const [item] = copia.splice(desde, 1);
  copia.splice(hacia, 0, item);
  return copia;
}

/** Renumera `orden` de 0 en adelante según la posición en la lista. */
export function renumerar(categorias: Categoria[]): Categoria[] {
  return categorias.map((c, orden) => (c.orden === orden ? c : { ...c, orden }));
}

/** Pasa las preórdenes de una categoría a otra (paso previo a borrar una categoría en uso). */
export function reasignarCategoria(preordenes: Preorden[], de: ID, a: ID, ahoraISO: string): Preorden[] {
  return preordenes.map((p) => (p.categoriaId === de ? { ...p, categoriaId: a, actualizadaEl: ahoraISO } : p));
}

/** Pasa las preórdenes de una tienda a otra, o a ninguna. */
export function reasignarTienda(preordenes: Preorden[], de: ID, a: ID | null, ahoraISO: string): Preorden[] {
  return preordenes.map((p) => (p.tiendaId === de ? { ...p, tiendaId: a, actualizadaEl: ahoraISO } : p));
}
