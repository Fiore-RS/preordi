import { describe, expect, it } from 'vitest';
import { medidasRedimension } from './imagenes';

describe('redimensionar', () => {
  it('lleva el lado mayor a 800 manteniendo la proporción', () => {
    expect(medidasRedimension(4032, 3024)).toEqual({ ancho: 800, alto: 600 });
    expect(medidasRedimension(1080, 1920)).toEqual({ ancho: 450, alto: 800 });
  });

  it('no agranda imágenes chicas', () => {
    expect(medidasRedimension(500, 300)).toEqual({ ancho: 500, alto: 300 });
  });

  it('nunca queda en cero', () => {
    expect(medidasRedimension(10000, 2)).toEqual({ ancho: 800, alto: 1 });
  });
});
