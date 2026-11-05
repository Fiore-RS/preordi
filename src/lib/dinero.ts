// Dinero en colones (enteros) — especificación 5.7 y 5.8.

const formato = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
});

/** 45000 → "₡45 000" */
export function formatearMonto(monto: number): string {
  return formato.format(Math.round(monto));
}

/**
 * Convierte lo que se escribe en un campo de monto a entero.
 * Acepta "45 000", "45.000", "45,000", "₡45000". Devuelve null si no es un entero > 0.
 */
export function parsearMonto(texto: string): number | null {
  const limpio = texto.replace(/[₡\s.,  ]/g, '');
  if (!/^\d+$/.test(limpio)) return null;
  const monto = Number.parseInt(limpio, 10);
  return monto > 0 ? monto : null;
}
