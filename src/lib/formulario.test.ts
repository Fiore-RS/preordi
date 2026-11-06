import { describe, expect, it } from 'vitest';
import { costoTotal, saldoPendiente } from './calculos';
import { formularioDesdePreorden, formularioVacio, procesarFormulario, type FormularioPreorden } from './formulario';

const HOY = '2026-11-05';
const AHORA = '2026-11-05T18:00:00.000Z';

function figura(cambios: Partial<FormularioPreorden> = {}): FormularioPreorden {
  return {
    ...formularioVacio(HOY, 'cat-figura'),
    nombre: '  Figura de ejemplo ',
    precio: '45 000',
    deposito: '10.000',
    mes: '3',
    anio: '2027',
    costosExtra: [{ id: 'c1', concepto: 'Courier', monto: '6 500' }],
    ...cambios,
  };
}

describe('crear desde el formulario', () => {
  it('aparta con depósito: crea el pago y calcula el saldo', () => {
    const r = procesarFormulario(figura(), { hoy: HOY, ahoraISO: AHORA });
    if (!r.ok) throw new Error(JSON.stringify(r.errores));
    const p = r.preorden;
    expect(p.nombre).toBe('Figura de ejemplo');
    expect(p.estado).toBe('apartada');
    expect(p.fechaApartada).toBe(HOY);
    expect(p.fechaEstimada).toEqual({ fecha: '2027-03-01', precision: 'mes' });
    expect(p.pagos).toHaveLength(1);
    expect(p.pagos[0]).toMatchObject({ tipo: 'deposito', monto: 10000, fecha: HOY });
    expect([costoTotal(p), saldoPendiente(p)]).toEqual([51500, 41500]);
  });

  it('pago completo y pago al envío', () => {
    const completo = procesarFormulario(figura({ tipoPago: 'completo' }), { hoy: HOY, ahoraISO: AHORA });
    expect(completo.ok && completo.preorden.pagos[0]).toMatchObject({ tipo: 'saldo', monto: 51500 });
    const envio = procesarFormulario(figura({ tipoPago: 'al_envio' }), { hoy: HOY, ahoraISO: AHORA });
    expect(envio.ok && envio.preorden.pagos).toEqual([]);
  });

  it('un deseo no tiene pagos ni fecha de apartado', () => {
    const r = procesarFormulario(figura({ estadoInicial: 'deseada' }), { hoy: HOY, ahoraISO: AHORA });
    expect(r.ok && [r.preorden.estado, r.preorden.pagos, r.preorden.fechaApartada]).toEqual(['deseada', [], null]);
  });

  it('semana (se guarda el lunes) y sin fecha', () => {
    const t = procesarFormulario(figura({ precision: 'semana', fechaSemana: '2026-11-19' }), { hoy: HOY, ahoraISO: AHORA });
    expect(t.ok && t.preorden.fechaEstimada).toEqual({ fecha: '2026-11-16', precision: 'semana' });
    const n = procesarFormulario(figura({ precision: 'ninguna' }), { hoy: HOY, ahoraISO: AHORA });
    expect(n.ok && n.preorden.fechaEstimada).toBeNull();
  });

  it('valida los campos obligatorios y el depósito', () => {
    const r = procesarFormulario(
      figura({ nombre: ' ', precio: 'abc', precision: 'dia', fechaDia: '', costosExtra: [{ id: 'x', concepto: '', monto: '500' }] }),
      { hoy: HOY, ahoraISO: AHORA },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errores).sort()).toEqual(['costosExtra', 'fechaEstimada', 'nombre', 'precio']);

    const caro = procesarFormulario(figura({ deposito: '51 500' }), { hoy: HOY, ahoraISO: AHORA });
    expect(!caro.ok && caro.errores.deposito).toMatch(/menor que el costo total/);
  });

  it('ignora filas de costo extra vacías', () => {
    const r = procesarFormulario(figura({ costosExtra: [{ id: 'v', concepto: '', monto: '' }] }), { hoy: HOY, ahoraISO: AHORA });
    expect(r.ok && r.preorden.costosExtra).toEqual([]);
  });
});

describe('editar desde el formulario', () => {
  function original() {
    const r = procesarFormulario(figura(), { hoy: '2026-08-02', ahoraISO: '2026-08-02T12:00:00.000Z' });
    if (!r.ok) throw new Error('no se creó');
    return r.preorden;
  }

  it('ida y vuelta sin cambios no altera nada importante', () => {
    const p = original();
    const r = procesarFormulario(formularioDesdePreorden(p, HOY), { hoy: HOY, ahoraISO: AHORA, original: p });
    if (!r.ok) throw new Error(JSON.stringify(r.errores));
    expect({ ...r.preorden, actualizadaEl: p.actualizadaEl }).toEqual(p);
  });

  it('cambiar la fecha estimada la registra como reprogramación', () => {
    const p = original();
    const f = { ...formularioDesdePreorden(p, HOY), precision: 'semana' as const, fechaSemana: '2027-04-07' };
    const r = procesarFormulario(f, { hoy: HOY, ahoraISO: AHORA, original: p });
    if (!r.ok) throw new Error(JSON.stringify(r.errores));
    expect(r.preorden.historialFechas).toHaveLength(1);
    expect(r.preorden.historialFechas[0]).toMatchObject({
      registradoEl: HOY,
      anterior: { fecha: '2027-03-01', precision: 'mes' },
      nueva: { fecha: '2027-04-05', precision: 'semana' },
    });
    expect(r.preorden.pagos).toEqual(p.pagos);
  });
});
