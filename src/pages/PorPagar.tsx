import { useState } from 'react';
import { Icono } from '../components/atoms/Icono';
import { Monto } from '../components/atoms/Monto';
import { Encabezado } from '../components/molecules/Encabezado';
import { FilaPreorden } from '../components/molecules/FilaPreorden';
import { FilaSaldoMes } from '../components/molecules/FilaSaldoMes';
import { usePreordi } from '../context/PreordiContext';
import { totales, vencida } from '../lib/calculos';
import { aISO, formatearFechaEstimada } from '../lib/fechas';
import { saldoPorMes } from '../lib/inicio';
import { useAhora } from '../lib/useAhora';
import type { Preorden } from '../types';

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Por pagar cada mes, completo (se abre con "Ver detalles" desde Inicio).
 * Cada mes se despliega para ver qué preórdenes suman ahí; el primero viene abierto.
 */
export function PorPagar() {
  const { datos } = usePreordi();
  const hoy = aISO(useAhora());
  const meses = saldoPorMes(datos.preordenes, hoy);
  const total = totales(datos.preordenes).totalPendiente;
  const maximo = Math.max(1, ...meses.map((m) => m.saldo));
  const cantidad = meses.reduce((s, m) => s + m.cantidad, 0);
  const nombreTienda = new Map(datos.tiendas.map((x) => [x.id, x.nombre]));
  // undefined = todavía no tocó nada: se abre el primer mes (aunque los datos carguen después).
  const [abierto, setAbierto] = useState<string | null | undefined>(undefined);

  /** Explica por qué una preorden cae en el mes de hoy aunque no llegue este mes. */
  const avisoDe = (p: Preorden): string | undefined => {
    if (p.estado === 'recibida') return 'Ya la recibiste · falta pagar';
    if (vencida(p, hoy)) return `Atrasada · se esperaba en ${formatearFechaEstimada(p.fechaEstimada)}`;
    return undefined;
  };

  return (
    <main className="flex flex-1 flex-col">
      <Encabezado titulo="Por pagar cada mes" volverA="/" />

      <div className="flex flex-col gap-5 px-5 pt-2 pb-10">
        {meses.length === 0 ? (
          <p className="text-sm text-tinta-suave">Estás al día: no tenés nada por pagar.</p>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-tinta-suave">Total pendiente</span>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <Monto monto={total} className="font-display text-[40px] leading-none font-extrabold" />
                <span className="text-sm text-tinta-suave">
                  en {plural(meses.length, 'mes', 'meses')} · {plural(cantidad, 'preorden', 'preórdenes')}
                </span>
              </div>
            </div>

            <ul className="flex flex-col">
              {meses.map((m, i) => {
                const estaAbierto = abierto === undefined ? i === 0 : abierto === m.clave;
                const idPanel = `mes-${m.clave}`;
                return (
                  <li key={m.clave} className="border-b border-borde-suave">
                    <button
                      type="button"
                      aria-expanded={estaAbierto}
                      aria-controls={idPanel}
                      onClick={() => setAbierto(estaAbierto ? null : m.clave)}
                      className="flex min-h-[52px] w-full items-center gap-3 py-1.5 text-left"
                    >
                      <FilaSaldoMes mes={m} hoy={hoy} maximo={maximo} destacado={i === 0} conCantidad className="flex-1" />
                      <Icono
                        nombre="adelante"
                        tamano={18}
                        grosor={2.2}
                        className={`shrink-0 text-tinta-suave transition-transform duration-300 ease-out ${estaAbierto ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {/*
                      Siempre montado para poder animar: la fila de la grilla pasa de 0fr a 1fr (alto real del
                      contenido) y a la vez aparece. Cerrado queda inert, así Tab no entra a sus links.
                    */}
                    <div
                      id={idPanel}
                      inert={!estaAbierto}
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                        estaAbierto ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <ul className="mb-2.5 flex flex-col rounded-2xl border border-borde-suave bg-superficie px-3 py-1">
                          {m.preordenes.map((p) => {
                            const aviso = avisoDe(p);
                            return (
                              <li key={p.id}>
                                <FilaPreorden
                                  preorden={p}
                                  tienda={p.tiendaId ? nombreTienda.get(p.tiendaId) : undefined}
                                  detalle={aviso}
                                  alerta={aviso !== undefined}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
