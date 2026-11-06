import { describe, expect, it } from 'vitest';
import type { Preorden } from '../types';
import {
  accionPrincipal,
  agregarPago,
  apartar,
  cambiarEstado,
  cambiarFechaEstimada,
  pagoSugeridoAlCambiar,
  quitarPago,
  reemplazarPago,
  validarPagoEnDetalle,
} from './acciones';
import { estadoPago, saldoPendiente, totalPagado } from './calculos';

const AHORA = '2026-11-05T18:00:00.000Z';

function preorden(cambios: Partial<Preorden> = {}): Preorden {
  return {
    id: 'p',
    nombre: 'Figura',
    categoriaId: 'c',
    tiendaId: null,
    estado: 'apartada',
    tipoPago: 'deposito',
    precio: 45000,
    costosExtra: [{ id: 'x', concepto: 'Courier', monto: 6500 }],
    pagos: [
      { id: 'd', fecha: '2026-08-02', monto: 10000, tipo: 'deposito' },
      { id: 'a', fecha: '2026-10-20', monto: 15000, tipo: 'abono' },
    ],
    fechaEstimada: { fecha: '2027-03-01', precision: 'mes' },
    historialFechas: [],
    fechaApartada: '2026-08-02',
    fechaEnviada: null,
    fechaRecibida: null,
    fechaCancelada: null,
    imagenId: null,
    creadaEl: AHORA,
    actualizadaEl: AHORA,
    ...cambios,
  };
}

describe('acción principal y pago sugerido', () => {
  it('sigue el camino normal', () => {
    expect(accionPrincipal(preorden({ estado: 'deseada' }))).toBe('apartada');
    expect(accionPrincipal(preorden())).toBe('en_camino');
    expect(accionPrincipal(preorden({ estado: 'en_camino' }))).toBe('recibida');
    expect(accionPrincipal(preorden({ estado: 'recibida' }))).toBeNull();
  });

  it('ofrece el saldo al recibir y el cobro al despachar si es pago al envío', () => {
    expect(pagoSugeridoAlCambiar(preorden(), 'recibida')).toBe(26500);
    expect(pagoSugeridoAlCambiar(preorden(), 'en_camino')).toBe(0);
    const amazon = preorden({ tipoPago: 'al_envio', pagos: [], costosExtra: [], precio: 24500 });
    expect(pagoSugeridoAlCambiar(amazon, 'en_camino')).toBe(24500);
  });

  it('marcar recibida con el pago del saldo deja todo pagado', () => {
    const r = cambiarEstado(preorden(), 'recibida', '2027-03-20', AHORA, { monto: 26500, tipo: 'saldo' });
    expect([r.estado, r.fechaRecibida, saldoPendiente(r), estadoPago(r)]).toEqual(['recibida', '2027-03-20', 0, 'completo']);
    expect(r.pagos.at(-1)).toMatchObject({ fecha: '2027-03-20', monto: 26500, tipo: 'saldo' });
  });
});

describe('apartar un deseo', () => {
  const deseo = preorden({ estado: 'deseada', pagos: [], fechaApartada: null });

  it('con depósito', () => {
    const r = apartar(deseo, 'deposito', '2026-11-05', AHORA, 5000);
    expect([r.estado, r.tipoPago, r.fechaApartada, totalPagado(r)]).toEqual(['apartada', 'deposito', '2026-11-05', 5000]);
  });

  it('con pago completo y al envío', () => {
    expect(totalPagado(apartar(deseo, 'completo', '2026-11-05', AHORA))).toBe(51500);
    expect(apartar(deseo, 'al_envio', '2026-11-05', AHORA).pagos).toEqual([]);
  });

  it('rechaza un depósito inválido', () => {
    expect(() => apartar(deseo, 'deposito', '2026-11-05', AHORA, 51500)).toThrow();
  });
});

describe('pagos en el detalle', () => {
  it('agrega, edita y quita', () => {
    const p = agregarPago(preorden(), { fecha: '2026-12-01', monto: 1000, tipo: 'abono' }, AHORA);
    expect(totalPagado(p)).toBe(26000);
    const nuevo = p.pagos.at(-1)!;
    const editado = reemplazarPago(p, nuevo.id, { fecha: '2026-12-01', monto: 2000, tipo: 'abono' }, AHORA);
    expect(totalPagado(editado)).toBe(27000);
    expect(totalPagado(quitarPago(editado, nuevo.id, AHORA))).toBe(25000);
  });

  it('al editar, valida contra el saldo sin contar ese pago', () => {
    const p = preorden();
    expect(validarPagoEnDetalle(p, 26500 + 15000, 'abono', 'a')).toBeNull();
    expect(validarPagoEnDetalle(p, 26500 + 15001, 'abono', 'a')).toMatch(/Supera el saldo/);
  });
});

describe('cambiar la fecha estimada', () => {
  it('registra la reprogramación con nota', () => {
    const r = cambiarFechaEstimada(preorden(), { fecha: '2027-04-05', precision: 'semana' }, '2026-11-05', AHORA, 'Aviso de la tienda');
    expect(r.historialFechas).toEqual([
      expect.objectContaining({
        registradoEl: '2026-11-05',
        anterior: { fecha: '2027-03-01', precision: 'mes' },
        nueva: { fecha: '2027-04-05', precision: 'semana' },
        nota: 'Aviso de la tienda',
      }),
    ]);
  });

  it('la primera fecha y quitar la fecha no cuentan como reprogramación', () => {
    const sinFecha = preorden({ fechaEstimada: null });
    expect(cambiarFechaEstimada(sinFecha, { fecha: '2027-03-01', precision: 'mes' }, '2026-11-05', AHORA).historialFechas).toEqual([]);
    expect(cambiarFechaEstimada(preorden(), null, '2026-11-05', AHORA).historialFechas).toEqual([]);
  });

  it('la misma fecha no cambia nada', () => {
    const p = preorden();
    expect(cambiarFechaEstimada(p, { fecha: '2027-03-01', precision: 'mes' }, '2026-11-05', AHORA)).toBe(p);
  });
});
