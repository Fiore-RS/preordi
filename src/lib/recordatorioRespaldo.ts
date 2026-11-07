// Recordatorio de respaldo — especificación 6.4.
// El .zip es lo único que recupera los datos si se cambia de teléfono o se borran los datos del navegador,
// así que Inicio avisa cuando pasa mucho tiempo sin hacer uno. Se guarda aparte de los datos
// (en su propia llave de localStorage) para que importar un respaldo no lo cambie.

import type { Preorden } from '../types';
import { aISO, desdeISO } from './fechas';
import { diasEntre } from './preventa';

/** Cada cuántos días conviene respaldar. */
export const DIAS_RESPALDO = 30;
/** Cuántos días se esconde el aviso al cerrarlo con la X. */
export const DIAS_POSPONER = 14;

const LLAVE_ULTIMO = 'preordi:ultimoRespaldo';
const LLAVE_POSPUESTO = 'preordi:avisoRespaldoHasta';

function leer(llave: string): string | null {
  try {
    return localStorage.getItem(llave);
  } catch {
    return null;
  }
}

function escribir(llave: string, valor: string): void {
  try {
    localStorage.setItem(llave, valor);
  } catch {
    // Sin localStorage no hay recordatorio; no es grave.
  }
}

export function ultimoRespaldo(): string | null {
  return leer(LLAVE_ULTIMO);
}

export function registrarRespaldo(hoy: string): void {
  escribir(LLAVE_ULTIMO, hoy);
}

export function avisoPospuestoHasta(): string | null {
  return leer(LLAVE_POSPUESTO);
}

/** La X del aviso: lo esconde DIAS_POSPONER días. */
export function posponerAviso(hoy: string): void {
  const d = desdeISO(hoy);
  escribir(LLAVE_POSPUESTO, aISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + DIAS_POSPONER)));
}

export interface EstadoRecordatorio {
  /** Días desde el último respaldo; null si nunca se ha hecho uno. */
  dias: number | null;
}

/**
 * Si hay que mostrar el aviso. Sin respaldos previos, se cuenta desde la preorden más antigua,
 * así no aparece apenas se instala la app. Devuelve null si no hay que avisar.
 */
export function revisarRespaldo(
  preordenes: Preorden[],
  hoy: string,
  ultimo: string | null,
  pospuestoHasta: string | null,
): EstadoRecordatorio | null {
  if (preordenes.length === 0) return null;
  if (pospuestoHasta && hoy < pospuestoHasta) return null;
  const masAntigua = preordenes.reduce((min, p) => (p.creadaEl < min ? p.creadaEl : min), preordenes[0].creadaEl).slice(0, 10);
  const desde = ultimo ?? masAntigua;
  const dias = diasEntre(desde, hoy);
  if (dias < DIAS_RESPALDO) return null;
  return { dias: ultimo ? dias : null };
}
