interface Opcion<T extends string> {
  valor: T;
  texto: string;
}

interface Props<T extends string> {
  etiqueta: string;
  opciones: Opcion<T>[];
  valor: T;
  onCambio: (valor: T) => void;
}

/** Control segmentado: una sola opción activa (pastilla blanca sobre fondo marino-50). */
export function Segmentado<T extends string>({ etiqueta, opciones, valor, onCambio }: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      className="grid gap-1 rounded-[14px] bg-marino-50 p-1"
      style={{ gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` }}
    >
      {opciones.map((o) => {
        const activa = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activa}
            onClick={() => onCambio(o.valor)}
            className={`min-h-10 rounded-[10px] px-1 text-[13px] transition-colors ${
              activa ? 'bg-white font-bold text-marino-500' : 'font-medium text-marino-400 hover:text-marino-500'
            }`}
          >
            {o.texto}
          </button>
        );
      })}
    </div>
  );
}
