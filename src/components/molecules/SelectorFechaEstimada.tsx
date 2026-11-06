import { formatearFechaEstimada, normalizarFecha } from '../../lib/fechas';
import type { PrecisionFormulario, ValoresFecha } from '../../lib/formulario';
import { CLASE_ENTRADA } from './Campo';
import { Desplegable } from './Desplegable';
import { Segmentado } from './Segmentado';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const PRECISIONES: { valor: PrecisionFormulario; texto: string }[] = [
  { valor: 'dia', texto: 'Día' },
  { valor: 'semana', texto: 'Semana' },
  { valor: 'mes', texto: 'Mes' },
  { valor: 'ninguna', texto: 'Sin fecha' },
];

/** "Semana del lunes 16 al domingo 22 nov 2026", o cómo elegirla si todavía no hay día. */
function textoSemana(dia: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return 'Elegí cualquier día de esa semana (de lunes a domingo).';
  const fe = { fecha: normalizarFecha(dia, 'semana'), precision: 'semana' as const };
  return `Semana del lunes al domingo: ${formatearFechaEstimada(fe)}`;
}

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
 * Fecha estimada con precisión (especificación 5.3): día, semana o mes, o sin fecha.
 * Usa selectores de mes y año en vez de <input type="month">, y un día cualquiera para la semana
 * en vez de <input type="week">: ninguno de los dos existe en Safari.
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
      {valores.precision === 'semana' && (
        <>
          <label htmlFor={`${idBase}-semana`} className="sr-only">
            Un día de la semana estimada
          </label>
          <input
            id={`${idBase}-semana`}
            type="date"
            value={valores.fechaSemana}
            onChange={(e) => onCambio({ fechaSemana: e.target.value })}
            aria-invalid={invalido || undefined}
            aria-describedby={resto['aria-describedby']}
            className={`${CLASE_ENTRADA} h-12`}
          />
          <p className="text-[13px] text-tinta-suave">{textoSemana(valores.fechaSemana)}</p>
        </>
      )}
      {valores.precision === 'mes' && (
        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-2">
          <Desplegable
            etiqueta="Mes estimado"
            valor={valores.mes}
            onCambio={(mes) => onCambio({ mes })}
            opciones={MESES.map((m, i) => ({ valor: String(i + 1), texto: m }))}
          />
          <Desplegable
            etiqueta="Año estimado"
            valor={valores.anio}
            onCambio={(anio) => onCambio({ anio })}
            opciones={anios.map((x) => ({ valor: x, texto: x }))}
          />
        </div>
      )}
    </>
  );
}
