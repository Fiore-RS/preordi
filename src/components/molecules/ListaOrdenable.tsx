import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { moverA } from '../../lib/configuracion';
import type { ID } from '../../types';
import { Icono } from '../atoms/Icono';

interface Props<T extends { id: ID }> {
  items: T[];
  /** Nombre de cada elemento, para el lector de pantalla del agarre. */
  nombre: (item: T) => string;
  /** Se llama al soltar, con la lista ya en el orden nuevo. */
  onReordenar: (items: T[]) => void;
  /** Contenido de la fila (a la derecha del agarre). */
  children: (item: T) => ReactNode;
}

/** Lo que se ve mientras se arrastra: qué fila, a qué posición iría y cuánto se movió. */
interface Arrastre {
  desde: number;
  hacia: number;
  dy: number;
  alto: number;
}

/** Datos del gesto en curso (no causan render). */
interface Gesto {
  pointerId: number;
  desde: number;
  inicioY: number;
  ultimoY: number;
  inicioScroll: number;
  scroller: HTMLElement | null;
  /** Centro de cada fila al empezar, relativo a la lista. */
  centros: number[];
  topes: number[];
  altoLista: number;
  hacia: number;
  raf: number;
}

const MARGEN_AUTOSCROLL = 64;
const VELOCIDAD_MAX = 14;

function contenedorConScroll(el: HTMLElement | null): HTMLElement | null {
  for (let n = el?.parentElement; n; n = n.parentElement) {
    const { overflowY } = getComputedStyle(n);
    if (overflowY === 'auto' || overflowY === 'scroll') return n;
  }
  return null;
}

/**
 * Lista que se ordena arrastrando el agarre de la izquierda (Configuración).
 * Las demás filas se corren en vivo mientras se arrastra; al soltar se guarda el orden nuevo,
 * sin botón de guardar. Cerca del borde de la pantalla hace scroll solo.
 * Con teclado: foco en el agarre y flechas arriba/abajo.
 */
