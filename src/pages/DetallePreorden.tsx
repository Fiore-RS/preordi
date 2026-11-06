import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Badge, BadgeEstado, BadgePago, BadgeVencida } from '../components/atoms/Badge';
import { Boton } from '../components/atoms/Boton';
import { Icono } from '../components/atoms/Icono';
import { Encabezado } from '../components/molecules/Encabezado';
import { HojaEstado } from '../components/organisms/HojaEstado';
import { HojaFecha } from '../components/organisms/HojaFecha';
import { HojaInferior } from '../components/organisms/HojaInferior';
import { HojaPago } from '../components/organisms/HojaPago';
import { usePreordi } from '../context/PreordiContext';
import { NOMBRE_MOVIMIENTO, accionPrincipal, textoTransicion } from '../lib/acciones';
import {
  costoTotal,
  estadoPago,
  progresoPago,
  recibidaConSaldo,
  reprogramaciones,
  saldoPendiente,
  totalPagado,
  vencida,
} from '../lib/calculos';
import { formatearMonto } from '../lib/dinero';
import { TRANSICIONES } from '../lib/estados';
import { formatearFecha, formatearFechaEstimada, hoy as fechaDeHoy } from '../lib/fechas';
import type { Estado, Pago, Preorden } from '../types';

type Hoja =
  | { tipo: 'pago'; pago?: Pago }
  | { tipo: 'fecha' }
  | { tipo: 'estado'; a: Estado }
  | { tipo: 'acciones' }
  | { tipo: 'eliminar' }
  | null;

const PASOS: { estado: Estado; campo: 'fechaApartada' | 'fechaEnviada' | 'fechaRecibida' }[] = [
  { estado: 'apartada', campo: 'fechaApartada' },
  { estado: 'en_camino', campo: 'fechaEnviada' },
  { estado: 'recibida', campo: 'fechaRecibida' },
];

const NOMBRE_PASO: Record<string, string> = { apartada: 'Apartada', en_camino: 'En camino', recibida: 'Recibida' };

