import { Icono, type NombreIcono } from '../atoms/Icono';

interface Opcion {
  valor: string;
  texto: string;
}

interface Props {
  etiqueta: string;
  /** Valor actual; '' es "sin filtro". */
  valor: string;
  opciones: Opcion[];
  onCambio: (valor: string) => void;
  /** Texto de la opción "sin filtro". Sin él, no hay opción vacía (para el orden). */
  textoTodas?: string;
  icono?: NombreIcono;
}

/**
 * Filtro con forma de pastilla. Por dentro es un <select> nativo: en el teléfono
 * abre el selector del sistema y es accesible sin trabajo extra.
 * Se resalta cuando tiene un filtro aplicado.
 */
export function FiltroPastilla({ etiqueta, valor, opciones, onCambio, textoTodas, icono = 'abajo' }: Props) {
  const activo = textoTodas !== undefined && valor !== '';
  return (
    <label
      className={`relative inline-flex min-h-9 shrink-0 items-center rounded-full border text-[13px] transition-colors focus-within:border-tinta ${
        activo ? 'border-tinta bg-superficie font-bold' : 'border-borde bg-superficie font-medium'
      }`}
    >
      <span className="sr-only">{etiqueta}</span>
      <select
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        className="h-9 max-w-44 min-w-0 cursor-pointer appearance-none truncate rounded-full bg-transparent pr-8 pl-3.5 text-tinta focus:outline-none"
      >
        {textoTodas !== undefined && <option value="">{textoTodas}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      <Icono nombre={icono} tamano={16} grosor={2} className="pointer-events-none absolute right-3" />
    </label>
  );
}
