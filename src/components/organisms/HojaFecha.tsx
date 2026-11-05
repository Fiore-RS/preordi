import { useState, type FormEvent } from 'react';
import { cambiarFechaEstimada } from '../../lib/acciones';
import { formatearFechaEstimada, hoy as fechaDeHoy } from '../../lib/fechas';
import { fechaEstimadaDeFormulario, valoresFecha, type ValoresFecha } from '../../lib/formulario';
import type { Preorden } from '../../types';
import { Boton } from '../atoms/Boton';
import { Campo, CLASE_ENTRADA } from '../molecules/Campo';
import { SelectorFechaEstimada } from '../molecules/SelectorFechaEstimada';
import { HojaInferior } from './HojaInferior';

interface Props {
  preorden: Preorden;
  onGuardar: (preorden: Preorden) => void;
  onCerrar: () => void;
}

/** Cambiar la fecha estimada — especificación 8.7. */
export function HojaFecha({ preorden, onGuardar, onCerrar }: Props) {
  const hoy = fechaDeHoy();
  const [valores, setValores] = useState<ValoresFecha>(() => valoresFecha(preorden.fechaEstimada, hoy));
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);

  const nueva = fechaEstimadaDeFormulario(valores);
  const esReprogramacion = !!preorden.fechaEstimada && !!nueva && formatearFechaEstimada(nueva) !== formatearFechaEstimada(preorden.fechaEstimada);

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (nueva === undefined) return setError('Completá la fecha o elegí "Sin fecha".');
    onGuardar(cambiarFechaEstimada(preorden, nueva, hoy, new Date().toISOString(), nota.trim() || undefined));
  }

  return (
    <HojaInferior
      titulo="Cambiar fecha"
      subtitulo={`Ahora: ${formatearFechaEstimada(preorden.fechaEstimada)}`}
      onCerrar={onCerrar}
    >
      <form noValidate onSubmit={guardar} className="flex flex-col gap-5">
        <Campo id="campo-nueva-fecha" etiqueta="Llegada estimada" error={error ?? undefined}>
          <SelectorFechaEstimada
            idBase="nueva-fecha"
            hoy={hoy}
            valores={valores}
            onCambio={(cambios) => {
              setValores((v) => ({ ...v, ...cambios }));
              setError(null);
            }}
            invalido={!!error}
            aria-describedby={error ? 'campo-nueva-fecha-error' : undefined}
          />
        </Campo>

        {esReprogramacion && (
          <Campo
            id="campo-nota-fecha"
            etiqueta="Nota"
            para="nota-fecha"
            ayuda="Queda en el historial de reprogramaciones."
          >
            <input
              id="nota-fecha"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="La tienda avisó retraso"
              autoComplete="off"
              className={`${CLASE_ENTRADA} h-12`}
            />
          </Campo>
        )}

        <div className="flex gap-2.5 pt-1">
          <Boton className="flex-1" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" variante="principal" className="flex-[1.4]">
            Guardar fecha
          </Boton>
        </div>
      </form>
    </HojaInferior>
  );
}
