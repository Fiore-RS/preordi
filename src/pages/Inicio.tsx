import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Icono } from '../components/atoms/Icono';
import { Monto } from '../components/atoms/Monto';
import { TituloEtiqueta } from '../components/atoms/TituloEtiqueta';
import { FilaPreorden } from '../components/molecules/FilaPreorden';
import { FilaSaldoMes } from '../components/molecules/FilaSaldoMes';
import { TarjetaVitrina } from '../components/molecules/TarjetaVitrina';
import { AvisoPreventas } from '../components/organisms/AvisoPreventas';
import { AvisoRespaldo } from '../components/organisms/AvisoRespaldo';
import { HojaEstado } from '../components/organisms/HojaEstado';
import { usePreordi } from '../context/PreordiContext';
import { saldoPendiente, totales } from '../lib/calculos';
import { formatearMonto } from '../lib/dinero';
import { aISO, formatearFechaEstimada } from '../lib/fechas';
import { resumenInicio, saldoPorMes } from '../lib/inicio';
import { avisosPreventa } from '../lib/preventa';
import { useAhora } from '../lib/useAhora';
import type { Preorden } from '../types';

interface PropsAlerta {
  a: string;
  titulo: string;
  detalle: string;
}

function Alerta({ a, titulo, detalle }: PropsAlerta) {
  return (
    <Link
      to={a}
      className="flex items-center gap-3 rounded-[14px] bg-acento-tenue px-3.5 py-3 text-acento-tenue-texto"
    >
      <Icono nombre="alerta" tamano={22} className="shrink-0 text-acento-texto" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-bold">{titulo}</span>
        <span className="truncate text-[13px]">{detalle}</span>
      </span>
      <Icono nombre="adelante" tamano={18} className="shrink-0" />
    </Link>
  );
}

/** Con una sola preorden, la alerta lleva directo a ella; con varias, a la lista. */
const destino = (lista: Preorden[], listaUrl: string) => (lista.length === 1 ? `/preordenes/${lista[0].id}` : listaUrl);

const nombres = (lista: Preorden[]) =>
  lista.length <= 2 ? lista.map((p) => p.nombre).join(' y ') : `${lista[0].nombre}, ${lista[1].nombre} y ${lista.length - 2} más`;

