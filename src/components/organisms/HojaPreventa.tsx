import { useState, type FormEvent } from 'react';
import { preventaDeCampos } from '../../lib/preventa';
import type { Preorden } from '../../types';
import { Boton } from '../atoms/Boton';
import { CLASE_ENTRADA, MensajeError } from '../molecules/Campo';
import { HojaInferior } from './HojaInferior';

interface Props {
  preorden: Preorden;
  onGuardar: (preorden: Preorden) => void;
  onCerrar: () => void;
}

/**
 * Cambiar las fechas de la preventa de un deseo — especificación 5.9.
 * Sirve tanto para anotarlas como para cuando la tienda extiende la preventa o abre otra ronda.
 */
export function HojaPreventa({ preorden, onGuardar, onCerrar }: Props) {
  const [abre, setAbre] = useState(preorden.preventa?.abre ?? '');
  const [cierra, setCierra] = useState(preorden.preventa?.cierra ?? '');
  const [hora, setHora] = useState(preorden.preventa?.horaCierre ?? '');
  const [error, setError] = useState<string | null>(null);
  const hayFechas = !!(preorden.preventa?.abre || preorden.preventa?.cierra);

  function guardar(e: FormEvent) {
    e.preventDefault();
    const r = preventaDeCampos(abre, cierra, hora);
    if (!r.ok) return setError(r.error);
    onGuardar({ ...preorden, preventa: r.preventa, actualizadaEl: new Date().toISOString() });
  }

  function cambio<T>(set: (v: T) => void) {
    return (v: T) => {
      set(v);
      setError(null);
    };
  }

  return (
    <HojaInferior titulo={hayFechas ? 'Cambiar fechas de preventa' : 'Fechas de preventa'} subtitulo={preorden.nombre} onCerrar={onCerrar}>
      <form noValidate onSubmit={guardar} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Abre
            <input
              type="date"
              value={abre}
              onChange={(e) => cambio(setAbre)(e.target.value)}
              aria-invalid={!!error || undefined}
              className={`${CLASE_ENTRADA} h-12 font-normal`}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Cierra
            <input
              type="date"
              value={cierra}
              min={abre || undefined}
              onChange={(e) => cambio(setCierra)(e.target.value)}
              aria-invalid={!!error || undefined}
              className={`${CLASE_ENTRADA} h-12 font-normal`}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Hora de cierre
          <input
            type="time"
            value={hora}
            onChange={(e) => cambio(setHora)(e.target.value)}
            aria-invalid={!!error || undefined}
            className={`${CLASE_ENTRADA} h-12 font-normal`}
          />
        </label>
        <p className="-mt-2 text-[13px] text-tinta-suave">Todo es opcional. Sin hora, cuenta hasta el final del día.</p>
        <MensajeError id="error-preventa" texto={error ?? undefined} />

        <div className="flex gap-2.5 pt-1">
          {hayFechas ? (
            <Boton
              className="flex-1"
              onClick={() => onGuardar({ ...preorden, preventa: undefined, actualizadaEl: new Date().toISOString() })}
            >
              Quitar fechas
            </Boton>
          ) : (
            <Boton className="flex-1" onClick={onCerrar}>
              Volver
            </Boton>
          )}
          <Boton type="submit" variante="principal" className="flex-[1.4]">
            Guardar
          </Boton>
        </div>
      </form>
    </HojaInferior>
  );
}
