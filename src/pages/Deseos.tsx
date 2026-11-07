import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Boton } from '../components/atoms/Boton';
import { Icono } from '../components/atoms/Icono';
import { Monto } from '../components/atoms/Monto';
import { Encabezado } from '../components/molecules/Encabezado';
import { TarjetaDeseo } from '../components/molecules/TarjetaDeseo';
import { HojaEstado } from '../components/organisms/HojaEstado';
import { HojaInferior } from '../components/organisms/HojaInferior';
import { HojaPreventa } from '../components/organisms/HojaPreventa';
import { usePreordi } from '../context/PreordiContext';
import { costoTotal } from '../lib/calculos';
import { aISO } from '../lib/fechas';
import { borrarImagen } from '../lib/imagenes';
import { etiquetaPreventa, infoPreventa, ordenarDeseos } from '../lib/preventa';
import { useAhora } from '../lib/useAhora';
import type { Preorden } from '../types';

type Hoja = { tipo: 'apartar' | 'fechas' | 'eliminar'; preorden: Preorden } | null;

// Especificación 8.3, en la dirección Vitrina (10.9). "Apartar" abre la misma hoja que en el Detalle (tipo de pago + depósito)
// y al confirmar lleva al Detalle de la preorden ya apartada. Los deseos cuya preventa cerró van aparte (5.9).
export function Deseos() {
  const { datos, dispatch } = usePreordi();
  const navigate = useNavigate();
  const ahora = useAhora();
  const hoy = aISO(ahora);
  const [hoja, setHoja] = useState<Hoja>(null);
  const cerrar = useCallback(() => setHoja(null), []);

  const deseos = datos.preordenes.filter((p) => p.estado === 'deseada');
  const { vigentes, cerrados } = ordenarDeseos(deseos, ahora);
  // Lo que ya cerró no se puede apartar, así que no cuenta en el total.
  const total = vigentes.reduce((suma, p) => suma + costoTotal(p), 0);
  const nombreCategoria = new Map(datos.categorias.map((c) => [c.id, c.nombre]));

  function alApartar(preorden: Preorden) {
    dispatch({ tipo: 'guardarPreorden', preorden });
    setHoja(null);
    navigate(`/preordenes/${preorden.id}`);
  }

  function guardar(preorden: Preorden) {
    dispatch({ tipo: 'guardarPreorden', preorden });
    setHoja(null);
  }

  function eliminar(preorden: Preorden) {
    if (preorden.imagenId) borrarImagen(preorden.imagenId).catch(() => {});
    dispatch({ tipo: 'eliminarPreorden', id: preorden.id });
    setHoja(null);
  }

  function tarjeta(p: Preorden) {
    const info = infoPreventa(p, ahora);
    return (
      <TarjetaDeseo preorden={p} categoria={nombreCategoria.get(p.categoriaId)} info={info} etiqueta={etiquetaPreventa(p, info, hoy)} />
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <Encabezado titulo="Deseos" />

      {deseos.length === 0 ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-3 px-8 pb-16 text-center">
          <p className="font-display text-xl font-bold">Tu lista de deseos está vacía</p>
          <p className="text-sm text-tinta-suave">Anotá lo que tenés en la mira y apartalo cuando estés lista.</p>
          <Link
            to="/preordenes/nueva?estado=deseada"
            className="mt-1 flex min-h-[50px] items-center rounded-2xl bg-principal px-6 font-bold text-principal-texto"
          >
            Agregar deseo
          </Link>
        </section>
      ) : (
        <div className="flex flex-col gap-4 px-5 pt-4 pb-2">
          <section aria-label="Total de deseos" className="flex flex-col gap-1">
            <span className="text-sm text-tinta-suave">Si apartaras todo</span>
            <Monto monto={total} className="font-display text-[44px] leading-none font-extrabold tracking-tight" />
            <span className="text-[13px] text-tinta-suave">
              {vigentes.length} {vigentes.length === 1 ? 'deseo' : 'deseos'} en la mira
            </span>
          </section>

          {vigentes.length === 0 ? (
            <p className="text-sm text-tinta-suave">No tenés deseos que se puedan apartar ahora.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
              {vigentes.map((p) => (
                <li key={p.id} className="flex flex-col gap-2">
                  {tarjeta(p)}
                  <Boton tamano="chico" className="w-full font-bold!" onClick={() => setHoja({ tipo: 'apartar', preorden: p })}>
                    Apartar
                  </Boton>
                </li>
              ))}
            </ul>
          )}

          {cerrados.length > 0 && (
            <details className="group mt-2 border-t border-borde-suave pt-3">
              <summary className="-mx-2 flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl px-2 hover:bg-superficie-suave [&::-webkit-details-marker]:hidden">
                <span className="flex flex-col">
                  <span className="text-sm font-bold">
                    Preventas cerradas ({cerrados.length})
                  </span>
                  <span className="text-[13px] text-tinta-suave">Se pasó la fecha para apartarlas</span>
                </span>
                <Icono nombre="abajo" tamano={20} className="shrink-0 text-tinta-suave transition-transform group-open:rotate-180" />
              </summary>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-5">
                {cerrados.map((p) => (
                  <li key={p.id} className="flex flex-col gap-2">
                    {tarjeta(p)}
                    <div className="flex gap-1.5">
                      <Boton
                        tamano="chico"
                        variante="discreto"
                        className="flex-1 px-2!"
                        onClick={() => setHoja({ tipo: 'fechas', preorden: p })}
                      >
                        Nueva fecha
                      </Boton>
                      <Boton
                        tamano="chico"
                        aria-label={`Eliminar ${p.nombre}`}
                        className="shrink-0 px-2.5!"
                        onClick={() => setHoja({ tipo: 'eliminar', preorden: p })}
                      >
                        <Icono nombre="basura" tamano={18} />
                      </Boton>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {hoja?.tipo === 'apartar' && <HojaEstado preorden={hoja.preorden} a="apartada" onGuardar={alApartar} onCerrar={cerrar} />}
      {hoja?.tipo === 'fechas' && <HojaPreventa preorden={hoja.preorden} onGuardar={guardar} onCerrar={cerrar} />}
      {hoja?.tipo === 'eliminar' && (
        <HojaInferior titulo="¿Eliminar este deseo?" subtitulo={hoja.preorden.nombre} onCerrar={cerrar}>
          <p className="text-[15px] leading-relaxed text-tinta-suave">
            La preventa ya cerró. Si la tienda abre otra ronda, podés usar "Nueva fecha" en vez de eliminarlo. No se puede deshacer.
          </p>
          <div className="flex gap-2.5">
            <Boton className="flex-1" onClick={cerrar}>
              Volver
            </Boton>
            <Boton variante="principal" className="flex-1" onClick={() => eliminar(hoja.preorden)}>
              Eliminar
            </Boton>
          </div>
        </HojaInferior>
      )}
    </main>
  );
}
