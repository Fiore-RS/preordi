import { parsearMonto } from '../../lib/dinero';

interface Props {
  id: string;
  valor: string;
  onCambio: (texto: string) => void;
  invalido?: boolean;
  placeholder?: string;
  'aria-describedby'?: string;
}

const conGrupos = (n: number) => new Intl.NumberFormat('es-CR').format(n);

/** Monto en colones: acepta "45000", "45 000" o "45.000" y al salir lo muestra agrupado. */
export function CampoMonto({ id, valor, onCambio, invalido, placeholder = '0', ...resto }: Props) {
  return (
    <div
      className={`flex h-12 items-center gap-1.5 rounded-xl border bg-white px-3.5 focus-within:border-marino-500 ${
        invalido ? 'border-naranja-700' : 'border-marino-100'
      }`}
    >
      <span className="font-display text-lg text-marino-400" aria-hidden="true">
        ₡
      </span>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={valor}
        placeholder={placeholder}
        aria-invalid={invalido || undefined}
        aria-describedby={resto['aria-describedby']}
        onChange={(e) => onCambio(e.target.value)}
        onBlur={() => {
          const monto = parsearMonto(valor);
          if (monto !== null) onCambio(conGrupos(monto));
        }}
        className="h-full w-full min-w-0 bg-transparent text-base text-marino-500 tabular-nums placeholder:text-marino-300 focus:outline-none"
      />
    </div>
  );
}
