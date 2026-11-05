// Fechas locales 'YYYY-MM-DD' y fechas estimadas con precisión — especificación 5.3.

import type { FechaEstimada, Precision } from '../types';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

const dos = (n: number) => String(n).padStart(2, '0');

/** Date local → 'YYYY-MM-DD' */
export function aISO(fecha: Date): string {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** 'YYYY-MM-DD' → Date local (medianoche, sin corrimiento de zona horaria) */
export function desdeISO(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export function hoy(): string {
  return aISO(new Date());
}

/** Lleva una fecha al inicio de su periodo según la precisión. */
export function normalizarFecha(iso: string, precision: Precision): string {
  const d = desdeISO(iso);
  if (precision === 'mes') return aISO(new Date(d.getFullYear(), d.getMonth(), 1));
  if (precision === 'trimestre') {
    const inicioTrimestre = Math.floor(d.getMonth() / 3) * 3;
    return aISO(new Date(d.getFullYear(), inicioTrimestre, 1));
  }
  return iso;
}

/** Último día del periodo: se usa para ordenar y para detectar atrasos. */
export function finDePeriodo(fe: FechaEstimada): string {
  const d = desdeISO(fe.fecha);
  if (fe.precision === 'mes') return aISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  if (fe.precision === 'trimestre') {
    const ultimoMes = Math.floor(d.getMonth() / 3) * 3 + 2;
    return aISO(new Date(d.getFullYear(), ultimoMes + 1, 0));
  }
  return fe.fecha;
}

/** '2027-03-14' → "14 mar 2027" */
export function formatearFecha(iso: string): string {
  const d = desdeISO(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/** "14 mar 2027" · "mar 2027" · "T1 2027" · "Sin fecha" */
export function formatearFechaEstimada(fe: FechaEstimada | null): string {
  if (!fe) return 'Sin fecha';
  const d = desdeISO(fe.fecha);
  if (fe.precision === 'mes') return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
  if (fe.precision === 'trimestre') return `T${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
  return formatearFecha(fe.fecha);
}

/** Para ordenar por fecha estimada: la más cercana primero, sin fecha al final. */
export function compararFechasEstimadas(a: FechaEstimada | null, b: FechaEstimada | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return finDePeriodo(a).localeCompare(finDePeriodo(b));
}
