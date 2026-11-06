// Imágenes en IndexedDB — especificación 6.2.
// Cada preorden tiene como máximo una imagen, guardada aparte de los datos (localStorage
// tiene un límite de ~5 MB y las fotos lo llenarían rápido).

import { clear, createStore, del, entries, get, keys, set, setMany, type UseStore } from 'idb-keyval';
import type { ID } from '../types';

export const LADO_MAXIMO = 800;
export const CALIDAD_WEBP = 0.8;
export const CALIDAD_JPEG = 0.85;

// Se abre la base recién cuando se usa (así las pruebas, que no tienen IndexedDB, pueden importar este archivo).
let almacen: UseStore | undefined;
const store = () => (almacen ??= createStore('preordi', 'imagenes'));

export function guardarImagen(id: ID, blob: Blob): Promise<void> {
  return set(id, blob, store());
}

export function obtenerImagen(id: ID): Promise<Blob | undefined> {
  return get<Blob>(id, store());
}

export function borrarImagen(id: ID): Promise<void> {
  return del(id, store());
}

/** Borra los blobs cuyo id no aparece en ninguna preorden. Devuelve cuántos borró. */
export async function limpiarHuerfanas(idsEnUso: Set<ID>): Promise<number> {
  const todas = (await keys(store())) as ID[];
  const huerfanas = todas.filter((id) => !idsEnUso.has(id));
  await Promise.all(huerfanas.map((id) => del(id, store())));
  return huerfanas.length;
}

/** Medidas finales: el lado mayor queda en `maximo` como mucho, sin agrandar imágenes chicas. */
export function medidasRedimension(ancho: number, alto: number, maximo = LADO_MAXIMO): { ancho: number; alto: number } {
  const escala = Math.min(1, maximo / Math.max(ancho, alto));
  return { ancho: Math.max(1, Math.round(ancho * escala)), alto: Math.max(1, Math.round(alto * escala)) };
}

const aBlob = (canvas: HTMLCanvasElement, tipo: string, calidad: number) =>
  new Promise<Blob | null>((listo) => canvas.toBlob(listo, tipo, calidad));

/**
 * Redimensiona al lado mayor LADO_MAXIMO y exporta a WebP (40–100 KB por foto).
 * Si el navegador no sabe codificar WebP (Safari), usa JPEG sobre fondo blanco.
 * `createImageBitmap` respeta la orientación EXIF de las fotos del teléfono.
 */
export async function comprimirImagen(archivo: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  const { ancho, alto } = medidasRedimension(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  const webp = await aBlob(canvas, 'image/webp', CALIDAD_WEBP);
  if (webp?.type === 'image/webp') return webp;

  // JPEG no tiene transparencia: se pinta blanco debajo de lo que ya está dibujado.
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, ancho, alto);
  const jpeg = await aBlob(canvas, 'image/jpeg', CALIDAD_JPEG);
  if (!jpeg) throw new Error('No se pudo procesar la imagen.');
  return jpeg;
}

/** Todas las imágenes guardadas, para el respaldo. */
export async function todasLasImagenes(): Promise<Map<ID, Blob>> {
  const lista = await entries<ID, Blob>(store());
  return new Map(lista);
}

/** Guarda varias imágenes de una vez (al importar un respaldo). */
export function guardarVarias(imagenes: Map<ID, Blob>): Promise<void> {
  return setMany([...imagenes], store());
}

/** Vacía el almacén de imágenes (al reiniciar todo). */
export function borrarTodasLasImagenes(): Promise<void> {
  return clear(store());
}
