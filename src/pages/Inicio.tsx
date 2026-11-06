import { Link } from 'react-router';
import { Icono } from '../components/atoms/Icono';
import { Monto } from '../components/atoms/Monto';
import { TituloEtiqueta } from '../components/atoms/TituloEtiqueta';
import { FilaPreorden } from '../components/molecules/FilaPreorden';
import { TarjetaVitrina } from '../components/molecules/TarjetaVitrina';
import { usePreordi } from '../context/PreordiContext';
import { saldoPendiente, totales } from '../lib/calculos';
import { formatearMonto } from '../lib/dinero';
import { MESES, formatearFechaEstimada, hoy as fechaDeHoy } from '../lib/fechas';
import { resumenInicio, saldoPorMes } from '../lib/inicio';
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
  const { datos } = usePreordi();
  const hoy = fechaDeHoy();
  const t = totales(datos.preordenes);
  const r = resumenInicio(datos.preordenes, hoy);
  const nombreTienda = new Map(datos.tiendas.map((x) => [x.id, x.nombre]));
  const sinNada = datos.preordenes.length === 0;

  const meses = saldoPorMes(datos.preordenes, hoy);
  const maximoMes = Math.max(1, ...meses.map((m) => m.saldo));
  const anioHoy = hoy.slice(0, 4);
  /** "nov" (y el año abajo solo si no es este año); "Sin fecha" para las que no tienen. */
  const etiquetaMes = (clave: string) =>
    clave === 'sin_fecha'
      ? { nombre: 'Sin fecha', anio: '' }
      : { nombre: MESES[Number(clave.slice(5, 7)) - 1], anio: clave.slice(0, 4) === anioHoy ? '' : clave.slice(0, 4) };

  return (
    <main className="flex flex-col gap-6 pt-5 pb-2">
      <header className="flex items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-[9px] bg-naranja-500 text-marino-500">
            <Icono nombre="caja" tamano={19} grosor={2.2} />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">Preordi</span>
        </div>
        <Link to="/config" aria-label="Configuración" className="-mr-2 flex size-11 items-center justify-center rounded-full">
          <Icono nombre="ajustes" tamano={22} />
        </Link>
      </header>

      {!sinNada && (
        <section aria-labelledby="titulo-por-mes" className="flex flex-col gap-3 px-5">
          <TituloEtiqueta id="titulo-por-mes" etiqueta="Por pagar" acento="cada mes" />
          {meses.length === 0 ? (
            <p className="text-sm text-tinta-suave">Estás al día: no tenés nada por pagar.</p>
          ) : (
            <>
              <ol className="carrusel -mx-5 flex gap-2.5 overflow-x-auto px-5">
                {meses.map((m, i) => {
                  const { nombre, anio } = etiquetaMes(m.clave);
                  return (
                    <li
                      key={m.clave}
                      aria-label={`${nombre}${anio ? ` ${anio}` : ''}: ${formatearMonto(m.saldo)}, ${m.cantidad} ${m.cantidad === 1 ? 'preorden' : 'preórdenes'}`}
                      className="flex h-[168px] min-w-[60px] flex-1 flex-col items-center justify-end gap-1.5"
                    >
                      <Monto monto={m.saldo} className="font-display text-[13px] font-extrabold whitespace-nowrap" />
                      <span
                        aria-hidden="true"
                        className={`w-full rounded-t-[10px] rounded-b-md ${i === 0 ? 'bg-naranja-500' : 'bg-superficie-suave'}`}
                        style={{ height: `${Math.max(6, Math.round((m.saldo / maximoMes) * 100))}px` }}
                      />
                      <span aria-hidden="true" className="flex flex-col items-center leading-tight">
                        <span className={`text-xs ${i === 0 ? 'font-bold text-tinta' : 'text-tinta-suave'}`}>{nombre}</span>
                        <span className="h-3.5 text-[10.5px] text-tinta-tenue">{anio}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              <div className="flex items-baseline justify-between border-t border-borde-suave pt-3">
                <span className="text-sm text-tinta-suave">Total pendiente</span>
                <Monto monto={t.totalPendiente} className="font-display text-2xl leading-none font-extrabold" />
              </div>
            </>
          )}
        </section>
      )}

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
    </main>
  );
}
