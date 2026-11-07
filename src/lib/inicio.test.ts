import { describe, expect, it } from 'vitest';
import type { Preorden } from '../types';
import { totales } from './calculos';
import { etiquetaMes, progresoMes, resumenInicio, saldoPorMes } from './inicio';

function p(nombre: string, cambios: Partial<Preorden>): Preorden {
  return {
    id: nombre,
    nombre,
    categoriaId: 'c',
    tiendaId: null,
    estado: 'apartada',
    tipoPago: 'deposito',
    precio: 10000,
    costosExtra: [],
    pagos: [],
    fechaEstimada: null,
    historialFechas: [],
    fechaApartada: '2026-08-01',
    fechaEnviada: null,
    fechaRecibida: null,
    fechaCancelada: null,
    imagenId: null,
    creadaEl: '2026-08-01T00:00:00.000Z',
    actualizadaEl: '2026-08-01T00:00:00.000Z',
    ...cambios,
  };
}

const HOY = '2026-11-05';
const lista = [
  p('Peluche', { fechaEstimada: { fecha: '2026-10-01', precision: 'mes' } }),
  p('Llavero', { fechaEstimada: { fecha: '2026-09-15', precision: 'dia' } }),
  p('Artbook', { estado: 'en_camino', fechaEstimada: { fecha: '2026-11-10', precision: 'dia' } }),
  p('Tomo 12', { fechaEstimada: { fecha: '2026-11-14', precision: 'dia' } }),
  p('Sin fecha', {}),
  p('Figura', { fechaEstimada: { fecha: '2027-03-01', precision: 'mes' } }),
  p('Novela', { estado: 'recibida', fechaRecibida: '2026-10-01' }),
  p('Póster', { estado: 'recibida', fechaRecibida: '2026-10-01', pagos: [{ id: 'x', fecha: '2026-10-01', monto: 10000, tipo: 'saldo' }] }),
  p('Box set', { estado: 'deseada' }),
  p('Cancelada', { estado: 'cancelada' }),
];

describe('resumen de Inicio', () => {
  const r = resumenInicio(lista, HOY);
  const nombres = (xs: Preorden[]) => xs.map((x) => x.nombre);

  it('cuenta por estado', () => {
    expect([r.apartadas, r.enCamino, r.deseos]).toEqual([5, 1, 1]);
  });

  it('separa las vencidas, de la más atrasada a la menos', () => {
    expect(nombres(r.vencidas)).toEqual(['Llavero', 'Peluche']);
  });

  it('las más próximas en grande y las siguientes en filas (sin fecha al final)', () => {
    expect(nombres(r.destacadas)).toEqual(['Artbook', 'Tomo 12', 'Figura', 'Sin fecha']);
    expect(r.masAdelante).toEqual([]);
    expect(r.totalProximas).toBe(4);
    const chico = resumenInicio(lista, HOY, 1, 2);
    expect(nombres(chico.destacadas)).toEqual(['Artbook']);
    expect(nombres(chico.masAdelante)).toEqual(['Tomo 12', 'Figura']);
  });

  it('por pagar: lo que no sale en "llegan pronto", de mayor a menor saldo', () => {
    expect(nombres(r.porPagar)).toEqual(['Llavero', 'Peluche']);
    const corto = resumenInicio(
      lista.map((x) => (x.nombre === 'Figura' ? { ...x, precio: 50000 } : x)),
      HOY,
      2,
      0,
    );
    expect(nombres(corto.porPagar)).toEqual(['Figura', 'Llavero', 'Peluche', 'Sin fecha']);
  });

  it('recibidas con saldo pendiente', () => {
    expect(nombres(r.recibidasConSaldo)).toEqual(['Novela']);
  });

  it('saldo por mes: solo meses con algo por pagar; lo atrasado cae en el mes de hoy y sin fecha al final', () => {
    const meses = saldoPorMes(lista, HOY);
    expect(meses.map((m) => m.clave)).toEqual(['2026-11', '2027-03', 'sin_fecha']);
    // noviembre: Artbook y Tomo 12 (llegan este mes) + Llavero y Peluche (vencidas) + la recibida con saldo
    expect(meses[0].cantidad).toBe(5);
    expect(meses.map((m) => m.saldo)).toEqual([50000, 10000, 10000]);
    expect(meses.reduce((s, m) => s + m.saldo, 0)).toBe(totales(lista).totalPendiente);
    expect(nombres(meses[0].preordenes)).toEqual(['Peluche', 'Llavero', 'Artbook', 'Tomo 12', 'Novela']);
    expect(nombres(meses[2].preordenes)).toEqual(['Sin fecha']);
  });

  it('progreso del mes: lo pagado sobre lo que cuestan sus preórdenes', () => {
    const conAbono = [
      p('Tomo', { fechaEstimada: { fecha: '2026-12-10', precision: 'dia' }, pagos: [{ id: 'a', fecha: '2026-11-01', monto: 4000, tipo: 'deposito' }] }),
      p('Figura', { fechaEstimada: { fecha: '2026-12-20', precision: 'dia' } }),
    ];
    const [dic] = saldoPorMes(conAbono, HOY);
    expect(dic).toMatchObject({ clave: '2026-12', costo: 20000, pagado: 4000, saldo: 16000 });
    expect(progresoMes(dic)).toBeCloseTo(0.2);
    expect(progresoMes({ ...dic, costo: 0 })).toBe(0);
  });

  it('etiqueta del mes: el año solo si no es el de hoy', () => {
    expect(etiquetaMes('2026-11', HOY)).toEqual({ nombre: 'nov', anio: '' });
    expect(etiquetaMes('2027-03', HOY)).toEqual({ nombre: 'mar', anio: '2027' });
    expect(etiquetaMes('sin_fecha', HOY)).toEqual({ nombre: 'Sin fecha', anio: '' });
  });
});
