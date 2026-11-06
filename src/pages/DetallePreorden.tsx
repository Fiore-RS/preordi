import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Badge, BadgePago, BadgeVencida } from '../components/atoms/Badge';
import { Boton } from '../components/atoms/Boton';
import { Icono } from '../components/atoms/Icono';
import { Monto } from '../components/atoms/Monto';
import { PortadaSinFoto } from '../components/atoms/PortadaSinFoto';
import { TituloEtiqueta } from '../components/atoms/TituloEtiqueta';
import { Encabezado } from '../components/molecules/Encabezado';
import { HojaEstado } from '../components/organisms/HojaEstado';
import { HojaFecha } from '../components/organisms/HojaFecha';
import { HojaInferior } from '../components/organisms/HojaInferior';
import { HojaPago } from '../components/organisms/HojaPago';
import { VisorImagen } from '../components/organisms/VisorImagen';
import { usePreordi } from '../context/PreordiContext';
import { NOMBRE_ESTADO, NOMBRE_MOVIMIENTO, accionPrincipal, textoTransicion } from '../lib/acciones';
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
import { borrarImagen } from '../lib/imagenes';
import { useImagen } from '../lib/useImagen';
import type { Estado, Pago, Preorden } from '../types';

type Hoja =
  | { tipo: 'pago'; pago?: Pago }
  | { tipo: 'fecha' }
  | { tipo: 'estado'; a: Estado }
  | { tipo: 'acciones' }
  | { tipo: 'eliminar' }
  | { tipo: 'imagen' }
  | null;

const PASOS: { estado: Estado; campo: 'fechaApartada' | 'fechaEnviada' | 'fechaRecibida' }[] = [
  { estado: 'apartada', campo: 'fechaApartada' },
  { estado: 'en_camino', campo: 'fechaEnviada' },
  { estado: 'recibida', campo: 'fechaRecibida' },
];

const NOMBRE_PASO: Record<string, string> = { apartada: 'Apartada', en_camino: 'En camino', recibida: 'Recibida' };

