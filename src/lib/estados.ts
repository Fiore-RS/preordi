// Transiciones de estado y flujos de pago — especificación 5.5, 5.6 y 5.7.

import type { Estado, Pago, Preorden, TipoMovimiento, TipoPago } from '../types';
import { costoTotal, saldoPendiente, totalPagado } from './calculos';
import { formatearMonto } from './dinero';
import { nuevoId } from './ids';

export const TRANSICIONES: Record<Estado, Estado[]> = {
  deseada: ['apartada'],
  apartada: ['en_camino', 'recibida', 'cancelada'],
  en_camino: ['recibida', 'cancelada'],
  recibida: ['en_camino'], // deshacer
  cancelada: ['apartada'], // reactivar
};

/** Transiciones que "deshacen": piden confirmación y limpian la fecha del estado que se abandona. */
const DESHACER: Partial<Record<Estado, Estado>> = {
  recibida: 'en_camino',
  cancelada: 'apartada',
};

type CampoFecha = 'fechaApartada' | 'fechaEnviada' | 'fechaRecibida' | 'fechaCancelada';

const CAMPO_FECHA: Partial<Record<Estado, CampoFecha>> = {
  apartada: 'fechaApartada',
  en_camino: 'fechaEnviada',
  recibida: 'fechaRecibida',
  cancelada: 'fechaCancelada',
};

export function puedeTransicionar(de: Estado, a: Estado): boolean {
  return TRANSICIONES[de].includes(a);
}

export function esDeshacer(de: Estado, a: Estado): boolean {
  return DESHACER[de] === a;
}

/** Devuelve una copia de la preorden en el nuevo estado, con su fecha fijada. */
export function aplicarTransicion(p: Preorden, a: Estado, fecha: string, ahoraISO: string): Preorden {
  if (!puedeTransicionar(p.estado, a)) {
    throw new Error(`No se puede pasar de "${p.estado}" a "${a}".`);
  }
  const siguiente: Preorden = { ...p, estado: a, actualizadaEl: ahoraISO };
  const campoNuevo = CAMPO_FECHA[a];
  if (campoNuevo) siguiente[campoNuevo] = fecha;
  if (esDeshacer(p.estado, a)) {
    const campoViejo = CAMPO_FECHA[p.estado];
    if (campoViejo) siguiente[campoViejo] = null;
  }
  return siguiente;
}

/**
 * Pagos que se crean al apartar (5.6).
 * - deposito: un pago 'deposito' por el monto indicado (> 0 y < costo total)
 * - completo: un pago 'saldo' por el costo total
 * - al_envio: ninguno
 */
export function pagosAlApartar(
  tipoPago: TipoPago,
  costo: number,
  fecha: string,
  deposito?: number,
): Pago[] {
  if (tipoPago === 'al_envio') return [];
  if (tipoPago === 'completo') return [{ id: nuevoId(), fecha, monto: costo, tipo: 'saldo' }];
  if (!deposito || deposito <= 0 || deposito >= costo) {
    throw new Error('El depósito debe ser mayor que ₡0 y menor que el costo total.');
  }
  return [{ id: nuevoId(), fecha, monto: deposito, tipo: 'deposito' }];
}

/** Valida un pago nuevo (5.7). Devuelve el mensaje de error, o null si es válido. */
export function validarPago(p: Preorden, monto: number, tipo: TipoMovimiento): string | null {
  if (!Number.isInteger(monto) || monto <= 0) return 'El monto debe ser un entero mayor que ₡0.';
  if (tipo === 'reembolso') {
    return monto > totalPagado(p) ? 'El reembolso no puede superar lo pagado.' : null;
  }
  const saldo = saldoPendiente(p);
  if (monto > saldo) {
    return `Supera el saldo por ${formatearMonto(monto - saldo)}. ¿Querés agregarlo como costo extra?`;
  }
  return null;
}

/** Aviso (no bloqueante) cuando lo pagado supera el costo total tras editar precio o extras. */
export function haySobrepago(p: Preorden): boolean {
  return totalPagado(p) > costoTotal(p);
}
