import { formatearMonto } from '../../lib/dinero';

/**
 * Monto destacado con el símbolo ₡ más pequeño y elevado (refinamiento visual, 10.9).
 * El tamaño lo da el contenedor; los lectores de pantalla leen el monto completo.
 */
export function Monto({ monto, className = '' }: { monto: number; className?: string }) {
  const texto = formatearMonto(monto);
  return (
    <span aria-label={texto} className={`tabular-nums ${className}`}>
      <span aria-hidden="true" className="mr-[0.06em] align-[0.42em] text-[0.55em] font-semibold">
        ₡
      </span>
      <span aria-hidden="true">{texto.replace('₡', '')}</span>
    </span>
  );
}
