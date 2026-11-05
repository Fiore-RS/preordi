// Acciones sobre una preorden ya guardada (pantalla de Detalle) — especificación 5.5, 5.6, 5.7, 8.4, 8.6 y 8.7.
// Todas devuelven una copia nueva de la preorden; ninguna la modifica.

import type { Estado, FechaEstimada, Pago, Preorden, TipoMovimiento, TipoPago } from '../types';
import { costoTotal, saldoPendiente } from './calculos';
import { aplicarTransicion, esDeshacer, pagosAlApartar, validarPago } from './estados';
import { nuevoId } from './ids';

export const NOMBRE_ESTADO: Record<Estado, string> = {
  deseada: 'Deseo',
  apartada: 'Apartada',
  en_camino: 'En camino',
  recibida: 'Recibida',
  cancelada: 'Cancelada',
};

export const NOMBRE_MOVIMIENTO: Record<TipoMovimiento, string> = {
  deposito: 'Depósito',
  abono: 'Abono',
  saldo: 'Saldo',
  reembolso: 'Reembolso',
};

/** El siguiente paso natural (botón principal del Detalle), o null si no hay. */
export function accionPrincipal(p: Preorden): Estado | null {
  if (p.estado === 'deseada') return 'apartada';
  if (p.estado === 'apartada') return 'en_camino';
  if (p.estado === 'en_camino') return 'recibida';
  return null;
}

export function textoTransicion(de: Estado, a: Estado): string {
  if (a === 'apartada') return de === 'cancelada' ? 'Reactivar' : 'Apartar';
  if (a === 'en_camino') return de === 'recibida' ? 'Deshacer recibida' : 'Marcar en camino';
  if (a === 'recibida') return 'Marcar recibida';
  if (a === 'cancelada') return 'Cancelar preorden';
  return NOMBRE_ESTADO[a];
}

/** Explicación corta que acompaña a las transiciones que no son el camino normal. */
export function avisoTransicion(de: Estado, a: Estado): string | null {
  if (a === 'cancelada') return 'Los pagos se conservan. Si te devolvieron dinero, registralo como reembolso.';
  if (esDeshacer(de, a) && de === 'recibida') return 'Vuelve a quedar en camino y se borra la fecha de recepción.';
  if (esDeshacer(de, a) && de === 'cancelada') return 'Vuelve a quedar apartada y se borra la fecha de cancelación.';
  return null;
}

/**
 * Pago que conviene ofrecer al cambiar de estado (5.6):
 * - al pasar a "en camino" con pago al envío: el cobro del envío (todo el saldo)
 * - al pasar a "recibida" con saldo: el pago del saldo
 */
export function pagoSugeridoAlCambiar(p: Preorden, a: Estado): number {
  const saldo = saldoPendiente(p);
  if (saldo <= 0) return 0;
  if (a === 'en_camino' && p.estado === 'apartada' && p.tipoPago === 'al_envio') return saldo;
  if (a === 'recibida' && p.estado !== 'recibida') return saldo;
  return 0;
}

export function agregarPago(p: Preorden, pago: Omit<Pago, 'id'>, ahoraISO: string): Preorden {
  return { ...p, pagos: [...p.pagos, { id: nuevoId(), ...pago }], actualizadaEl: ahoraISO };
}

export function reemplazarPago(p: Preorden, id: string, datos: Omit<Pago, 'id'>, ahoraISO: string): Preorden {
  return { ...p, pagos: p.pagos.map((x) => (x.id === id ? { id, ...datos } : x)), actualizadaEl: ahoraISO };
}

export function quitarPago(p: Preorden, id: string, ahoraISO: string): Preorden {
  return { ...p, pagos: p.pagos.filter((x) => x.id !== id), actualizadaEl: ahoraISO };
}

/** Valida un pago nuevo o editado; al editar, se valida como si ese pago no existiera aún. */
export function validarPagoEnDetalle(
  p: Preorden,
  monto: number,
  tipo: TipoMovimiento,
  idEditado?: string,
): string | null {
  const base = idEditado ? { ...p, pagos: p.pagos.filter((x) => x.id !== idEditado) } : p;
  return validarPago(base, monto, tipo);
}

/** Pasa a otro estado; si viene `pago`, lo registra en la misma fecha (cobro del envío o pago del saldo). */
export function cambiarEstado(
  p: Preorden,
  a: Estado,
  fecha: string,
  ahoraISO: string,
  pago?: { monto: number; tipo: TipoMovimiento },
): Preorden {
  const siguiente = aplicarTransicion(p, a, fecha, ahoraISO);
  return pago ? agregarPago(siguiente, { ...pago, fecha }, ahoraISO) : siguiente;
}

/** De deseo a apartada (5.6): fija el tipo de pago y crea el pago inicial que corresponda. */
export function apartar(
  p: Preorden,
  tipoPago: TipoPago,
  fecha: string,
  ahoraISO: string,
  deposito?: number,
): Preorden {
  const pagos = pagosAlApartar(tipoPago, costoTotal(p), fecha, deposito);
  return { ...aplicarTransicion(p, 'apartada', fecha, ahoraISO), tipoPago, pagos: [...p.pagos, ...pagos] };
}

function mismaFecha(a: FechaEstimada | null, b: FechaEstimada | null): boolean {
  return a?.fecha === b?.fecha && a?.precision === b?.precision;
}

/** Cambia la fecha estimada. Si ya había una y cambia, queda en el historial (5.3). */
export function cambiarFechaEstimada(
  p: Preorden,
  nueva: FechaEstimada | null,
  hoy: string,
  ahoraISO: string,
  nota?: string,
): Preorden {
  if (mismaFecha(p.fechaEstimada, nueva)) return p;
  const historialFechas =
    p.fechaEstimada && nueva
      ? [
          ...p.historialFechas,
          { id: nuevoId(), registradoEl: hoy, anterior: p.fechaEstimada, nueva, ...(nota ? { nota } : {}) },
        ]
      : p.historialFechas;
  return { ...p, fechaEstimada: nueva, historialFechas, actualizadaEl: ahoraISO };
}
