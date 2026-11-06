import { useCallback, useState } from 'react';
import { Icono } from '../atoms/Icono';
import { HojaInferior } from '../organisms/HojaInferior';
import { CLASE_ENTRADA } from './Campo';

export interface OpcionDesplegable {
  valor: string;
  texto: string;
}

interface PropsLista {
  opciones: OpcionDesplegable[];
  valor: string;
  onElegir: (valor: string) => void;
}

/** La lista de opciones dentro de la hoja: la elegida resaltada y con check. */
export function ListaOpciones({ opciones, valor, onElegir }: PropsLista) {
  return (
    <ul role="listbox" className="-mx-2 flex flex-col">
      {opciones.map((o) => {
        const elegida = o.valor === valor;
        return (
          <li key={o.valor} role="option" aria-selected={elegida}>
            <button
              type="button"
              onClick={() => onElegir(o.valor)}
              className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-[15px] ${
                elegida ? 'bg-superficie-suave font-bold' : 'hover:bg-superficie-suave'
              }`}
            >
              {o.texto}
              {elegida && (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-naranja-500 text-marino-500">
                  <Icono nombre="check" tamano={15} grosor={2.8} />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

interface Props {
  id?: string;
  /** Título de la hoja y nombre accesible si no hay <label>. */
  etiqueta: string;
  valor: string;
  opciones: OpcionDesplegable[];
  onCambio: (valor: string) => void;
  /** Texto cuando el valor no está entre las opciones. */
  placeholder?: string;
  invalido?: boolean;
  'aria-describedby'?: string;
  className?: string;
}

/**
 * Menú desplegable con el estilo de la app (especificación 10.9): un campo como los demás
 * que abre una hoja inferior con las opciones, en vez de la lista nativa del sistema.
 */
export function Desplegable({ id, etiqueta, valor, opciones, onCambio, placeholder = 'Elegí una opción', invalido, className = '', ...resto }: Props) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = useCallback(() => setAbierto(false), []);
  const actual = opciones.find((o) => o.valor === valor);

  return (
    <>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={id ? undefined : etiqueta}
        aria-invalid={invalido || undefined}
        aria-describedby={resto['aria-describedby']}
        onClick={() => setAbierto(true)}
        className={`${CLASE_ENTRADA} flex h-12 min-w-0 items-center justify-between gap-2 text-left ${className}`}
      >
        <span className={`truncate ${actual ? '' : 'text-tinta-tenue'}`}>{actual?.texto ?? placeholder}</span>
        <Icono nombre="abajo" tamano={18} grosor={2} className="shrink-0 text-tinta-suave" />
      </button>
      {abierto && (
        <HojaInferior titulo={etiqueta} onCerrar={cerrar}>
          <ListaOpciones
            opciones={opciones}
            valor={valor}
            onElegir={(v) => {
              onCambio(v);
              cerrar();
            }}
          />
        </HojaInferior>
      )}
    </>
  );
}
