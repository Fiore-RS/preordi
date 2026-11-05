// Imágenes en IndexedDB — especificación 6.2.
// Fase 6: compresión a WebP (lado mayor 800 px) y limpieza de huérfanas.

import { createStore, del, get, keys, set } from 'idb-keyval';
import type { ID } from '../types';

const almacen = createStore('preordi', 'imagenes');

export const LADO_MAXIMO = 800;
export const CALIDAD_WEBP = 0.8;
export const CALIDAD_JPEG = 0.85;

export function guardarImagen(id: ID, blob: Blob): Promise<void> {
  return set(id, blob, almacen);
}

export function obtenerImagen(id: ID): Promise<Blob | undefined> {
  return get<Blob>(id, almacen);
}

export function borrarImagen(id: ID): Promise<void> {
  return del(id, almacen);
}

/** Borra los blobs cuyo id no aparece en ninguna preorden. */
export async function limpiarHuerfanas(idsEnUso: Set<ID>): Promise<void> {
  const todas = (await keys(almacen)) as ID[];
  await Promise.all(todas.filter((id) => !idsEnUso.has(id)).map((id) => del(id, almacen)));
}

/**
 * Redimensiona al lado mayor LADO_MAXIMO y exporta a WebP (o JPEG si no hay soporte).
 * TODO (fase 6): implementar con <canvas> / createImageBitmap.
 */
export async function comprimirImagen(archivo: File): Promise<Blob> {
  console.warn('comprimirImagen aún no comprime; se guarda el archivo original.');
  return archivo;
}
