import { useState, type FormEvent } from 'react';
import { usePreordi } from '../../context/PreordiContext';
import { contarUso, validarNombre } from '../../lib/configuracion';
import { nuevoId } from '../../lib/ids';
import type { Categoria } from '../../types';
import { Boton } from '../atoms/Boton';
import { Campo, CLASE_ENTRADA } from '../molecules/Campo';
import { Desplegable } from '../molecules/Desplegable';
import { HojaInferior } from './HojaInferior';

interface Props {
  /** Categoría a editar. Sin ella, se crea una nueva. */
  categoria?: Categoria;
  onCerrar: () => void;
}

/** Crear, renombrar o eliminar una categoría — especificación 8.9 y 5.7. */
export function HojaCategoria({ categoria, onCerrar }: Props) {
  const { datos, dispatch } = usePreordi();
  const [nombre, setNombre] = useState(categoria?.nombre ?? '');
  const [error, setError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const otras = [...datos.categorias].filter((c) => c.id !== categoria?.id).sort((a, b) => a.orden - b.orden);
  const [destino, setDestino] = useState(otras[0]?.id ?? '');
  const uso = categoria ? (contarUso(datos.preordenes).categorias.get(categoria.id) ?? 0) : 0;

  function guardar(e: FormEvent) {
    e.preventDefault();
    const problema = validarNombre(nombre, datos.categorias, categoria?.id);
    if (problema) return setError(problema);
    const orden = categoria?.orden ?? Math.max(-1, ...datos.categorias.map((c) => c.orden)) + 1;
    dispatch({ tipo: 'guardarCategoria', categoria: { ...categoria, id: categoria?.id ?? nuevoId(), nombre: nombre.trim(), orden } });
    onCerrar();
  }

  function eliminar() {
    if (!categoria) return;
    if (uso === 0) dispatch({ tipo: 'eliminarCategoria', id: categoria.id });
    else dispatch({ tipo: 'moverYEliminarCategoria', de: categoria.id, a: destino });
    onCerrar();
  }

  if (eliminando && categoria) {
    const unica = otras.length === 0;
    return (
      <HojaInferior titulo={`¿Eliminar ${categoria.nombre}?`} onCerrar={onCerrar}>
        {unica ? (
          <p className="text-[15px] leading-relaxed text-tinta-suave">
            Es tu única categoría. Creá otra antes de eliminar esta.
          </p>
        ) : uso === 0 ? (
          <p className="text-[15px] leading-relaxed text-tinta-suave">Ninguna preorden la usa.</p>
        ) : (
          <Campo
            id="campo-destino-categoria"
            etiqueta={`${uso} ${uso === 1 ? 'preorden usa' : 'preórdenes usan'} esta categoría. ¿A cuál las pasamos?`}
            para="destino-categoria"
          >
            <Desplegable
              id="destino-categoria"
              etiqueta="Pasarlas a"
              valor={destino}
              onCambio={setDestino}
              opciones={otras.map((c) => ({ valor: c.id, texto: c.nombre }))}
            />
          </Campo>
        )}
        <div className="flex gap-2.5">
          <Boton className="flex-1" onClick={() => setEliminando(false)}>
            Volver
          </Boton>
          {!unica && (
            <Boton variante="principal" className="flex-[1.4]" onClick={eliminar}>
              {uso === 0 ? 'Eliminar' : 'Mover y eliminar'}
            </Boton>
          )}
        </div>
      </HojaInferior>
    );
  }

  return (
    <HojaInferior titulo={categoria ? 'Editar categoría' : 'Nueva categoría'} onCerrar={onCerrar}>
      <form noValidate onSubmit={guardar} className="flex flex-col gap-5">
        <Campo id="campo-nombre-categoria" etiqueta="Nombre" para="nombre-categoria" error={error ?? undefined}>
          <input
            id="nombre-categoria"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setError(null);
            }}
            placeholder="Artbook"
            autoComplete="off"
            aria-invalid={!!error || undefined}
            aria-describedby={error ? 'campo-nombre-categoria-error' : undefined}
            className={`${CLASE_ENTRADA} h-12`}
          />
        </Campo>
        <div className="flex gap-2.5">
          <Boton className="flex-1" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" variante="principal" className="flex-[1.4]">
            Guardar
          </Boton>
        </div>
        {categoria && (
          <button
            type="button"
            onClick={() => setEliminando(true)}
            className="self-center py-2 text-sm font-bold text-acento-texto"
          >
            Eliminar categoría
          </button>
        )}
      </form>
    </HojaInferior>
  );
}
