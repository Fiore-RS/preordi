// Resumen de la pantalla de Inicio — especificación 8.1.

import type { Preorden } from '../types';
import { esActiva, recibidaConSaldo, vencida } from './calculos';
import { compararFechasEstimadas } from './fechas';

export interface ResumenInicio {
  apartadas: number;
  enCamino: number;
  deseos: number;
  /** Activas cuya fecha estimada ya pasó (las más atrasadas primero). */
  vencidas: Preorden[];
  recibidasConSaldo: Preorden[];
  /** Próximas llegadas: activas que no están vencidas, por fecha (sin fecha al final). */
  proximas: Preorden[];
}

export function resumenInicio(preordenes: Preorden[], hoy: string, cantidadProximas = 5): ResumenInicio {
  const porFecha = (a: Preorden, b: Preorden) => compararFechasEstimadas(a.fechaEstimada, b.fechaEstimada);
  const activas = preordenes.filter(esActiva).sort(porFecha);
  return {
    apartadas: preordenes.filter((p) => p.estado === 'apartada').length,
    enCamino: preordenes.filter((p) => p.estado === 'en_camino').length,
    deseos: preordenes.filter((p) => p.estado === 'deseada').length,
    vencidas: activas.filter((p) => vencida(p, hoy)),
    recibidasConSaldo: preordenes.filter(recibidaConSaldo),
    proximas: activas.filter((p) => !vencida(p, hoy)).slice(0, cantidadProximas),
  };
}
