import { describe, expect, it } from 'vitest';
import type { Preorden } from '../types';
import { revisarRespaldo } from './recordatorioRespaldo';

const p = (creadaEl: string) => ({ creadaEl }) as Preorden;

describe('revisarRespaldo', () => {
  it('sin datos no avisa', () => {
    expect(revisarRespaldo([], '2026-11-06', null, null)).toBeNull();
  });
  it('sin respaldos, cuenta desde la preorden más antigua', () => {
    expect(revisarRespaldo([p('2026-10-20T10:00:00Z')], '2026-11-06', null, null)).toBeNull();
    expect(revisarRespaldo([p('2026-11-01T00:00:00Z'), p('2026-09-01T00:00:00Z')], '2026-11-06', null, null)).toEqual({ dias: null });
  });
  it('avisa a los 30 días del último respaldo', () => {
    expect(revisarRespaldo([p('2026-01-01T00:00:00Z')], '2026-11-06', '2026-10-10', null)).toBeNull();
    expect(revisarRespaldo([p('2026-01-01T00:00:00Z')], '2026-11-06', '2026-10-01', null)).toEqual({ dias: 36 });
  });
  it('la X lo esconde hasta la fecha pospuesta', () => {
    expect(revisarRespaldo([p('2026-01-01T00:00:00Z')], '2026-11-06', '2026-09-01', '2026-11-10')).toBeNull();
    expect(revisarRespaldo([p('2026-01-01T00:00:00Z')], '2026-11-10', '2026-09-01', '2026-11-10')).not.toBeNull();
  });
});
