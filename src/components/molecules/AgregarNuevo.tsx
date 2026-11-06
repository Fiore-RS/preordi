import type { KeyboardEvent } from 'react';
import { Boton } from '../atoms/Boton';
import { Icono } from '../atoms/Icono';
import { CLASE_ENTRADA } from './Campo';

/**
 * "+ Nueva categoría", "+ Nueva tienda", "+ Agregar costo": el mismo botón en todo el formulario
 * (especificación 10.9): un cuadrito naranja con + y el texto, sin caja alrededor.
 */
export function BotonAgregar({ texto, onClick }: { texto: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mx-1 flex min-h-10 items-center gap-2 self-start rounded-xl px-1 text-sm font-bold text-tinta hover:bg-superficie-suave"
    >
      <span className="flex size-6 items-center justify-center rounded-lg bg-naranja-500 text-marino-500">
        <Icono nombre="mas" tamano={16} grosor={2.6} />
      </span>
      {texto}
    </button>
  );
}

interface PropsCrear {
  id: string;
  etiqueta: string;
  valor: string;
  placeholder: string;
  onCambio: (valor: string) => void;
  onAgregar: () => void;
  onCancelar: () => void;
}

/** Crear algo nuevo sin salir del formulario: campo + Agregar + cancelar, sobre un fondo suave. */
export function CrearEnLinea({ id, etiqueta, valor, placeholder, onCambio, onAgregar, onCancelar }: PropsCrear) {
  const alTeclear = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAgregar();
    }
    if (e.key === 'Escape') onCancelar();
  };
  return (
    <div className="flex gap-2 rounded-2xl bg-superficie-suave p-2">
      <label htmlFor={id} className="sr-only">
        {etiqueta}
      </label>
      <input
        id={id}
        autoFocus
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        onKeyDown={alTeclear}
        placeholder={placeholder}
        className={`${CLASE_ENTRADA} h-11 min-w-0`}
      />
      <Boton variante="principal" tamano="chico" className="shrink-0 font-bold" onClick={onAgregar}>
        Agregar
      </Boton>
      <button
        type="button"
        aria-label="Cancelar"
        onClick={onCancelar}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-tinta-suave hover:bg-borde-suave"
      >
        <Icono nombre="cerrar" tamano={18} />
      </button>
    </div>
  );
}