// Especificación 8.1, con la dirección Vitrina de 10.9.
export function Inicio() {
  const { datos, dispatch } = usePreordi();
  const navigate = useNavigate();
  const ahora = useAhora();
  const hoy = aISO(ahora);
  const [apartando, setApartando] = useState<Preorden | null>(null);
  const cerrarHoja = useCallback(() => setApartando(null), []);
  const avisos = avisosPreventa(datos.preordenes, ahora);
  const linkTienda = new Map(datos.tiendas.map((x) => [x.id, x.link]));
  const linkDe = (p: Preorden) => p.link || (p.tiendaId ? linkTienda.get(p.tiendaId) : undefined) || undefined;

  function alApartar(preorden: Preorden) {
    dispatch({ tipo: 'guardarPreorden', preorden });
    setApartando(null);
    navigate(`/preordenes/${preorden.id}`);
  }
  const t = totales(datos.preordenes);
  const r = resumenInicio(datos.preordenes, hoy);
  const nombreTienda = new Map(datos.tiendas.map((x) => [x.id, x.nombre]));
  const sinNada = datos.preordenes.length === 0;

  const meses = saldoPorMes(datos.preordenes, hoy);
  const maximoMes = Math.max(1, ...meses.map((m) => m.saldo));

  return (
    <main className="flex flex-col gap-6 pt-5 pb-2">
      <header className="flex items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-8" />
          <span className="font-display text-xl font-extrabold tracking-tight">Preordi</span>
        </div>
        <Link to="/config" aria-label="Configuración" className="-mr-2 flex size-11 items-center justify-center rounded-full">
          <Icono nombre="ajustes" tamano={22} />
        </Link>
      </header>

      {!sinNada && (
        <section aria-labelledby="titulo-por-mes" className="flex flex-col gap-3 px-5">
          <div className="flex items-end justify-between gap-3">
            <TituloEtiqueta id="titulo-por-mes" etiqueta="Por pagar" acento="cada mes" />
            {meses.length > 0 && (
              <span className="flex flex-col items-end gap-0.5">
                <span className="text-[11px] text-tinta-suave">Total</span>
                <Monto monto={t.totalPendiente} className="font-display text-[22px] leading-none font-extrabold" />
              </span>
            )}
          </div>
          {meses.length === 0 ? (
            <p className="text-sm text-tinta-suave">Estás al día: no tenés nada por pagar.</p>
          ) : (
            <>
              {/* Hasta 4 meses; el resto (y qué preórdenes suman en cada uno) en la pantalla Por pagar. */}
              <ul className="flex flex-col gap-1">
                {meses.slice(0, 4).map((m, i) => (
                  <li key={m.clave}>
                    <FilaSaldoMes mes={m} hoy={hoy} maximo={maximoMes} destacado={i === 0} />
                  </li>
                ))}
              </ul>
              <Link
                to="/por-pagar"
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-superficie-suave text-sm font-bold hover:bg-borde-suave"
              >
                Ver detalles
                <Icono nombre="adelante" tamano={16} grosor={2.4} />
              </Link>
            </>
          )}
        </section>
      )}

      <AvisoPreventas avisos={avisos} hoy={hoy} linkDe={linkDe} onApartar={setApartando} />
      <AvisoRespaldo hoy={hoy} />

      {(r.vencidas.length > 0 || r.recibidasConSaldo.length > 0) && (
        <div className="flex flex-col gap-2 px-5">
          {r.vencidas.length > 0 && (
            <Alerta
              a={destino(r.vencidas, '/preordenes')}
              titulo={r.vencidas.length === 1 ? '1 preorden vencida' : `${r.vencidas.length} preórdenes vencidas`}
              detalle={
                r.vencidas.length === 1
                  ? `${r.vencidas[0].nombre} · esperada en ${formatearFechaEstimada(r.vencidas[0].fechaEstimada)}`
                  : nombres(r.vencidas)
              }
            />
          )}
          {r.recibidasConSaldo.length > 0 && (
            <Alerta
              a={destino(r.recibidasConSaldo, '/preordenes?estado=todas&orden=saldo')}
              titulo={r.recibidasConSaldo.length === 1 ? '1 recibida con saldo' : `${r.recibidasConSaldo.length} recibidas con saldo`}
              detalle={
                r.recibidasConSaldo.length === 1
                  ? `${r.recibidasConSaldo[0].nombre} · faltan ${formatearMonto(saldoPendiente(r.recibidasConSaldo[0]))}`
                  : nombres(r.recibidasConSaldo)
              }
            />
          )}
        </div>
      )}

      {sinNada ? (
        <section className="flex flex-col items-center gap-3 px-10 py-8 text-center">
          <p className="font-display text-xl font-bold">Todavía no hay preórdenes</p>
          <p className="text-sm text-tinta-suave">Agregá lo que ya apartaste o lo que tenés en la mira.</p>
          <Link
            to="/preordenes/nueva"
            className="mt-1 flex min-h-[50px] items-center rounded-2xl bg-principal px-6 font-bold text-principal-texto"
          >
            Agregar preorden
          </Link>
        </section>
      ) : (
        <>
          <section aria-labelledby="titulo-proximas" className="flex flex-col gap-3">
            <TituloEtiqueta id="titulo-proximas" etiqueta="Próximas" acento="en llegar" className="px-5" />

            {r.totalProximas === 0 ? (
              <p className="mx-5 text-sm text-tinta-suave">
                {r.vencidas.length > 0 ? 'Todo lo que esperás ya está atrasado.' : 'No tenés nada en camino por ahora.'}
              </p>
            ) : (
              <>
                <ul className="carrusel flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1">
                  {r.destacadas.map((p) => (
                    <li key={p.id} className="flex">
                      <TarjetaVitrina preorden={p} />
                    </li>
                  ))}
                </ul>

                {r.masAdelante.length > 0 && (
                  <div className="flex flex-col px-5">
                    <h3 className="mb-0.5 font-sans text-[13px] font-bold text-tinta-suave">Más adelante</h3>
                    <ul className="flex flex-col divide-y divide-borde-suave">
                      {r.masAdelante.map((p) => (
                        <li key={p.id}>
                          <FilaPreorden preorden={p} tienda={p.tiendaId ? nombreTienda.get(p.tiendaId) : undefined} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </>
            )}

            {/* Siempre visible, aunque todas quepan en las tarjetas grandes o no haya ninguna por llegar */}
            <Link
              to="/preordenes"
              className="mx-5 flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-superficie-suave text-sm font-bold hover:bg-borde-suave"
            >
              Ver todas
              <Icono nombre="adelante" tamano={16} grosor={2.4} />
            </Link>
          </section>

          {r.porPagar.length > 0 && (
            <section aria-labelledby="titulo-por-pagar" className="flex flex-col gap-1 px-5">
              <TituloEtiqueta id="titulo-por-pagar" etiqueta="También" acento="por pagar" className="mb-1" />
              <ul className="flex flex-col">
                {r.porPagar.map((p) => (
                  <li key={p.id}>
                    <FilaPreorden preorden={p} tienda={p.tiendaId ? nombreTienda.get(p.tiendaId) : undefined} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {apartando && <HojaEstado preorden={apartando} a="apartada" onGuardar={alApartar} onCerrar={cerrarHoja} />}
    </main>
  );
}
