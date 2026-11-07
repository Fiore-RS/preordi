import { useState } from 'react';
import { usePreordi } from '../../context/PreordiContext';
import { hacerRespaldo } from '../../lib/respaldo';
import { avisoPospuestoHasta, DIAS_POSPONER, posponerAviso, revisarRespaldo, ultimoRespaldo } from '../../lib/recordatorioRespaldo';
import { Icono } from '../atoms/Icono';

/**
 * Aviso de Inicio cuando pasan 30 días sin respaldo (especificación 6.4).
 * El botón hace el respaldo ahí mismo; la X lo esconde por DIAS_POSPONER días.
 */
export function AvisoRespaldo({ hoy }: { hoy: string }) {
  const { datos } = usePreordi();
  // Se vuelve a leer al respaldar o posponer; con esto basta para que el aviso se quite.
  const [version, setVersion] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(false);
  void version;

  const estado = revisarRespaldo(datos.preordenes, hoy, ultimoRespaldo(), avisoPospuestoHasta());
  if (!estado) return null;

  async function respaldar() {
    setOcupado(true);
    setError(false);
    try {
      await hacerRespaldo(datos, hoy);
      setVersion((v) => v + 1);
    } catch {
      setError(true);
    } finally {
      setOcupado(false);
    }
  }

  function cerrar() {
    posponerAviso(hoy);
    setVersion((v) => v + 1);
  }

  return (
    <section aria-labelledby="titulo-aviso-respaldo" className="relative mx-5 flex flex-col gap-3 rounded-[20px] bg-superficie-suave p-4">
      <button
        type="button"
        onClick={cerrar}
        aria-label={`Ocultar por ${DIAS_POSPONER} días`}
        className="absolute top-2 right-2 flex size-10 items-center justify-center rounded-full text-tinta-suave hover:bg-borde-suave"
      >
        <Icono nombre="cerrar" tamano={18} grosor={2.2} />
      </button>
      <div className="flex items-start gap-2.5 pr-8">
        <Icono nombre="subir" tamano={20} grosor={2} className="mt-0.5 shrink-0 text-acento-texto" />
        <div className="flex flex-col gap-0.5">
          <h2 id="titulo-aviso-respaldo" className="font-display text-base leading-tight font-extrabold">
            {estado.dias === null ? 'Todavía no has hecho un respaldo' : `Hace ${estado.dias} días que no respaldás`}
          </h2>
          <p className="text-[13px] text-tinta-suave">
            Si cambiás de teléfono o se borran los datos del navegador, el respaldo es lo único que recupera tus preórdenes y
            fotos.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={respaldar}
        disabled={ocupado}
        className="flex min-h-11 w-full items-center justify-center rounded-xl bg-tinta px-4 text-sm font-bold text-fondo disabled:opacity-60"
      >
        {ocupado ? 'Armando respaldo…' : 'Hacer respaldo'}
      </button>
      {error && <p className="text-[13px] font-medium text-acento-texto">No se pudo armar el respaldo. Intentá de nuevo.</p>}
    </section>
  );
}
