import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { usePreordi } from '../../context/PreordiContext';
import { totalPagado } from '../../lib/calculos';
import { formatearMonto } from '../../lib/dinero';
import { hoy as fechaDeHoy } from '../../lib/fechas';
import {
  costoDeFormulario,
  formularioDesdePreorden,
  formularioVacio,
  ORDEN_CAMPOS,
  procesarFormulario,
  type CampoConError,
  type ErroresFormulario,
  type FormularioPreorden as Formulario,
} from '../../lib/formulario';
import { nuevoId } from '../../lib/ids';
import type { Preorden } from '../../types';
import { Boton } from '../atoms/Boton';
import { Icono } from '../atoms/Icono';
import { Campo, CLASE_ENTRADA } from '../molecules/Campo';
import { CampoMonto } from '../molecules/CampoMonto';
import { Segmentado } from '../molecules/Segmentado';
import { SelectorFechaEstimada } from '../molecules/SelectorFechaEstimada';
import { SelectorTipoPago } from '../molecules/SelectorTipoPago';

interface Props {
  /** Preorden a editar. Sin ella, el formulario crea una nueva. */
  original?: Preorden;
  /** Estado inicial al crear (desde Deseos llega 'deseada'). */
  estadoInicial?: Formulario['estadoInicial'];
  onGuardado: (preorden: Preorden) => void;
}

