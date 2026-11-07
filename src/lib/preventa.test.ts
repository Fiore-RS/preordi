import { describe, expect, it } from 'vitest';
import type { Preorden, Preventa } from '../types';
import {
  avisosPreventa,
  etiquetaPreventa,
  formatearHora,
  infoPreventa,
  montoParaApartar,
  ordenarDeseos,
  preventaDeCampos,
  textoCuentaRegresiva,
  totalParaApartar,
} from './preventa';

function deseo(nombre: string, preventa?: Partial<Preventa>, cambios: Partial<Preorden> = {}): Preorden {
  return {
    id: nombre,
    nombre,
    categoriaId: 'c',
    tiendaId: null,
    estado: 'deseada',
    tipoPago: 'deposito',
    precio: 50000,
    costosExtra: [],
    pagos: [],
    fechaEstimada: null,
    historialFechas: [],
    fechaApartada: null,
    fechaEnviada: null,
    fechaRecibida: null,
    fechaCancelada: null,
    imagenId: null,
    creadaEl: '2026-10-01T12:00:00.000Z',
    actualizadaEl: '2026-10-01T12:00:00.000Z',
    ...(preventa ? { preventa: { abre: null, cierra: null, horaCierre: null, ...preventa } } : {}),
    ...cambios,
  };
}

// 10 nov 2026, 3:30 p. m. hora local
const AHORA = new Date(2026, 10, 10, 15, 30);
const HOY = '2026-11-10';

describe('infoPreventa', () => {
  it('sin fechas no tiene preventa', () => {
    expect(infoPreventa(deseo('a'), AHORA).fase).toBe('sin_fechas');
  });

  it('las preórdenes apartadas no cuentan aunque tengan fechas', () => {
    expect(infoPreventa(deseo('a', { cierra: '2026-11-11' }, { estado: 'apartada' }), AHORA).fase).toBe('sin_fechas');
  });

  it('urgencia según los días que faltan', () => {
    expect(infoPreventa(deseo('a', { cierra: '2026-11-25' }), AHORA)).toEqual({ fase: 'abierta', diasParaCierre: 15, urgencia: 'ninguna' });
    expect(infoPreventa(deseo('a', { cierra: '2026-11-17' }), AHORA).urgencia).toBe('aviso');
    expect(infoPreventa(deseo('a', { cierra: '2026-11-12' }), AHORA).urgencia).toBe('urgente');
    expect(infoPreventa(deseo('a', { cierra: HOY }), AHORA).urgencia).toBe('hoy');
  });

  it('cierra hoy: sin hora sigue abierta todo el día; con hora, cierra a esa hora', () => {
    expect(infoPreventa(deseo('a', { cierra: HOY }), AHORA).fase).toBe('abierta');
    expect(infoPreventa(deseo('a', { cierra: HOY, horaCierre: '18:00' }), AHORA).fase).toBe('abierta');
    expect(infoPreventa(deseo('a', { cierra: HOY, horaCierre: '15:30' }), AHORA).fase).toBe('cerrada');
  });

  it('cerrada si el día ya pasó', () => {
    expect(infoPreventa(deseo('a', { cierra: '2026-11-09' }), AHORA).fase).toBe('cerrada');
  });

  it('próximamente si todavía no abre, sin aviso aunque cierre pronto', () => {
    const i = infoPreventa(deseo('a', { abre: '2026-11-11', cierra: '2026-11-13' }), AHORA);
    expect(i.fase).toBe('proximamente');
    expect(i.urgencia).toBe('ninguna');
  });
});

describe('avisos y montos', () => {
  it('solo avisa de las que cierran pronto, la más próxima primero', () => {
    const lista = [
      deseo('lejos', { cierra: '2026-12-20' }),
      deseo('semana', { cierra: '2026-11-15' }),
      deseo('hoy-tarde', { cierra: HOY, horaCierre: '23:00' }),
      deseo('hoy', { cierra: HOY }),
      deseo('cerrada', { cierra: '2026-11-01' }),
    ];
    expect(avisosPreventa(lista, AHORA).map((a) => a.preorden.id)).toEqual(['hoy-tarde', 'hoy', 'semana']);
  });

  it('monto para apartar según el tipo de pago', () => {
    expect(montoParaApartar(deseo('a', undefined, { tipoPago: 'completo', costosExtra: [{ id: 'x', concepto: 'Envío', monto: 5000 }] }))).toBe(55000);
    expect(montoParaApartar(deseo('a', undefined, { tipoPago: 'al_envio' }))).toBe(0);
    expect(montoParaApartar(deseo('a', undefined, { depositoEstimado: 15000 }))).toBe(15000);
    expect(montoParaApartar(deseo('a'))).toBeNull();
    expect(totalParaApartar([deseo('a', undefined, { depositoEstimado: 15000 }), deseo('b')])).toEqual({ total: 15000, sinMonto: 1 });
  });
});

describe('ordenarDeseos', () => {
  it('separa las cerradas y ordena las vigentes por cierre', () => {
    const lista = [
      deseo('sin', undefined, { creadaEl: '2026-10-05T00:00:00Z' }),
      deseo('abre', { abre: '2026-11-20' }),
      deseo('cierra-tarde', { cierra: '2026-12-01' }),
      deseo('cierra-pronto', { cierra: '2026-11-12' }),
      deseo('cerrada', { cierra: '2026-11-01' }),
    ];
    const r = ordenarDeseos(lista, AHORA);
    expect(r.vigentes.map((p) => p.id)).toEqual(['cierra-pronto', 'cierra-tarde', 'abre', 'sin']);
    expect(r.cerrados.map((p) => p.id)).toEqual(['cerrada']);
  });
});

describe('textos', () => {
  it('cuenta regresiva y etiqueta', () => {
    const hoy = deseo('a', { cierra: HOY, horaCierre: '23:00' });
    expect(textoCuentaRegresiva(hoy, infoPreventa(hoy, AHORA), HOY)).toBe('Cierra hoy a las 11:00 p. m.');
    const manana = deseo('a', { cierra: '2026-11-11' });
    expect(textoCuentaRegresiva(manana, infoPreventa(manana, AHORA), HOY)).toBe('Cierra mañana');
    const lejos = deseo('a', { cierra: '2027-01-05' });
    expect(etiquetaPreventa(lejos, infoPreventa(lejos, AHORA), HOY)).toBe('Cierra 5 ene 2027');
    const cerrada = deseo('a', { cierra: '2026-11-01' });
    expect(textoCuentaRegresiva(cerrada, infoPreventa(cerrada, AHORA), HOY)).toBe('Cerró el 1 nov');
    expect(formatearHora('00:15')).toBe('12:15 a. m.');
    expect(formatearHora('12:00')).toBe('12:00 p. m.');
  });
});

describe('preventaDeCampos', () => {
  it('vacío = sin preventa', () => {
    expect(preventaDeCampos('', '', '')).toEqual({ ok: true, preventa: undefined });
  });
  it('valida orden de fechas y hora sin día', () => {
    expect(preventaDeCampos('2026-11-20', '2026-11-10', '').ok).toBe(false);
    expect(preventaDeCampos('', '', '18:00').ok).toBe(false);
    expect(preventaDeCampos('', '2026-11-20', '18:00')).toEqual({
      ok: true,
      preventa: { abre: null, cierra: '2026-11-20', horaCierre: '18:00' },
    });
  });
});
