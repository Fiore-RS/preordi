import { formatearMonto } from '../../lib/dinero';
import { etiquetaMes, type SaldoDelMes } from '../../lib/inicio';
import { Monto } from '../atoms/Monto';

interface Props {
  mes: SaldoDelMes;
  hoy: string;
  /** El saldo del mes más cargado: la barra se mide contra él. */
  maximo: number;
  /** El primer mes (el de hoy o el más próximo) va en naranja. */
  destacado: boolean;
  /** Debajo del mes, cuántas preórdenes suman ahí (en la pantalla Por pagar). */
  conCantidad?: boolean;
  className?: string;
}

const textoCantidad = (n: number) => `${n} ${n === 1 ? 'preorden' : 'preórdenes'}`;

/** Una fila de "Por pagar cada mes": el mes, una barra proporcional y el saldo. */
export function FilaSaldoMes({ mes, hoy, maximo, destacado, conCantidad = false, className = '' }: Props) {
  const { nombre, anio } = etiquetaMes(mes.clave, hoy);
  const ancho = Math.max(4, Math.round((mes.saldo / Math.max(1, maximo)) * 100));
  return (
    <span className={`grid min-h-8 grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-x-3 ${className}`}>
      <span className="sr-only">
        {nombre}
        {anio && ` ${anio}`}: {formatearMonto(mes.saldo)}, {textoCantidad(mes.cantidad)}
      </span>
      <span aria-hidden="true" className="flex flex-col leading-tight">
        <span className={`text-[13px] whitespace-nowrap ${destacado ? 'font-bold text-tinta' : 'text-tinta-suave'}`}>
          {nombre}
          {anio && <span className="text-[10.5px] font-normal text-tinta-suave"> ’{anio.slice(2)}</span>}
        </span>
        {conCantidad && <span className="text-[11px] text-tinta-suave">{textoCantidad(mes.cantidad)}</span>}
      </span>
      <span aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-superficie-suave">
        <span
          className={`block h-full rounded-full ${destacado ? 'bg-naranja-500' : 'bg-tinta-suave'}`}
          style={{ width: `${ancho}%` }}
        />
      </span>
      <span aria-hidden="true" className="min-w-12 text-right">
        <Monto monto={mes.saldo} className="font-display text-sm font-extrabold whitespace-nowrap" />
      </span>
    </span>
  );
}
