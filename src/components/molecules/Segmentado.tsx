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

/** Control segmentado: una sola opción activa, sólida como las etiquetas de la Vitrina (10.9). */
export function Segmentado<T extends string>({ etiqueta, opciones, valor, onCambio }: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      className="grid gap-1 rounded-[14px] bg-superficie-suave p-1"
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
              activa ? 'bg-tinta font-bold text-fondo' : 'font-medium text-tinta-suave hover:text-tinta'
            }`}
          >
            {o.texto}
          </button>
        );
      })}
    </div>
  );
}
