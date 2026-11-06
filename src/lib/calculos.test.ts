// Verifica el ejemplo de la sección 9 de la especificación.
import { describe, expect, it } from 'vitest';
import type { Preorden } from '../types';
import { costoTotal, estadoPago, saldoPendiente, totales, totalPagado, vencida } from './calculos';
import { aplicarTransicion, pagosAlApartar, validarPago } from './estados';
import { finDePeriodo, formatearFechaEstimada, normalizarFecha } from './fechas';
import { parsearMonto } from './dinero';

function figura(): Preorden {
  return {
    id: 'fig',
    nombre: 'Figura de ejemplo',
    categoriaId: 'cat',
    tiendaId: null,
    estado: 'apartada',
    tipoPago: 'deposito',
    precio: 45000,
    costosExtra: [],
    pagos: [{ id: 'p1', fecha: '2026-08-02', monto: 10000, tipo: 'deposito' }],
    fechaEstimada: { fecha: '2027-03-01', precision: 'mes' },
    historialFechas: [],
    fechaApartada: '2026-08-02',
    fechaEnviada: null,
    fechaRecibida: null,
    fechaCancelada: null,
    imagenId: null,
    creadaEl: '2026-08-02T12:00:00.000Z',
    actualizadaEl: '2026-08-02T12:00:00.000Z',
  };
}

describe('ejemplo de la sección 9', () => {
  it('sigue la tabla paso a paso', () => {
    const p = figura();
    expect([costoTotal(p), totalPagado(p), saldoPendiente(p), estadoPago(p)]).toEqual([45000, 10000, 35000, 'parcial']);

    p.costosExtra.push({ id: 'c1', concepto: 'Courier', monto: 6500 });
    expect([costoTotal(p), saldoPendiente(p)]).toEqual([51500, 41500]);

    p.pagos.push({ id: 'p2', fecha: '2026-10-20', monto: 15000, tipo: 'abono' });
    expect([totalPagado(p), saldoPendiente(p), estadoPago(p)]).toEqual([25000, 26500, 'parcial']);

    expect(validarPago(p, 26501, 'saldo')).toMatch(/Supera el saldo/);
    expect(validarPago(p, 26500, 'saldo')).toBeNull();
    p.pagos.push({ id: 'p3', fecha: '2027-03-20', monto: 26500, tipo: 'saldo' });
    expect([totalPagado(p), saldoPendiente(p), estadoPago(p)]).toEqual([51500, 0, 'completo']);
  });

  it('detecta la fecha vencida y la reprogramación', () => {
    const p = figura();
    expect(finDePeriodo(p.fechaEstimada!)).toBe('2027-03-31');
    expect(vencida(p, '2027-03-31')).toBe(false);
    expect(vencida(p, '2027-04-01')).toBe(true);

    p.fechaEstimada = { fecha: '2027-04-05', precision: 'semana' };
    expect(formatearFechaEstimada(p.fechaEstimada)).toBe('5–11 abr 2027');
    expect(vencida(p, '2027-04-11')).toBe(false);
    expect(vencida(p, '2027-04-12')).toBe(true);
  });

  it('semanas de lunes a domingo, también entre meses y años', () => {
    expect(normalizarFecha('2026-11-22', 'semana')).toBe('2026-11-16'); // domingo → su lunes
    expect(normalizarFecha('2026-11-16', 'semana')).toBe('2026-11-16');
    expect(finDePeriodo({ fecha: '2026-11-16', precision: 'semana' })).toBe('2026-11-22');
    expect(formatearFechaEstimada({ fecha: '2026-11-30', precision: 'semana' })).toBe('30 nov–6 dic 2026');
    expect(formatearFechaEstimada({ fecha: '2026-12-28', precision: 'semana' })).toBe('28 dic 2026–3 ene 2027');
  });

  it('caso Amazon: pago al envío', () => {
    expect(pagosAlApartar('al_envio', 24500, '2026-11-05')).toEqual([]);
    const p: Preorden = { ...figura(), tipoPago: 'al_envio', precio: 24500, pagos: [] };
    expect(estadoPago(p)).toBe('sin_pagar');
    const enCamino = aplicarTransicion(p, 'en_camino', '2026-11-08', '2026-11-08T00:00:00.000Z');
    expect(enCamino.fechaEnviada).toBe('2026-11-08');
  });
});

describe('totales y transiciones', () => {
  it('suma pendiente, comprometido y deseos', () => {
    const activa = figura();
    const deseo: Preorden = { ...figura(), id: 'd', estado: 'deseada', pagos: [], precio: 6500 };
    const t = totales([activa, deseo]);
    expect(t).toMatchObject({ totalPendiente: 35000, comprometido: 45000, yaPagado: 10000, siApartaraDeseos: 6500 });
  });

  it('deshacer limpia la fecha del estado que se abandona', () => {
    const recibida: Preorden = { ...figura(), estado: 'recibida', fechaRecibida: '2027-03-20' };
    const deshecha = aplicarTransicion(recibida, 'en_camino', '2027-03-21', '2027-03-21T00:00:00.000Z');
    expect(deshecha.fechaRecibida).toBeNull();
    expect(() => aplicarTransicion(figura(), 'deseada', '2027-01-01', '')).toThrow();
  });

  it('parsea montos escritos a mano', () => {
    expect(parsearMonto('45 000')).toBe(45000);
    expect(parsearMonto('₡45.000')).toBe(45000);
    expect(parsearMonto('0')).toBeNull();
    expect(parsearMonto('abc')).toBeNull();
  });
});
