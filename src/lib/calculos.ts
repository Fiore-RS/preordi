// Cálculos de dinero, atrasos y totales — especificación 5.1, 5.2 y 5.4.

import type { EstadoPago, Preorden } from '../types';
import { compararFechasEstimadas, finDePeriodo } from './fechas';

export function costoTotal(p: Preorden): number {
  return p.precio + p.costosExtra.reduce((suma, c) => suma + c.monto, 0);
}

export function totalPagado(p: Preorden): number {
  return p.pagos.reduce((suma, pago) => suma + (pago.tipo === 'reembolso' ? -pago.monto : pago.monto), 0);
}

export function saldoPendiente(p: Preorden): number {
  return Math.max(0, costoTotal(p) - totalPagado(p));
}

export function estadoPago(p: Preorden): EstadoPago {
  if (totalPagado(p) <= 0) return 'sin_pagar';
  if (saldoPendiente(p) === 0) return 'completo';
  return 'parcial';
}

/** Entre 0 y 1, para la barra de progreso. */
export function progresoPago(p: Preorden): number {
  const total = costoTotal(p);
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, totalPagado(p) / total));
}

const ACTIVAS = new Set(['apartada', 'en_camino']);

export function esActiva(p: Preorden): boolean {
  return ACTIVAS.has(p.estado);
}

/** La fecha estimada ya pasó y todavía no ha llegado. */
export function vencida(p: Preorden, hoy: string): boolean {
  return esActiva(p) && p.fechaEstimada !== null && finDePeriodo(p.fechaEstimada) < hoy;
}

export function reprogramaciones(p: Preorden): number {
  return p.historialFechas.length;
}

/** Recibida pero con saldo pendiente: se muestra con alerta. */
export function recibidaConSaldo(p: Preorden): boolean {
  return p.estado === 'recibida' && saldoPendiente(p) > 0;
}

export interface Totales {
  totalPendiente: number;
  comprometido: number;
  yaPagado: number;
  siApartaraDeseos: number;
  perdidoEnCanceladas: number;
}

export function totales(preordenes: Preorden[]): Totales {
  const t: Totales = {
    totalPendiente: 0,
    comprometido: 0,
    yaPagado: 0,
    siApartaraDeseos: 0,
    perdidoEnCanceladas: 0,
  };
  for (const p of preordenes) {
    if (esActiva(p) || p.estado === 'recibida') t.totalPendiente += saldoPendiente(p);
    if (esActiva(p)) {
      t.comprometido += costoTotal(p);
      t.yaPagado += totalPagado(p);
    }
    if (p.estado === 'deseada') t.siApartaraDeseos += costoTotal(p);
    if (p.estado === 'cancelada') t.perdidoEnCanceladas += Math.max(0, totalPagado(p));
  }
  return t;
}

/** Lo pagado por preórdenes recibidas en ese año. */
export function gastadoEnAnio(preordenes: Preorden[], anio: number): number {
  const prefijo = `${anio}-`;
  return preordenes
    .filter((p) => p.estado === 'recibida' && p.fechaRecibida?.startsWith(prefijo))
    .reduce((suma, p) => suma + totalPagado(p), 0);
}

/** Activas ordenadas por fecha estimada (sin fecha al final). */
export function proximasLlegadas(preordenes: Preorden[], cantidad = 5): Preorden[] {
  return preordenes
    .filter(esActiva)
    .sort((a, b) => compararFechasEstimadas(a.fechaEstimada, b.fechaEstimada))
    .slice(0, cantidad);
}
