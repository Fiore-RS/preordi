import { useState, type FormEvent } from 'react';
import { usePreordi } from '../../context/PreordiContext';
import { contarUso, validarNombre } from '../../lib/configuracion';
import { nuevoId } from '../../lib/ids';
import type { Tienda } from '../../types';
import { Boton } from '../atoms/Boton';
import { Campo, CLASE_ENTRADA } from '../molecules/Campo';
import { Desplegable } from '../molecules/Desplegable';
import { HojaInferior } from './HojaInferior';

interface Props {
  /** Tienda a editar. Sin ella, se crea una nueva. */
  tienda?: Tienda;
  onCerrar: () => void;
}

const opcional = (texto: string) => (texto.trim() ? texto.trim() : undefined);

/** Crear, editar o eliminar una tienda — especificación 8.9 y 5.7. */
export function HojaTienda({ tienda, onCerrar }: Props) {
  const { datos, dispatch } = usePreordi();
  const [nombre, setNombre] = useState(tienda?.nombre ?? '');
  const [link, setLink] = useState(tienda?.link ?? '');
  const [notas, setNotas] = useState(tienda?.notas ?? '');
  const [error, setError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);
  // '' = las preórdenes quedan sin tienda
  const [destino, setDestino] = useState('');

  const otras = datos.tiendas.filter((t) => t.id !== tienda?.id);
  const uso = tienda ? (contarUso(datos.preordenes).tiendas.get(tienda.id) ?? 0) : 0;

  function guardar(e: FormEvent) {
    e.preventDefault();
    const problema = validarNombre(nombre, datos.tiendas, tienda?.id);
    if (problema) return setError(problema);
    dispatch({
      tipo: 'guardarTienda',
      tienda: { id: tienda?.id ?? nuevoId(), nombre: nombre.trim(), link: opcional(link), notas: opcional(notas) },
    });
    onCerrar();
  }

  function eliminar() {
    if (!tienda) return;
    if (uso === 0) dispatch({ tipo: 'eliminarTienda', id: tienda.id });
    else dispatch({ tipo: 'moverYEliminarTienda', de: tienda.id, a: destino || null });
    onCerrar();
  }

  if (eliminando && tienda) {
    return (
      <HojaInferior titulo={`¿Eliminar ${tienda.nombre}?`} onCerrar={onCerrar}>
        {uso === 0 ? (
          <p className="text-[15px] leading-relaxed text-tinta-suave">Ninguna preorden la usa.</p>
        ) : (
          <Campo
            id="campo-destino-tienda"
            etiqueta={`${uso} ${uso === 1 ? 'preorden es' : 'preórdenes son'} de esta tienda. ¿Qué hacemos con ${uso === 1 ? 'ella' : 'ellas'}?`}
            para="destino-tienda"
          >
            <Desplegable
              id="destino-tienda"
              etiqueta="¿Qué hacemos con ellas?"
              valor={destino}
              onCambio={setDestino}
              opciones={[
                { valor: '', texto: 'Dejarlas sin tienda' },
                ...otras.map((t) => ({ valor: t.id, texto: `Pasarlas a ${t.nombre}` })),
              ]}
            />
          </Campo>
        )}
        <div className="flex gap-2.5">
          <Boton className="flex-1" onClick={() => setEliminando(false)}>
            Volver
          </Boton>
          <Boton variante="principal" className="flex-[1.4]" onClick={eliminar}>
            Eliminar
          </Boton>
        </div>
      </HojaInferior>
    );
  }

  return (
    <HojaInferior titulo={tienda ? 'Editar tienda' : 'Nueva tienda'} onCerrar={onCerrar}>
      <form noValidate onSubmit={guardar} className="flex flex-col gap-5">
        <Campo id="campo-nombre-tienda" etiqueta="Nombre" para="nombre-tienda" error={error ?? undefined}>
          <input
            id="nombre-tienda"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setError(null);
            }}
            placeholder="Tienda local"
            autoComplete="off"
            aria-invalid={!!error || undefined}
            aria-describedby={error ? 'campo-nombre-tienda-error' : undefined}
            className={`${CLASE_ENTRADA} h-12`}
          />
        </Campo>
        <Campo id="campo-link-tienda" etiqueta="Link" para="link-tienda">
          <input
            id="link-tienda"
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://"
            autoComplete="off"
            className={`${CLASE_ENTRADA} h-12`}
          />
        </Campo>
        <Campo id="campo-notas-tienda" etiqueta="Notas" para="notas-tienda" ayuda="Política de depósito, cancelación, cómo cobran…">
          <textarea
            id="notas-tienda"
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Depósito mínimo del 20%"
            className={`${CLASE_ENTRADA} resize-none py-3`}
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
        {tienda && (
          <button
            type="button"
            onClick={() => setEliminando(true)}
            className="self-center py-2 text-sm font-bold text-acento-texto"
          >
            Eliminar tienda
          </button>
        )}
      </form>
    </HojaInferior>
  );
}
