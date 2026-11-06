import { describe, expect, it } from 'vitest';
import { migrar } from './persistencia';

describe('migrar', () => {
  it('pasa las fechas por trimestre (ya no existe) al último mes del trimestre', () => {
    const viejo = {
      schemaVersion: 1,
      categorias: [],
      tiendas: [],
      preordenes: [
        {
          id: 'a',
          fechaEstimada: { fecha: '2027-01-01', precision: 'trimestre' },
          historialFechas: [
            {
              id: 'h',
              registradoEl: '2026-09-01',
              anterior: { fecha: '2026-10-01', precision: 'trimestre' },
              nueva: { fecha: '2027-01-01', precision: 'trimestre' },
            },
          ],
        },
        { id: 'b', fechaEstimada: { fecha: '2026-11-16', precision: 'semana' }, historialFechas: [] },
      ],
    };
    const d = migrar(viejo)!;
    expect(d.preordenes[0].fechaEstimada).toEqual({ fecha: '2027-03-01', precision: 'mes' });
    expect(d.preordenes[0].historialFechas[0].anterior).toEqual({ fecha: '2026-12-01', precision: 'mes' });
    expect(d.preordenes[0].historialFechas[0].nueva).toEqual({ fecha: '2027-03-01', precision: 'mes' });
    expect(d.preordenes[1].fechaEstimada).toEqual({ fecha: '2026-11-16', precision: 'semana' });
  });

  it('rechaza lo que no reconoce', () => {
    expect(migrar(null)).toBeNull();
    expect(migrar({ schemaVersion: 2, preordenes: [], categorias: [], tiendas: [] })).toBeNull();
  });
});
