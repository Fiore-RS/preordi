import { useEffect, useState, type FormEvent } from 'react';
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
import { borrarImagen, comprimirImagen, guardarImagen } from '../../lib/imagenes';
import { useImagen } from '../../lib/useImagen';
import type { Preorden } from '../../types';
import { Boton } from '../atoms/Boton';
import { Icono } from '../atoms/Icono';
import { TituloEtiqueta } from '../atoms/TituloEtiqueta';
import { BotonAgregar, CrearEnLinea } from '../molecules/AgregarNuevo';
import { Desplegable } from '../molecules/Desplegable';
import { Campo, CLASE_ENTRADA } from '../molecules/Campo';
import { CampoMonto } from '../molecules/CampoMonto';
import { Segmentado } from '../molecules/Segmentado';
import { SelectorFechaEstimada } from '../molecules/SelectorFechaEstimada';
import { SelectorImagen } from '../molecules/SelectorImagen';
import { SelectorTipoPago } from '../molecules/SelectorTipoPago';

/** La imagen mientras se edita: la que ya estaba, una nueva elegida, o quitada. */
type EstadoImagen = { tipo: 'original' } | { tipo: 'nueva'; blob: Blob; url: string } | { tipo: 'quitada' };

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

  const [imagen, setImagen] = useState<EstadoImagen>({ tipo: 'original' });
  const [procesandoImagen, setProcesandoImagen] = useState(false);
  const [errorImagen, setErrorImagen] = useState<string | null>(null);
  const urlOriginal = useImagen(original?.imagenId ?? null);
  const urlVista = imagen.tipo === 'nueva' ? imagen.url : imagen.tipo === 'original' ? urlOriginal : null;

  // Libera la vista previa de una imagen nueva cuando se reemplaza o se sale del formulario.
  const urlNueva = imagen.tipo === 'nueva' ? imagen.url : null;
  useEffect(() => () => {
    if (urlNueva) URL.revokeObjectURL(urlNueva);
  }, [urlNueva]);

  async function elegirImagen(archivo: File) {
    setProcesandoImagen(true);
    setErrorImagen(null);
    try {
      const blob = await comprimirImagen(archivo);
      setImagen({ tipo: 'nueva', blob, url: URL.createObjectURL(blob) });
    } catch {
      setErrorImagen('No se pudo leer esa imagen. Probá con otra.');
    } finally {
      setProcesandoImagen(false);
    }
  }

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

  function cambiarCosto(id: string, cambios: { concepto?: string; monto?: string }) {
    cambiar({ costosExtra: f.costosExtra.map((c) => (c.id === id ? { ...c, ...cambios } : c)) }, 'costosExtra');
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (procesandoImagen) return;
    const resultado = procesarFormulario(f, { hoy, ahoraISO: new Date().toISOString(), original });
    if (resultado.ok) {
      let preorden = resultado.preorden;
      try {
        // La imagen va a IndexedDB; la preorden solo guarda su id (6.2).
        if (imagen.tipo === 'nueva') {
          const imagenId = nuevoId();
          await guardarImagen(imagenId, imagen.blob);
          if (original?.imagenId) await borrarImagen(original.imagenId);
          preorden = { ...preorden, imagenId };
        } else if (imagen.tipo === 'quitada' && original?.imagenId) {
          await borrarImagen(original.imagenId);
          preorden = { ...preorden, imagenId: null };
        }
      } catch {
        setErrorImagen('No se pudo guardar la imagen. Intentá de nuevo.');
        document.getElementById('campo-imagen')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      onGuardado(preorden);
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
        <div id="campo-imagen">
          <SelectorImagen
            url={urlVista}
            procesando={procesandoImagen}
            error={errorImagen}
            onElegir={elegirImagen}
            onQuitar={() => {
              setImagen({ tipo: 'quitada' });
              setErrorImagen(null);
            }}
          />
        </div>

        <TituloEtiqueta etiqueta="Información" acento="general" className="-mb-2" />

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

        <Campo id="campo-categoriaId" etiqueta="Categoría" para="categoria" error={errores.categoriaId}>
          <Desplegable
            id="categoria"
            etiqueta="Categoría"
            valor={f.categoriaId}
            onCambio={(categoriaId) => cambiar({ categoriaId }, 'categoriaId')}
            opciones={categorias.map((c) => ({ valor: c.id, texto: c.nombre }))}
            placeholder="Elegí una categoría"
            invalido={!!errores.categoriaId}
            aria-describedby={describe('categoriaId')}
          />
          {nuevaCategoria === null ? (
            <BotonAgregar texto="Nueva categoría" onClick={() => setNuevaCategoria('')} />
          ) : (
            <CrearEnLinea
              id="nueva-categoria"
              etiqueta="Nombre de la nueva categoría"
              valor={nuevaCategoria}
              placeholder="Artbook"
              onCambio={setNuevaCategoria}
              onAgregar={agregarCategoria}
              onCancelar={() => setNuevaCategoria(null)}
            />
          )}
        </Campo>

        <Campo id="campo-tienda" etiqueta="Tienda" para="tienda">
          <Desplegable
            id="tienda"
            etiqueta="Tienda"
            valor={f.tiendaId ?? ''}
            onCambio={(v) => cambiar({ tiendaId: v || null })}
            opciones={[{ valor: '', texto: 'Ninguna' }, ...datos.tiendas.map((t) => ({ valor: t.id, texto: t.nombre }))]}
          />
          {nuevaTienda === null ? (
            <BotonAgregar texto="Nueva tienda" onClick={() => setNuevaTienda('')} />
          ) : (
            <CrearEnLinea
              id="nueva-tienda"
              etiqueta="Nombre de la nueva tienda"
              valor={nuevaTienda}
              placeholder="Tienda local"
              onCambio={setNuevaTienda}
              onAgregar={agregarTienda}
              onCancelar={() => setNuevaTienda(null)}
            />
          )}
        </Campo>

        <TituloEtiqueta etiqueta="Precios" acento="del pedido" className="-mb-2 pt-2" />

        <Campo id="campo-precio" etiqueta="Precio" para="precio" error={errores.precio}>
          <CampoMonto
            id="precio"
            valor={f.precio}
            onCambio={(precio) => cambiar({ precio }, 'precio')}
            invalido={!!errores.precio}
            aria-describedby={describe('precio')}
          />
        </Campo>

        <Campo id="campo-costosExtra" etiqueta="Envío y otros costos" error={errores.costosExtra}>
          {f.costosExtra.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2">
              <input
                aria-label={`Concepto del costo ${i + 1}`}
                value={c.concepto}
                onChange={(e) => cambiarCosto(c.id, { concepto: e.target.value })}
                placeholder="Envío"
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
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-tinta-suave hover:bg-superficie-suave"
              >
                <Icono nombre="basura" />
              </button>
            </div>
          ))}
          <BotonAgregar
            texto={f.costosExtra.length === 0 ? 'Agregar envío u otro costo' : 'Agregar otro costo'}
            onClick={() => cambiar({ costosExtra: [...f.costosExtra, { id: nuevoId(), concepto: '', monto: '' }] })}
          />
        </Campo>
        {haySobrepago && (
          <p className="-mt-3 flex items-start gap-1.5 rounded-xl bg-acento-tenue px-3 py-2.5 text-[13px] text-acento-tenue-texto">
            <Icono nombre="alerta" tamano={16} grosor={2} className="mt-px shrink-0 text-acento-texto" />
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
              <p className="-mt-3 text-[13px] text-tinta-suave">
                {f.tipoPago === 'completo'
                  ? `Se registra un pago de ${formatearMonto(costo)}.`
                  : `Queda todo pendiente: ${formatearMonto(costo)}.`}
              </p>
            )}
          </>
        )}

        <TituloEtiqueta etiqueta="Llegada" acento="estimada" className="-mb-2 pt-2" />

        <Campo id="campo-fechaEstimada" etiqueta="¿Qué tan exacta es la fecha?" error={errores.fechaEstimada}>
          <SelectorFechaEstimada
            idBase="fecha-estimada"
            hoy={hoy}
            valores={f}
            onCambio={(cambios) => cambiar(cambios, 'fechaEstimada')}
            invalido={!!errores.fechaEstimada}
            aria-describedby={describe('fechaEstimada')}
          />
          {original?.fechaEstimada && (
            <p className="text-[13px] text-tinta-suave">Si la cambiás, queda registrada como reprogramación.</p>
          )}
        </Campo>

        <TituloEtiqueta etiqueta="Detalles" acento="extra" className="-mb-2 pt-2" />


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

      <div className="sticky bottom-0 mt-auto border-t border-borde-suave bg-fondo px-5 pt-3.5 pb-[max(1.375rem,env(safe-area-inset-bottom))]">
        {costo > 0 && (
          <p className="mb-2.5 flex justify-between text-sm">
            <span className="text-tinta-suave">Costo total</span>
            <span className="font-display font-extrabold tabular-nums">{formatearMonto(costo)}</span>
          </p>
        )}
        <Boton type="submit" variante="principal" className="w-full">
          {textoGuardar}
        </Boton>
      </div>
    </form>
  );
}
