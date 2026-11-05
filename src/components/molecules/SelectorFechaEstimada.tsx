import type { PrecisionFormulario, ValoresFecha } from '../../lib/formulario';
import { CLASE_ENTRADA } from './Campo';
import { Segmentado } from './Segmentado';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const TRIMESTRES = ['T1 · ene–mar', 'T2 · abr–jun', 'T3 · jul–set', 'T4 · oct–dic'];

const PRECISIONES: { valor: PrecisionFormulario; texto: string }[] = [
  { valor: 'dia', texto: 'Día' },
  { valor: 'mes', texto: 'Mes' },
  { valor: 'trimestre', texto: 'Trimestre' },
  { valor: 'ninguna', texto: 'Sin fecha' },
];

interface Props {
  valores: ValoresFecha;
  onCambio: (cambios: Partial<ValoresFecha>) => void;
  hoy: string;
  /** Prefijo para los ids de los controles (para que no choquen si hay dos en pantalla). */
  idBase: string;
  invalido?: boolean;
  'aria-describedby'?: string;
}

/**
 * Fecha estimada con precisión (especificación 5.3): día, mes o trimestre, o sin fecha.
 * Usa selectores de mes y año en vez de <input type="month">, que no existe en Firefox
 * ni en Safari de escritorio.
 */
export function SelectorFechaEstimada({ valores, onCambio, hoy, idBase, invalido, ...resto }: Props) {
  const anioActual = Number(hoy.slice(0, 4));
  const anios = Array.from({ length: 7 }, (_, i) => String(anioActual - 1 + i));
  if (!anios.includes(valores.anio)) anios.unshift(valores.anio);

  return (
    <>
      <Segmentado
        etiqueta="Precisión de la fecha"
        valor={valores.precision}
        onCambio={(precision) => onCambio({ precision })}
        opciones={PRECISIONES}
      />
      {valores.precision === 'dia' && (
        <>
          <label htmlFor={`${idBase}-dia`} className="sr-only">
            Día estimado
          </label>
          <input
            id={`${idBase}-dia`}
            type="date"
            value={valores.fechaDia}
            onChange={(e) => onCambio({ fechaDia: e.target.value })}
            aria-invalid={invalido || undefined}
            aria-describedby={resto['aria-describedby']}
            className={`${CLASE_ENTRADA} h-12`}
          />
        </>
      )}
      {(valores.precision === 'mes' || valores.precision === 'trimestre') && (
        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-2">
          {valores.precision === 'mes' ? (
            <select
              aria-label="Mes estimado"
              value={valores.mes}
              onChange={(e) => onCambio({ mes: e.target.value })}
              className={`${CLASE_ENTRADA} h-12`}
            >
              {MESES.map((m, i) => (
                <option key={m} value={String(i + 1)}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <select
              aria-label="Trimestre estimado"
              value={valores.trimestre}
              onChange={(e) => onCambio({ trimestre: e.target.value })}
              className={`${CLASE_ENTRADA} h-12`}
            >
              {TRIMESTRES.map((t, i) => (
                <option key={t} value={String(i + 1)}>
                  {t}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Año estimado"
            value={valores.anio}
            onChange={(e) => onCambio({ anio: e.target.value })}
            className={`${CLASE_ENTRADA} h-12`}
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