export function FormularioPreorden({ original, estadoInicial = 'apartada', onGuardado }: Props) {
  const { datos, dispatch } = usePreordi();
  const hoy = fechaDeHoy();
  const categorias = [...datos.categorias].sort((a, b) => a.orden - b.orden);

  const [f, setF] = useState<Formulario>(() =>
    original
      ? formularioDesdePreorden(original, hoy)
      : formularioVacio(hoy, categorias[0]?.id ?? '', estadoInicial),
  );
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [nuevaCategoria, setNuevaCategoria] = useState<string | null>(null);
  const [nuevaTienda, setNuevaTienda] = useState<string | null>(null);

  /** Actualiza campos y limpia el error del campo que se está corrigiendo. */
  function cambiar(cambios: Partial<Formulario>, campo?: CampoConError) {
    setF((actual) => ({ ...actual, ...cambios }));
    if (campo && errores[campo]) setErrores(({ [campo]: _quitado, ...resto }) => resto);
  }

  function agregarCategoria() {
    const nombre = nuevaCategoria?.trim();
    if (!nombre) return;
    const id = nuevoId();
    const orden = Math.max(-1, ...datos.categorias.map((c) => c.orden)) + 1;
    dispatch({ tipo: 'guardarCategoria', categoria: { id, nombre, orden } });
    cambiar({ categoriaId: id }, 'categoriaId');
    setNuevaCategoria(null);
  }

  function agregarTienda() {
    const nombre = nuevaTienda?.trim();
    if (!nombre) return;
    const id = nuevoId();
    dispatch({ tipo: 'guardarTienda', tienda: { id, nombre } });
    cambiar({ tiendaId: id });
    setNuevaTienda(null);
  }

  /** Enter dentro de un campo en línea agrega, en vez de enviar el formulario. */
  const conEnter = (accion: () => void) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      accion();
    }
  };

  function cambiarCosto(id: string, cambios: { concepto?: string; monto?: string }) {
    cambiar({ costosExtra: f.costosExtra.map((c) => (c.id === id ? { ...c, ...cambios } : c)) }, 'costosExtra');
  }

  function guardar(e: FormEvent) {
    e.preventDefault();
    const resultado = procesarFormulario(f, { hoy, ahoraISO: new Date().toISOString(), original });
    if (resultado.ok) {
      onGuardado(resultado.preorden);
      return;
    }
    setErrores(resultado.errores);
    const primero = ORDEN_CAMPOS.find((campo) => resultado.errores[campo]);
    const contenedor = primero && document.getElementById(`campo-${primero}`);
    if (contenedor) {
      contenedor.scrollIntoView({ behavior: 'smooth', block: 'center' });
      contenedor.querySelector<HTMLElement>('input, select, textarea, button')?.focus({ preventScroll: true });
    }
  }

  const creando = !original;
  const apartando = creando && f.estadoInicial === 'apartada';
  const costo = costoDeFormulario(f);
  const pagado = original ? totalPagado(original) : 0;
  const haySobrepago = !!original && costo > 0 && pagado > costo;

  const textoGuardar = original ? 'Guardar cambios' : f.estadoInicial === 'deseada' ? 'Guardar deseo' : 'Guardar preorden';
  const describe = (campo: CampoConError) => (errores[campo] ? `campo-${campo}-error` : undefined);

  return (
    <form noValidate onSubmit={guardar} className="flex flex-1 flex-col">
      <div className="flex flex-col gap-6 px-5 pt-2 pb-8">
        <Campo id="campo-nombre" etiqueta="Nombre" para="nombre" error={errores.nombre}>
          <input
            id="nombre"
            value={f.nombre}
            onChange={(e) => cambiar({ nombre: e.target.value }, 'nombre')}
            placeholder="Figura escala 1/7"
            autoComplete="off"
            aria-invalid={!!errores.nombre || undefined}
            aria-describedby={describe('nombre')}
            className={`${CLASE_ENTRADA} h-12`}
          />
        </Campo>

        <Campo id="campo-categoriaId" etiqueta="Categoría" error={errores.categoriaId}>
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => {
              const activa = c.id === f.categoriaId;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => cambiar({ categoriaId: c.id }, 'categoriaId')}
                  className={`min-h-10 rounded-full px-3.5 text-sm transition-colors ${
                    activa
                      ? 'border-[1.5px] border-marino-500 bg-marino-500 font-bold text-papel'
                      : 'border border-marino-100 bg-white text-marino-500 hover:border-marino-300'
                  }`}
                >
                  {c.nombre}
                </button>
              );
            })}
            {nuevaCategoria === null && (
              <Boton variante="discreto" tamano="chico" onClick={() => setNuevaCategoria('')}>
                + Nueva
              </Boton>
            )}
          </div>
          {nuevaCategoria !== null && (
            <div className="flex gap-2">
              <label htmlFor="nueva-categoria" className="sr-only">
                Nombre de la nueva categoría
              </label>
              <input
                id="nueva-categoria"
                autoFocus
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                onKeyDown={conEnter(agregarCategoria)}
                placeholder="Artbook"
                className={`${CLASE_ENTRADA} h-11`}
              />
              <Boton tamano="chico" onClick={agregarCategoria}>
                Agregar
              </Boton>
              <Boton variante="discreto" tamano="chico" aria-label="Cancelar" onClick={() => setNuevaCategoria(null)}>
                <Icono nombre="cerrar" tamano={18} />
              </Boton>
            </div>
          )}
        </Campo>

        <Campo id="campo-tienda" etiqueta="Tienda" para="tienda">
          <div className="flex gap-2">
            <select
              id="tienda"
              value={f.tiendaId ?? ''}
              onChange={(e) => cambiar({ tiendaId: e.target.value || null })}
              className={`${CLASE_ENTRADA} h-12`}
            >
              <option value="">Ninguna</option>
              {datos.tiendas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
            {nuevaTienda === null && (
              <Boton variante="discreto" tamano="chico" className="shrink-0" onClick={() => setNuevaTienda('')}>
                + Nueva
              </Boton>
            )}
          </div>
          {nuevaTienda !== null && (
            <div className="flex gap-2">
              <label htmlFor="nueva-tienda" className="sr-only">
                Nombre de la nueva tienda
              </label>
              <input
                id="nueva-tienda"
                autoFocus
                value={nuevaTienda}
                onChange={(e) => setNuevaTienda(e.target.value)}
                onKeyDown={conEnter(agregarTienda)}
                placeholder="Tienda local"
                className={`${CLASE_ENTRADA} h-11`}
              />
              <Boton tamano="chico" onClick={agregarTienda}>
                Agregar
              </Boton>
              <Boton variante="discreto" tamano="chico" aria-label="Cancelar" onClick={() => setNuevaTienda(null)}>
                <Icono nombre="cerrar" tamano={18} />
              </Boton>
            </div>
          )}
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo id="campo-precio" etiqueta="Precio" para="precio" error={errores.precio}>
            <CampoMonto
              id="precio"
              valor={f.precio}
              onCambio={(precio) => cambiar({ precio }, 'precio')}
              invalido={!!errores.precio}
              aria-describedby={describe('precio')}
            />
          </Campo>
          <Campo id="campo-referencia" etiqueta="Precio original" para="referencia" ayuda="Opcional, solo de referencia">
            <input
              id="referencia"
              value={f.referenciaOriginal}
              onChange={(e) => cambiar({ referenciaOriginal: e.target.value })}
              placeholder="$88"
              autoComplete="off"
              className={`${CLASE_ENTRADA} h-12`}
            />
          </Campo>
        </div>
        {haySobrepago && (
          <p className="-mt-3 flex items-start gap-1.5 rounded-xl bg-naranja-50 px-3 py-2.5 text-[13px] text-naranja-900">
            <Icono nombre="alerta" tamano={16} grosor={2} className="mt-px shrink-0 text-naranja-700" />
            Ya pagaste {formatearMonto(pagado)}, más que el nuevo costo total de {formatearMonto(costo)}.
          </p>
        )}

        {creando && (
          <Campo id="campo-estado" etiqueta="¿Ya la apartaste?">
            <Segmentado
              etiqueta="¿Ya la apartaste?"
              valor={f.estadoInicial}
              onCambio={(estadoInicial) => cambiar({ estadoInicial })}
              opciones={[
                { valor: 'deseada', texto: 'Solo es un deseo' },
                { valor: 'apartada', texto: 'Ya la aparté' },
              ]}
            />
          </Campo>
        )}

        {apartando && (
          <>
            <Campo id="campo-tipoPago" etiqueta="Tipo de pago">
              <SelectorTipoPago valor={f.tipoPago} onCambio={(tipoPago) => cambiar({ tipoPago }, 'deposito')} />
            </Campo>

            <div className="grid grid-cols-2 gap-3">
              {f.tipoPago === 'deposito' && (
                <Campo id="campo-deposito" etiqueta="Depósito" para="deposito" error={errores.deposito}>
                  <CampoMonto
                    id="deposito"
                    valor={f.deposito}
                    onCambio={(deposito) => cambiar({ deposito }, 'deposito')}
                    invalido={!!errores.deposito}
                    aria-describedby={describe('deposito')}
                  />
                </Campo>
              )}
              <Campo id="campo-fechaApartada" etiqueta="Apartada el" para="fecha-apartada" error={errores.fechaApartada}>
                <input
                  id="fecha-apartada"
                  type="date"
                  value={f.fechaApartada}
                  max={hoy}
                  onChange={(e) => cambiar({ fechaApartada: e.target.value }, 'fechaApartada')}
                  aria-invalid={!!errores.fechaApartada || undefined}
                  aria-describedby={describe('fechaApartada')}
                  className={`${CLASE_ENTRADA} h-12`}
                />
              </Campo>
            </div>
            {f.tipoPago !== 'deposito' && costo > 0 && (
              <p className="-mt-3 text-[13px] text-marino-400">
                {f.tipoPago === 'completo'
                  ? `Se registra un pago de ${formatearMonto(costo)}.`
                  : `Queda todo pendiente: ${formatearMonto(costo)}.`}
              </p>
            )}
          </>
        )}

        <Campo id="campo-fechaEstimada" etiqueta="Llegada estimada" error={errores.fechaEstimada}>
          <SelectorFechaEstimada
            idBase="fecha-estimada"
            hoy={hoy}
            valores={f}
            onCambio={(cambios) => cambiar(cambios, 'fechaEstimada')}
            invalido={!!errores.fechaEstimada}
            aria-describedby={describe('fechaEstimada')}
          />
          {original?.fechaEstimada && (
            <p className="text-[13px] text-marino-400">Si la cambiás, queda registrada como reprogramación.</p>
          )}
        </Campo>

        <Campo id="campo-costosExtra" etiqueta="Costos extra" error={errores.costosExtra}>
          {f.costosExtra.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2">
              <input
                aria-label={`Concepto del costo ${i + 1}`}
                value={c.concepto}
                onChange={(e) => cambiarCosto(c.id, { concepto: e.target.value })}
                placeholder="Courier"
                className={`${CLASE_ENTRADA} h-12 min-w-0 flex-[3]`}
              />
              <div className="min-w-0 flex-[2]">
                <CampoMonto
                  id={`costo-${c.id}`}
                  valor={c.monto}
                  onCambio={(monto) => cambiarCosto(c.id, { monto })}
                />
              </div>
              <button
                type="button"
                aria-label={`Quitar costo ${i + 1}`}
                onClick={() => cambiar({ costosExtra: f.costosExtra.filter((x) => x.id !== c.id) }, 'costosExtra')}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-marino-400 hover:bg-marino-50"
              >
                <Icono nombre="basura" />
              </button>
            </div>
          ))}
          <Boton
            variante="discreto"
            tamano="chico"
            className="self-start"
            onClick={() => cambiar({ costosExtra: [...f.costosExtra, { id: nuevoId(), concepto: '', monto: '' }] })}
          >
            + Agregar costo
          </Boton>
        </Campo>

        <Campo id="campo-link" etiqueta="Link del producto" para="link">
          <input
            id="link"
            type="url"
            inputMode="url"
            value={f.link}
            onChange={(e) => cambiar({ link: e.target.value })}
            placeholder="https://"
            autoComplete="off"
            className={`${CLASE_ENTRADA} h-12`}
          />
        </Campo>

        <Campo id="campo-notas" etiqueta="Notas" para="notas">
          <textarea
            id="notas"
            rows={3}
            value={f.notas}
            onChange={(e) => cambiar({ notas: e.target.value })}
            placeholder="Pagar el saldo al retirarla"
            className={`${CLASE_ENTRADA} resize-none py-3`}
          />
        </Campo>
      </div>

      <div className="sticky bottom-0 mt-auto border-t border-marino-100 bg-papel px-5 pt-3.5 pb-[max(1.375rem,env(safe-area-inset-bottom))]">
        {costo > 0 && (
          <p className="mb-2.5 flex justify-between text-sm">
            <span className="text-marino-400">Costo total</span>
            <span className="font-bold tabular-nums">{formatearMonto(costo)}</span>
          </p>
        )}
        <Boton type="submit" variante="principal" className="w-full">
          {textoGuardar}
        </Boton>
      </div>
    </form>
  );
}