// Especificación 8.4, con las hojas de 8.6 (pago) y 8.7 (fecha), en la dirección Vitrina (10.9).
export function DetallePreorden() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { datos, dispatch } = usePreordi();
  const [hoja, setHoja] = useState<Hoja>(null);
  const cerrar = useCallback(() => setHoja(null), []);

  const p = datos.preordenes.find((x) => x.id === id);
  const urlImagen = useImagen(p?.imagenId ?? null);

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
    if (preorden.imagenId) borrarImagen(preorden.imagenId).catch(() => {});
    dispatch({ tipo: 'eliminarPreorden', id: preorden.id });
    navigate(esDeseo ? '/deseos' : '/preordenes', { replace: true });
  }

  const vencidaHoy = vencida(preorden, hoy);
  const vecesReprogramada = reprogramaciones(preorden);
  const BOTON_FLOTANTE = 'flex size-11 items-center justify-center rounded-xl bg-papel text-marino-500 shadow-[0_6px_16px_-8px_rgba(13,23,38,0.6)]';

  return (
    <main className="flex flex-1 flex-col">
      <div className="relative h-[340px] shrink-0 overflow-hidden rounded-b-[38px] bg-marino-500">
        {urlImagen ? (
          <button
            type="button"
            aria-label="Ver imagen completa"
            onClick={() => setHoja({ tipo: 'imagen' })}
            className="block size-full"
          >
            <img src={urlImagen} alt={preorden.nombre} className="size-full object-cover" />
          </button>
        ) : (
          <PortadaSinFoto nombre={preorden.nombre} estado={preorden.estado} className="pt-14 text-[230px]" />
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-marino-900/35 to-transparent" />
        <div className="absolute inset-x-4 top-4 flex justify-between">
          <button type="button" aria-label="Volver" onClick={volver} className={BOTON_FLOTANTE}>
            <Icono nombre="atras" tamano={22} grosor={2.2} />
          </button>
          <button type="button" aria-label="Más acciones" onClick={() => setHoja({ tipo: 'acciones' })} className={BOTON_FLOTANTE}>
            <Icono nombre="puntos" tamano={22} grosor={2.2} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-7 px-5 pt-5 pb-8">
        <div className="flex flex-col gap-2">
          <TituloEtiqueta
            como="p"
            etiqueta={categoria?.nombre ?? 'Preorden'}
            acento={NOMBRE_ESTADO[preorden.estado].toLowerCase()}
          />
          <h1 className="text-[28px] leading-[1.1] font-extrabold tracking-tight">{preorden.nombre}</h1>
          {(tienda || preorden.link) && (
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
          )}
          <Monto monto={costoTotal(preorden)} className="mt-1 font-display text-[40px] leading-none font-extrabold tracking-tight" />
          {esDeseo && <span className="text-[13px] text-tinta-suave">Lo que costaría si la apartás</span>}
        </div>

        {preorden.estado === 'cancelada' && preorden.fechaCancelada && (
          <p className="rounded-xl bg-superficie-suave px-3.5 py-3 text-sm text-tinta">
            Cancelada el {formatearFecha(preorden.fechaCancelada)}.
            {totalPagado(preorden) > 0 && ` Quedan ${formatearMonto(totalPagado(preorden))} pagados sin reembolsar.`}
          </p>
        )}
        {recibidaConSaldo(preorden) && (
          <p className="flex items-start gap-2 rounded-xl bg-acento-tenue px-3.5 py-3 text-sm text-acento-tenue-texto">
            <Icono nombre="alerta" tamano={18} grosor={2} className="mt-px shrink-0 text-acento-texto" />
            Ya la recibiste, pero todavía queda saldo por pagar.
          </p>
        )}

        <section aria-label="Pagos y llegada" className="-mt-2 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            {!esDeseo && (
              <>
                <div className="flex flex-col">
                  <span className="text-xs text-tinta-suave">Pagado</span>
                  <Monto monto={totalPagado(preorden)} className="font-display text-lg font-extrabold" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-tinta-suave">Saldo</span>
                  <Monto
                    monto={saldo}
                    className={`font-display text-lg font-extrabold ${saldo > 0 ? 'text-acento-texto' : ''}`}
                  />
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => setHoja({ tipo: 'fecha' })}
              aria-label={`Llega ${formatearFechaEstimada(preorden.fechaEstimada)}. Cambiar fecha estimada`}
              className="-m-1.5 flex flex-col items-start rounded-xl p-1.5 text-left hover:bg-superficie-suave"
            >
              <span className="flex items-center gap-1 text-xs text-tinta-suave">
                Llega <Icono nombre="editar" tamano={12} grosor={2.2} />
              </span>
              <span className={`font-display text-lg font-extrabold ${vencidaHoy ? 'text-acento-texto' : ''}`}>
                {formatearFechaEstimada(preorden.fechaEstimada)}
              </span>
            </button>
          </div>
          {!esDeseo && (
            <div className="h-2 overflow-hidden rounded-full bg-borde-suave">
              <div
                className="h-2 rounded-full bg-naranja-500"
                style={{ width: `${Math.round(progresoPago(preorden) * 100)}%` }}
              />
            </div>
          )}
          {(vencidaHoy || vecesReprogramada > 0 || !esDeseo) && (
            <div className="flex flex-wrap gap-1.5">
              {!esDeseo && <BadgePago estadoPago={estadoPago(preorden)} />}
              {vencidaHoy && <BadgeVencida />}
              {vecesReprogramada > 0 && (
                <Badge tono="gris">
                  Reprogramada {vecesReprogramada} {vecesReprogramada === 1 ? 'vez' : 'veces'}
                </Badge>
              )}
            </div>
          )}
          {preorden.historialFechas.length > 0 && (
            <ul className="flex flex-col gap-2 border-l-2 border-borde pl-3 text-[13px]">
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

        {preorden.costosExtra.length > 0 && (
          <section aria-labelledby="titulo-costos" className="flex flex-col gap-2">
            <TituloEtiqueta id="titulo-costos" etiqueta="Precios" acento="del pedido" />
            <dl className="flex flex-col text-sm">
              <div className="flex justify-between border-b border-borde-suave py-2">
                <dt className="text-tinta-suave">Precio</dt>
                <dd className="tabular-nums">{formatearMonto(preorden.precio)}</dd>
              </div>
              {preorden.costosExtra.map((c) => (
                <div key={c.id} className="flex justify-between border-b border-borde-suave py-2">
                  <dt className="text-tinta-suave">{c.concepto}</dt>
                  <dd className="tabular-nums">{formatearMonto(c.monto)}</dd>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold">
                <dt>Costo total</dt>
                <dd className="tabular-nums">{formatearMonto(costoTotal(preorden))}</dd>
              </div>
            </dl>
          </section>
        )}

        {!esDeseo && preorden.estado !== 'cancelada' && (
          <section aria-labelledby="titulo-camino" className="flex flex-col gap-3">
            <TituloEtiqueta id="titulo-camino" etiqueta="Camino" acento="a casa" />
            <ol className="flex flex-col">
              {PASOS.map((paso, i) => {
                const fecha = preorden[paso.campo];
                const ultimo = i === PASOS.length - 1;
                return (
                  <li key={paso.estado} className="flex gap-3">
                    <span className="flex flex-col items-center">
                      {fecha ? (
                        <span className="flex size-6 items-center justify-center rounded-lg bg-naranja-500 text-marino-500">
                          <Icono nombre="check" tamano={14} grosor={2.6} />
                        </span>
                      ) : (
                        <span className="size-6 rounded-lg border-2 border-borde bg-fondo" />
                      )}
                      {!ultimo && (
                        <span className={`h-6 w-0.5 ${preorden[PASOS[i + 1].campo] ? 'bg-naranja-500' : 'bg-borde'}`} />
                      )}
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
          <section aria-labelledby="titulo-pagos" className="flex flex-col gap-1">
            <TituloEtiqueta id="titulo-pagos" etiqueta="Registro" acento="de pagos" className="mb-1" />
            {pagos.length === 0 ? (
              <p className="py-2 text-sm text-tinta-suave">Todavía no hay pagos registrados.</p>
            ) : (
              <ul className="flex flex-col">
                {pagos.map((pago) => (
                  <li key={pago.id} className="border-b border-borde-suave last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setHoja({ tipo: 'pago', pago })}
                      aria-label={`Editar ${NOMBRE_MOVIMIENTO[pago.tipo].toLowerCase()} del ${formatearFecha(pago.fecha)}`}
                      className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-xl px-2 py-3 text-left hover:bg-superficie-suave"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="text-sm font-medium">{NOMBRE_MOVIMIENTO[pago.tipo]}</span>
                        <span className="truncate text-[13px] text-tinta-suave">
                          {formatearFecha(pago.fecha)}
                          {pago.nota && ` · ${pago.nota}`}
                        </span>
                      </span>
                      <span className="font-display text-base font-extrabold whitespace-nowrap tabular-nums">
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
            <TituloEtiqueta id="titulo-notas" etiqueta="Notas" acento="para mí" />
            <p className="text-sm leading-relaxed whitespace-pre-line text-tinta-suave">{preorden.notas}</p>
          </section>
        )}
      </div>

      {(!esDeseo || siguiente) && (
        <div className="sticky bottom-0 mt-auto flex gap-2.5 border-t border-borde-suave bg-fondo px-5 pt-3.5 pb-[max(1.375rem,env(safe-area-inset-bottom))]">
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
      {hoja?.tipo === 'imagen' && urlImagen && (
        <VisorImagen url={urlImagen} alt={preorden.nombre} onCerrar={cerrar} />
      )}
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