// Especificación 8.4, con las hojas de 8.6 (pago) y 8.7 (fecha).
export function DetallePreorden() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { datos, dispatch } = usePreordi();
  const [hoja, setHoja] = useState<Hoja>(null);
  const cerrar = useCallback(() => setHoja(null), []);

  const p = datos.preordenes.find((x) => x.id === id);

  if (!p) {
    return (
      <main className="flex flex-col">
        <Encabezado titulo="Detalle" volverA="/preordenes" />
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="font-display text-xl font-bold">No encontramos esta preorden</p>
          <p className="text-sm text-tinta-suave">Puede que la hayas eliminado.</p>
          <Link to="/preordenes" className="font-bold text-acento-texto underline underline-offset-4">
            Ver mis preórdenes
          </Link>
        </div>
      </main>
    );
  }

  const preorden = p;
  const hoy = fechaDeHoy();
  const categoria = datos.categorias.find((c) => c.id === preorden.categoriaId);
  const tienda = datos.tiendas.find((t) => t.id === preorden.tiendaId);
  const esDeseo = preorden.estado === 'deseada';
  const siguiente = accionPrincipal(preorden);
  const otrasTransiciones = TRANSICIONES[preorden.estado].filter((e) => e !== siguiente);
  const pagos = [...preorden.pagos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const saldo = saldoPendiente(preorden);

  function guardar(actualizada: Preorden) {
    dispatch({ tipo: 'guardarPreorden', preorden: actualizada });
    setHoja(null);
  }

  /** Vuelve a la pantalla anterior (con sus filtros); si se abrió directo, a la lista. */
  function volver() {
    if (location.key !== 'default') navigate(-1);
    else navigate(esDeseo ? '/deseos' : '/preordenes');
  }

  function eliminar() {
    dispatch({ tipo: 'eliminarPreorden', id: preorden.id });
    navigate(esDeseo ? '/deseos' : '/preordenes', { replace: true });
  }

  return (
    <main className="flex flex-1 flex-col">
      {/* Imagen (fase 6): por ahora, un marcador con el color del estado */}
      <div className="relative flex h-56 shrink-0 flex-col items-center justify-center gap-2 bg-tono-naranja text-tono-naranja-texto">
        <Icono nombre="imagen" tamano={44} grosor={1.4} />
        <div className="absolute inset-x-4 top-4 flex justify-between">
          <button
            type="button"
            aria-label="Volver"
            onClick={volver}
            className="flex size-11 items-center justify-center rounded-full bg-fondo text-tinta"
          >
            <Icono nombre="atras" tamano={22} grosor={2} />
          </button>
          <button
            type="button"
            aria-label="Más acciones"
            onClick={() => setHoja({ tipo: 'acciones' })}
            className="flex size-11 items-center justify-center rounded-full bg-fondo text-tinta"
          >
            <Icono nombre="puntos" tamano={22} grosor={2} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-5 pb-8">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            <BadgeEstado estado={preorden.estado} />
            {categoria && <Badge tono="gris">{categoria.nombre}</Badge>}
          </div>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">{preorden.nombre}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {tienda &&
              (tienda.link ? (
                <a href={tienda.link} target="_blank" rel="noreferrer" className="text-tinta-suave underline underline-offset-2">
                  {tienda.nombre}
                </a>
              ) : (
                <span className="text-tinta-suave">{tienda.nombre}</span>
              ))}
            {preorden.link && (
              <a
                href={preorden.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-medium text-acento-texto"
              >
                <Icono nombre="enlace" tamano={16} grosor={2} />
                Ver producto
              </a>
            )}
          </div>
        </div>

        {preorden.estado === 'cancelada' && preorden.fechaCancelada && (
          <p className="rounded-xl bg-superficie-suave px-3.5 py-3 text-sm text-tinta">
            Cancelada el {formatearFecha(preorden.fechaCancelada)}.
            {totalPagado(preorden) > 0 && ` Quedan ${formatearMonto(totalPagado(preorden))} pagados sin reembolsar.`}
          </p>
        )}
        {recibidaConSaldo(preorden) && (
          <p className="flex items-start gap-2 rounded-xl border border-acento-borde bg-acento-tenue px-3.5 py-3 text-sm text-acento-tenue-texto">
            <Icono nombre="alerta" tamano={18} grosor={2} className="mt-px shrink-0 text-acento-texto" />
            Ya la recibiste, pero todavía queda saldo por pagar.
          </p>
        )}

        <section aria-label="Dinero" className="flex flex-col gap-3 rounded-[18px] border border-borde-suave bg-superficie p-4">
          {esDeseo ? (
            <div className="flex flex-col">
              <span className="text-[13px] text-tinta-suave">Costo si la apartás</span>
              <span className="font-display text-2xl font-bold tabular-nums">{formatearMonto(costoTotal(preorden))}</span>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[13px] text-tinta-suave">Pagado</span>
                  <span className="font-display text-2xl font-bold tabular-nums">
                    {formatearMonto(totalPagado(preorden))}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[13px] text-tinta-suave">Saldo</span>
                  <span
                    className={`font-display text-2xl font-bold tabular-nums ${saldo > 0 ? 'text-acento-texto' : ''}`}
                  >
                    {formatearMonto(saldo)}
                  </span>
                </div>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-superficie-suave">
                <div
                  className="h-2.5 rounded-full bg-naranja-500"
                  style={{ width: `${Math.round(progresoPago(preorden) * 100)}%` }}
                />
              </div>
              <div className="flex">
                <BadgePago estadoPago={estadoPago(preorden)} />
              </div>
            </>
          )}
          <dl className="flex flex-col gap-1.5 border-t border-borde-suave pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-tinta-suave">Precio</dt>
              <dd className="tabular-nums">{formatearMonto(preorden.precio)}</dd>
            </div>
            {preorden.costosExtra.map((c) => (
              <div key={c.id} className="flex justify-between">
                <dt className="text-tinta-suave">{c.concepto}</dt>
                <dd className="tabular-nums">{formatearMonto(c.monto)}</dd>
              </div>
            ))}
            <div className="flex justify-between font-bold">
              <dt>Costo total</dt>
              <dd className="tabular-nums">{formatearMonto(costoTotal(preorden))}</dd>
            </div>
          </dl>
          {preorden.referenciaOriginal && (
            <p className="text-[13px] text-tinta-suave">Precio original: {preorden.referenciaOriginal}</p>
          )}
        </section>

        <section aria-label="Fecha estimada" className="flex flex-col gap-3 rounded-[18px] border border-borde-suave bg-superficie p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-superficie-suave">
              <Icono nombre="calendario" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[13px] text-tinta-suave">Llegada estimada</span>
              <span className="text-[17px] font-bold">{formatearFechaEstimada(preorden.fechaEstimada)}</span>
            </span>
            <Boton tamano="chico" onClick={() => setHoja({ tipo: 'fecha' })}>
              Cambiar
            </Boton>
          </div>
          {(vencida(preorden, hoy) || reprogramaciones(preorden) > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {vencida(preorden, hoy) && <BadgeVencida />}
              {reprogramaciones(preorden) > 0 && (
                <Badge tono="gris">
                  Reprogramada {reprogramaciones(preorden)} {reprogramaciones(preorden) === 1 ? 'vez' : 'veces'}
                </Badge>
              )}
            </div>
          )}
          {preorden.historialFechas.length > 0 && (
            <ul className="flex flex-col gap-2 rounded-xl bg-superficie-suave px-3 py-2.5 text-[13px]">
              {[...preorden.historialFechas].reverse().map((c) => (
                <li key={c.id} className="flex flex-col">
                  <span className="font-medium">
                    {formatearFechaEstimada(c.anterior)} → {formatearFechaEstimada(c.nueva)}
                  </span>
                  <span className="text-tinta-suave">
                    Anotado el {formatearFecha(c.registradoEl)}
                    {c.nota && ` · ${c.nota}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!esDeseo && preorden.estado !== 'cancelada' && (
          <section aria-labelledby="titulo-camino" className="flex flex-col gap-2.5">
            <h2 id="titulo-camino" className="text-lg font-bold">
              Camino
            </h2>
            <ol className="flex flex-col">
              {PASOS.map((paso, i) => {
                const fecha = preorden[paso.campo];
                const ultimo = i === PASOS.length - 1;
                return (
                  <li key={paso.estado} className="flex gap-3">
                    <span className="flex flex-col items-center">
                      {fecha ? (
                        <span className="flex size-6 items-center justify-center rounded-full bg-naranja-500 text-marino-500">
                          <Icono nombre="check" tamano={14} grosor={2.6} />
                        </span>
                      ) : (
                        <span className="size-6 rounded-full border-2 border-borde bg-fondo" />
                      )}
                      {!ultimo && <span className="h-6 w-0.5 bg-borde" />}
                    </span>
                    <span className="flex flex-1 justify-between pt-0.5 text-sm">
                      <span className={fecha ? 'font-bold' : 'text-tinta-suave'}>{NOMBRE_PASO[paso.estado]}</span>
                      <span className="text-tinta-suave">{fecha ? formatearFecha(fecha) : '—'}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {!esDeseo && (
          <section aria-labelledby="titulo-pagos" className="flex flex-col gap-2.5">
            <h2 id="titulo-pagos" className="text-lg font-bold">
              Pagos
            </h2>
            {pagos.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-borde px-4 py-4 text-sm text-tinta-suave">
                Todavía no hay pagos registrados.
              </p>
            ) : (
              <ul className="rounded-2xl border border-borde-suave bg-superficie">
                {pagos.map((pago) => (
                  <li key={pago.id} className="border-b border-borde-suave last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setHoja({ tipo: 'pago', pago })}
                      aria-label={`Editar ${NOMBRE_MOVIMIENTO[pago.tipo].toLowerCase()} del ${formatearFecha(pago.fecha)}`}
                      className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left hover:bg-superficie-suave/60"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="text-sm font-medium">{NOMBRE_MOVIMIENTO[pago.tipo]}</span>
                        <span className="truncate text-[13px] text-tinta-suave">
                          {formatearFecha(pago.fecha)}
                          {pago.nota && ` · ${pago.nota}`}
                        </span>
                      </span>
                      <span className="text-[15px] font-bold whitespace-nowrap tabular-nums">
                        {pago.tipo === 'reembolso' ? '−' : ''}
                        {formatearMonto(pago.monto)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {preorden.notas && (
          <section aria-labelledby="titulo-notas" className="flex flex-col gap-2">
            <h2 id="titulo-notas" className="text-lg font-bold">
              Notas
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-line text-tinta-suave">{preorden.notas}</p>
          </section>
        )}
      </div>

      {(!esDeseo || siguiente) && (
        <div className="sticky bottom-0 mt-auto flex gap-2.5 border-t border-borde bg-fondo px-5 pt-3.5 pb-[max(1.375rem,env(safe-area-inset-bottom))]">
          {!esDeseo && (
            <Boton className="flex-1" onClick={() => setHoja({ tipo: 'pago' })}>
              Registrar pago
            </Boton>
          )}
          {siguiente && (
            <Boton variante="principal" className="flex-[1.3]" onClick={() => setHoja({ tipo: 'estado', a: siguiente })}>
              {textoTransicion(preorden.estado, siguiente)}
            </Boton>
          )}
        </div>
      )}

      {hoja?.tipo === 'pago' && <HojaPago preorden={preorden} pago={hoja.pago} onGuardar={guardar} onCerrar={cerrar} />}
      {hoja?.tipo === 'fecha' && <HojaFecha preorden={preorden} onGuardar={guardar} onCerrar={cerrar} />}
      {hoja?.tipo === 'estado' && <HojaEstado preorden={preorden} a={hoja.a} onGuardar={guardar} onCerrar={cerrar} />}
      {hoja?.tipo === 'acciones' && (
        <HojaInferior titulo="Más acciones" subtitulo={preorden.nombre} onCerrar={cerrar}>
          <ul className="flex flex-col">
            <li>
              <Link
                to={`/preordenes/${preorden.id}/editar`}
                className="flex min-h-12 items-center gap-3 border-b border-borde-suave text-[15px] font-medium"
              >
                <Icono nombre="editar" />
                Editar datos
              </Link>
            </li>
            {otrasTransiciones.map((estado) => (
              <li key={estado}>
                <button
                  type="button"
                  onClick={() => setHoja({ tipo: 'estado', a: estado })}
                  className="flex min-h-12 w-full items-center gap-3 border-b border-borde-suave text-left text-[15px] font-medium"
                >
                  <Icono nombre={estado === 'cancelada' ? 'cerrar' : 'caja'} />
                  {textoTransicion(preorden.estado, estado)}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setHoja({ tipo: 'eliminar' })}
                className="flex min-h-12 w-full items-center gap-3 text-left text-[15px] font-bold text-acento-texto"
              >
                <Icono nombre="basura" />
                {esDeseo ? 'Eliminar deseo' : 'Eliminar preorden'}
              </button>
            </li>
          </ul>
        </HojaInferior>
      )}
      {hoja?.tipo === 'eliminar' && (
        <HojaInferior titulo={esDeseo ? '¿Eliminar este deseo?' : '¿Eliminar esta preorden?'} onCerrar={cerrar}>
          <p className="text-[15px] leading-relaxed text-tinta-suave">
            Se borra {preorden.nombre} con todos sus pagos y su historial. No se puede deshacer.
            {!esDeseo && ' Si solo la cancelaste, mejor usá "Cancelar preorden" para conservar el registro.'}
          </p>
          <div className="flex gap-2.5">
            <Boton className="flex-1" onClick={cerrar}>
              Volver
            </Boton>
            <Boton variante="principal" className="flex-1" onClick={eliminar}>
              Eliminar
            </Boton>
          </div>
        </HojaInferior>
      )}
    </main>
  );
}