export function ListaOrdenable<T extends { id: ID }>({ items, nombre, onReordenar, children }: Props<T>) {
  const lista = useRef<HTMLUListElement>(null);
  const gesto = useRef<Gesto | null>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const enfocar = useRef<ID | null>(null);
  const ordenable = items.length > 1;

  // Después de mover con el teclado, el foco vuelve al agarre de la misma fila.
  useEffect(() => {
    if (!enfocar.current) return;
    lista.current?.querySelector<HTMLElement>(`[data-agarre="${CSS.escape(enfocar.current)}"]`)?.focus();
    enfocar.current = null;
  }, [items]);

  useEffect(() => () => cancelAnimationFrame(gesto.current?.raf ?? 0), []);

  function calcular(g: Gesto) {
    const scroll = g.scroller ? g.scroller.scrollTop - g.inicioScroll : 0;
    const alto = g.topes[g.desde + 1] !== undefined ? g.topes[g.desde + 1] - g.topes[g.desde] : g.altoLista - g.topes[g.desde];
    // La fila no se sale de la lista.
    const min = -g.topes[g.desde];
    const max = g.altoLista - g.topes[g.desde] - alto;
    const dy = Math.min(max, Math.max(min, g.ultimoY - g.inicioY + scroll));
    const centro = g.centros[g.desde] + dy;
    let hacia = 0;
    g.centros.forEach((c, i) => {
      if (i !== g.desde && c < centro) hacia++;
    });
    if (hacia !== g.hacia) navigator.vibrate?.(8);
    g.hacia = hacia;
    setArrastre({ desde: g.desde, hacia, dy, alto });
  }

  /** Cada cuadro: si el dedo está cerca del borde, mueve el scroll y recalcula. */
  function bucle() {
    const g = gesto.current;
    if (!g) return;
    if (g.scroller) {
      const r = g.scroller.getBoundingClientRect();
      let paso = 0;
      if (g.ultimoY < r.top + MARGEN_AUTOSCROLL) paso = -((r.top + MARGEN_AUTOSCROLL - g.ultimoY) / MARGEN_AUTOSCROLL);
      else if (g.ultimoY > r.bottom - MARGEN_AUTOSCROLL) paso = (g.ultimoY - (r.bottom - MARGEN_AUTOSCROLL)) / MARGEN_AUTOSCROLL;
      if (paso !== 0) {
        g.scroller.scrollTop += Math.round(Math.max(-1, Math.min(1, paso)) * VELOCIDAD_MAX);
        calcular(g);
      }
    }
    g.raf = requestAnimationFrame(bucle);
  }

  function empezar(e: PointerEvent<HTMLButtonElement>, desde: number) {
    if (!ordenable || (e.pointerType === 'mouse' && e.button !== 0) || !lista.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const base = lista.current.getBoundingClientRect().top;
    const filas = [...lista.current.children] as HTMLElement[];
    const rects = filas.map((f) => f.getBoundingClientRect());
    const scroller = contenedorConScroll(lista.current);
    gesto.current = {
      pointerId: e.pointerId,
      desde,
      inicioY: e.clientY,
      ultimoY: e.clientY,
      inicioScroll: scroller?.scrollTop ?? 0,
      scroller,
      centros: rects.map((r) => r.top - base + r.height / 2),
      topes: rects.map((r) => r.top - base),
      altoLista: lista.current.getBoundingClientRect().height,
      hacia: desde,
      raf: 0,
    };
    navigator.vibrate?.(12);
    calcular(gesto.current);
    gesto.current.raf = requestAnimationFrame(bucle);
  }

  function mover(e: PointerEvent<HTMLButtonElement>) {
    const g = gesto.current;
    if (!g || e.pointerId !== g.pointerId) return;
    g.ultimoY = e.clientY;
    calcular(g);
  }

  function soltar(e: PointerEvent<HTMLButtonElement>, cancelar = false) {
    const g = gesto.current;
    if (!g || e.pointerId !== g.pointerId) return;
    cancelAnimationFrame(g.raf);
    gesto.current = null;
    setArrastre(null);
    if (!cancelar && g.hacia !== g.desde) onReordenar(moverA(items, g.desde, g.hacia));
  }

  function teclado(e: KeyboardEvent<HTMLButtonElement>, i: number, id: ID) {
    const destino = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : null;
    if (destino === null) return;
    e.preventDefault();
    if (destino < 0 || destino >= items.length) return;
    enfocar.current = id;
    onReordenar(moverA(items, i, destino));
  }

  /** Cuánto se corre cada fila que no es la arrastrada para hacerle campo. */
  function corrimiento(i: number): number {
    if (!arrastre || i === arrastre.desde) return 0;
    const { desde, hacia, alto } = arrastre;
    if (desde < hacia && i > desde && i <= hacia) return -alto;
    if (hacia < desde && i >= hacia && i < desde) return alto;
    return 0;
  }

  return (
    <ul ref={lista} className="overflow-hidden rounded-2xl bg-superficie-suave">
      {items.map((item, i) => {
        const arrastrada = arrastre?.desde === i;
        const dy = arrastrada ? arrastre.dy : corrimiento(i);
        return (
          <li
            key={item.id}
            style={dy ? { transform: `translateY(${dy}px)` } : undefined}
            className={`relative flex items-stretch border-b-2 border-fondo bg-superficie-suave last:border-b-0 ${
              arrastrada
                ? 'z-10 rounded-xl shadow-[0_10px_24px_-10px_rgba(13,23,38,0.55)]'
                : arrastre
                  ? 'transition-transform duration-200 ease-out'
                  : ''
            }`}
          >
            {ordenable && (
              <button
                type="button"
                data-agarre={item.id}
                aria-label={`Mover ${nombre(item)}. Usá las flechas para cambiar el orden.`}
                onPointerDown={(e) => empezar(e, i)}
                onPointerMove={mover}
                onPointerUp={(e) => soltar(e)}
                onPointerCancel={(e) => soltar(e, true)}
                onKeyDown={(e) => teclado(e, i, item.id)}
                onContextMenu={(e) => e.preventDefault()}
                className={`flex w-10 shrink-0 touch-none items-center justify-center pl-1 select-none ${
                  arrastrada ? 'cursor-grabbing text-tinta' : 'cursor-grab text-tinta-tenue hover:text-tinta-suave'
                }`}
              >
                <Icono nombre="agarre" tamano={18} grosor={2.4} />
              </button>
            )}
            <div className="min-w-0 flex-1">{children(item)}</div>
          </li>
        );
      })}
    </ul>
  );
}
