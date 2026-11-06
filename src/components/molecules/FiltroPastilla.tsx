import { useCallback, useState } from 'react';
import { Icono, type NombreIcono } from '../atoms/Icono';
import { HojaInferior } from '../organisms/HojaInferior';
import { ListaOpciones, type OpcionDesplegable } from './Desplegable';

interface Props {
  etiqueta: string;
  /** Valor actual; '' es "sin filtro". */
  valor: string;
  opciones: OpcionDesplegable[];
  onCambio: (valor: string) => void;
  /** Texto de la opción "sin filtro". Sin él, no hay opción vacía (para el orden). */
  textoTodas?: string;
  icono?: NombreIcono;
  /** Solo el ícono, sin texto (el orden). */
  soloIcono?: boolean;
  /** Resaltar aunque no haya opción vacía (ej. un orden distinto del de siempre). */
  resaltar?: boolean;
  /** Ocupar el espacio que sobre en la fila (texto a la izquierda, flecha a la derecha). */
  estirar?: boolean;
}

/**
 * Filtro compacto (rectángulo redondeado; sólido cuando tiene un filtro aplicado).
 * Al tocarlo abre una hoja con las opciones, con el mismo estilo que los menús desplegables
 * del formulario (especificación 10.9), en vez de la lista nativa del sistema.
 */
export function FiltroPastilla({
  etiqueta,
  valor,
  opciones,
  onCambio,
  textoTodas,
  icono = 'abajo',
  soloIcono = false,
  resaltar = false,
  estirar = false,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = useCallback(() => setAbierto(false), []);
  const activo = resaltar || (textoTodas !== undefined && valor !== '');
  const todas = textoTodas !== undefined ? [{ valor: '', texto: textoTodas === etiqueta ? `Todas` : textoTodas }, ...opciones] : opciones;
  const actual = todas.find((o) => o.valor === valor);
  const colores = activo ? 'border-tinta bg-tinta text-fondo font-bold' : 'border-borde bg-superficie text-tinta font-medium';

  return (
    <>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={soloIcono ? etiqueta : `${etiqueta}: ${actual?.texto ?? ''}`}
        title={soloIcono ? etiqueta : undefined}
        onClick={() => setAbierto(true)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-xl border text-[13px] transition-colors ${colores} ${
          soloIcono
            ? 'w-9 shrink-0 justify-center'
            : estirar
              ? 'min-w-0 flex-1 justify-between pr-2.5 pl-3.5'
              : 'max-w-44 shrink-0 justify-center pr-2.5 pl-3.5'
        }`}
      >
        {!soloIcono && <span className="truncate">{valor === '' ? textoTodas : actual?.texto}</span>}
        <Icono nombre={icono} tamano={soloIcono ? 18 : 16} grosor={2} className="shrink-0" />
      </button>
      {abierto && (
        <HojaInferior titulo={etiqueta} onCerrar={cerrar}>
          <ListaOpciones
            opciones={todas}
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
