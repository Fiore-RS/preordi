// Datos de texto en localStorage — especificación 6.1.

import type { Categoria, DatosPreordi } from '../types';
import { nuevoId } from './ids';

export const LLAVE_DATOS = 'preordi:datos';

export function categoriasPorDefecto(): Categoria[] {
  return [
    { nombre: 'Libro', emoji: '📚' },
    { nombre: 'Manga', emoji: '📖' },
    { nombre: 'Figura', emoji: '🧸' },
    { nombre: 'Merch', emoji: '🎀' },
    { nombre: 'Otro', emoji: '📦' },
  ].map((c, orden) => ({ id: nuevoId(), orden, ...c }));
}

/** Arranque limpio: sin preórdenes ni tiendas, solo las categorías por defecto. */
export function datosIniciales(): DatosPreordi {
  return { schemaVersion: 1, preordenes: [], categorias: categoriasPorDefecto(), tiendas: [] };
}

/** Lleva datos de versiones anteriores a la actual. Devuelve null si no se reconocen. */
export function migrar(crudo: unknown): DatosPreordi | null {
  if (!crudo || typeof crudo !== 'object') return null;
  const d = crudo as Partial<DatosPreordi>;
  if (d.schemaVersion !== 1) return null;
  if (!Array.isArray(d.preordenes) || !Array.isArray(d.categorias) || !Array.isArray(d.tiendas)) return null;
  return d as DatosPreordi;
}

export function cargarDatos(): DatosPreordi {
  try {
    const texto = localStorage.getItem(LLAVE_DATOS);
    if (!texto) return datosIniciales();
    return migrar(JSON.parse(texto)) ?? datosIniciales();
  } catch {
    return datosIniciales();
  }
}

export function guardarDatos(datos: DatosPreordi): void {
  try {
    localStorage.setItem(LLAVE_DATOS, JSON.stringify(datos));
  } catch (error) {
    console.error('No se pudieron guardar los datos', error);
  }
}

export function borrarDatos(): void {
  try {
    localStorage.removeItem(LLAVE_DATOS);
  } catch {
    // nada que hacer
  }
}
