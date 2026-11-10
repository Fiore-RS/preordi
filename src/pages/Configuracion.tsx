import { useCallback, useId, useState } from 'react';
import { Boton } from '../components/atoms/Boton';
import { Icono } from '../components/atoms/Icono';
import { TituloEtiqueta } from '../components/atoms/TituloEtiqueta';
import { BotonAgregar } from '../components/molecules/AgregarNuevo';
import { Encabezado } from '../components/molecules/Encabezado';
import { ListaOrdenable } from '../components/molecules/ListaOrdenable';
import { Segmentado } from '../components/molecules/Segmentado';
import { MensajeError } from '../components/molecules/Campo';
import { HojaCategoria } from '../components/organisms/HojaCategoria';
import { HojaInferior } from '../components/organisms/HojaInferior';
import { HojaTienda } from '../components/organisms/HojaTienda';
import { usePreordi } from '../context/PreordiContext';
import { contarUso, renumerar } from '../lib/configuracion';
import { useTema } from '../lib/tema';
import { formatearFecha, hoy } from '../lib/fechas';
import { ultimoRespaldo } from '../lib/recordatorioRespaldo';
import { borrarTodasLasImagenes } from '../lib/imagenes';
import { datosIniciales } from '../lib/persistencia';
import {
  aplicarImagenes,
  hacerRespaldo,
  leerRespaldo,
  resumir,
  type RespaldoLeido,
  type ResumenRespaldo,
} from '../lib/respaldo';
import type { Categoria, Tienda } from '../types';

type Hoja =
  | { tipo: 'categoria'; categoria?: Categoria }
  | { tipo: 'tienda'; tienda?: Tienda }
  | { tipo: 'importar'; respaldo: RespaldoLeido }
  | { tipo: 'reiniciar'; paso: 1 | 2 }
  | null;

const textoUso = (n: number) => (n === 0 ? 'Sin usar' : `${n} ${n === 1 ? 'preorden' : 'preórdenes'}`);

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

function textoResumen(r: ResumenRespaldo): string {
  const partes = [plural(r.preordenes, 'preorden', 'preórdenes')];
  if (r.deseos > 0) partes.push(plural(r.deseos, 'deseo', 'deseos'));
  partes.push(plural(r.imagenes, 'imagen', 'imágenes'));
  return partes.join(' · ');
}

/** Fila editable de categoría o tienda: con agarre a la izquierda, el texto se pega a él. */
const claseFilaEditable = (cantidad: number) =>
  `flex min-h-14 w-full items-center gap-3 py-2.5 pr-3.5 text-left ${cantidad > 1 ? 'pl-1' : 'pl-3.5'}`;

const CLASE_FILA = 'flex min-h-14 w-full items-center gap-3 px-3.5 py-2.5 text-left disabled:opacity-60';

// Especificación 8.9, 6.3 (respaldo) y 10.4 (modo de color). Categorías y tiendas se ordenan arrastrando.
export function Configuracion() {
  const { datos, dispatch } = usePreordi();
  const [hoja, setHoja] = useState<Hoja>(null);
  const [tema, setTema] = useTema();
  const cerrar = useCallback(() => setHoja(null), []);
  const idArchivo = useId();
  const [ocupado, setOcupado] = useState<'exportar' | 'importar' | 'reiniciar' | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const [ultimo, setUltimo] = useState(ultimoRespaldo);
  const actual = resumir(datos, datos.preordenes.filter((p) => p.imagenId).length);

  async function exportar() {
    setOcupado('exportar');
    setMensaje(null);
    try {
      const resultado = await hacerRespaldo(datos, hoy());
      if (resultado === 'cancelado') return;
      setUltimo(ultimoRespaldo());
      setMensaje({
        tipo: 'ok',
        texto:
          resultado === 'compartido'
            ? 'Respaldo guardado.'
            : 'Respaldo descargado. Guardalo en un lugar seguro (Drive, iCloud o tu compu).',
      });
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo armar el respaldo. Intentá de nuevo.' });
    } finally {
      setOcupado(null);
    }
  }

  async function elegirRespaldo(archivo: File) {
    setOcupado('importar');
    setMensaje(null);
    try {
      setHoja({ tipo: 'importar', respaldo: await leerRespaldo(archivo) });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error instanceof Error ? error.message : 'No se pudo leer el archivo.' });
    } finally {
      setOcupado(null);
    }
  }

  async function importar(respaldo: RespaldoLeido) {
    setOcupado('importar');
    try {
      await aplicarImagenes(respaldo);
      dispatch({ tipo: 'reemplazar', datos: respaldo.datos });
      setHoja(null);
      setMensaje({ tipo: 'ok', texto: `Listo: se cargaron ${textoResumen(respaldo.resumen)}.` });
    } catch {
      setHoja(null);
      setMensaje({ tipo: 'error', texto: 'No se pudo importar el respaldo. Tus datos actuales siguen igual.' });
    } finally {
      setOcupado(null);
    }
  }

  async function reiniciar() {
    setOcupado('reiniciar');
    try {
      await borrarTodasLasImagenes();
    } catch {
      // Si IndexedDB falla, las imágenes quedan huérfanas y se limpian al abrir la app.
    }
    dispatch({ tipo: 'reemplazar', datos: datosIniciales() });
    setOcupado(null);
    setHoja(null);
    setMensaje({ tipo: 'ok', texto: 'Se borró todo. Preordi quedó como nueva.' });
  }

  const categorias = [...datos.categorias].sort((a, b) => a.orden - b.orden);
  const uso = contarUso(datos.preordenes);

  return (
    <main className="flex flex-1 flex-col">
      <Encabezado titulo="Configuración" volverA="/" />

      <div className="flex flex-col gap-7 px-5 pt-2 pb-10">
        <section aria-labelledby="titulo-categorias" className="flex flex-col gap-2.5">
          <TituloEtiqueta id="titulo-categorias" etiqueta="Mis" acento="categorías" />
          <ListaOrdenable
            items={categorias}
            nombre={(c) => c.nombre}
            onReordenar={(lista) => dispatch({ tipo: 'reemplazarCategorias', categorias: renumerar(lista) })}
          >
            {(c) => (
              <button
                type="button"
                onClick={() => setHoja({ tipo: 'categoria', categoria: c })}
                aria-label={`Editar ${c.nombre}`}
                className={claseFilaEditable(categorias.length)}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px]">{c.nombre}</span>
                  <span className="text-[13px] text-tinta-suave">{textoUso(uso.categorias.get(c.id) ?? 0)}</span>
                </span>
                <Icono nombre="editar" tamano={18} className="shrink-0 text-tinta-suave" />
              </button>
            )}
          </ListaOrdenable>
          <BotonAgregar texto="Agregar categoría" onClick={() => setHoja({ tipo: 'categoria' })} />
        </section>

        <section aria-labelledby="titulo-tiendas" className="flex flex-col gap-2.5">
          <TituloEtiqueta id="titulo-tiendas" etiqueta="Mis" acento="tiendas" />
          {datos.tiendas.length === 0 ? (
            <p className="text-sm text-tinta-suave">
              Todavía no agregaste tiendas. También podés crearlas al registrar una preorden.
            </p>
          ) : (
            <ListaOrdenable
              items={datos.tiendas}
              nombre={(t) => t.nombre}
              onReordenar={(tiendas) => dispatch({ tipo: 'reemplazarTiendas', tiendas })}
            >
              {(t) => (
                <button
                  type="button"
                  onClick={() => setHoja({ tipo: 'tienda', tienda: t })}
                  aria-label={`Editar ${t.nombre}`}
                  className={claseFilaEditable(datos.tiendas.length)}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px]">{t.nombre}</span>
                    <span className="truncate text-[13px] text-tinta-suave">
                      {t.notas || textoUso(uso.tiendas.get(t.id) ?? 0)}
                    </span>
                  </span>
                  <Icono nombre="editar" tamano={18} className="shrink-0 text-tinta-suave" />
                </button>
              )}
            </ListaOrdenable>
          )}
          <BotonAgregar texto="Agregar tienda" onClick={() => setHoja({ tipo: 'tienda' })} />
        </section>

        <section aria-labelledby="titulo-tema" className="flex flex-col gap-2.5">
          <TituloEtiqueta id="titulo-tema" etiqueta="Modo" acento="de color" />
          <Segmentado
            etiqueta="Modo de color"
            valor={tema}
            onCambio={setTema}
            opciones={[
              { valor: 'claro', texto: 'Claro' },
              { valor: 'oscuro', texto: 'Oscuro' },
              { valor: 'sistema', texto: 'Sistema' },
            ]}
          />
          <p className="text-[13px] text-tinta-suave">
            {tema === 'sistema' ? 'Cambia solo cuando tu teléfono pasa a modo claro u oscuro.' : 'Se queda así aunque cambie el teléfono.'}
          </p>
        </section>

        <section aria-labelledby="titulo-respaldo" className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-0.5">
            <TituloEtiqueta id="titulo-respaldo" etiqueta="Mi" acento="respaldo" />
            <p className="text-[13px] text-tinta-suave">
              Un .zip con tus preórdenes, deseos, categorías, tiendas e imágenes.
            </p>
            <p className="text-[13px] text-tinta-suave">
              {ultimo ? `Último respaldo: ${formatearFecha(ultimo)}.` : 'Todavía no has hecho un respaldo.'}
            </p>
          </div>
          <ul className="overflow-hidden rounded-2xl bg-superficie-suave">
            <li className="border-b-2 border-fondo">
              <button type="button" onClick={exportar} disabled={ocupado !== null} className={CLASE_FILA}>
                <Icono nombre="subir" tamano={20} className="shrink-0 text-acento-texto" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px]">{ocupado === 'exportar' ? 'Armando respaldo…' : 'Exportar respaldo'}</span>
                  <span className="truncate text-[13px] text-tinta-suave">{textoResumen(actual)}</span>
                </span>
              </button>
            </li>
            <li>
              <label
                htmlFor={idArchivo}
                className={`${CLASE_FILA} cursor-pointer focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-naranja-500 ${ocupado ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  id={idArchivo}
                  type="file"
                  accept=".zip,application/zip"
                  className="sr-only"
                  disabled={ocupado !== null}
                  onChange={(e) => {
                    const archivo = e.target.files?.[0];
                    if (archivo) elegirRespaldo(archivo);
                    e.target.value = '';
                  }}
                />
                <Icono nombre="descargar" tamano={20} className="shrink-0 text-acento-texto" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px]">{ocupado === 'importar' ? 'Leyendo respaldo…' : 'Importar respaldo'}</span>
                  <span className="text-[13px] text-tinta-suave">Reemplaza lo que tenés ahora</span>
                </span>
              </label>
            </li>
          </ul>
          {mensaje?.tipo === 'ok' && (
            <p role="status" className="flex items-start gap-2 text-[13px] text-tinta-suave">
              <Icono nombre="check" tamano={16} grosor={2.2} className="mt-px shrink-0 text-acento-texto" />
              {mensaje.texto}
            </p>
          )}
          <MensajeError id="respaldo-error" texto={mensaje?.tipo === 'error' ? mensaje.texto : undefined} />
        </section>

        <section aria-labelledby="titulo-peligro" className="flex flex-col gap-2.5">
          <TituloEtiqueta id="titulo-peligro" etiqueta="Zona" acento="peligrosa" />
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed text-tinta-suave">
              Borra todas las preórdenes, deseos, tiendas e imágenes de este dispositivo. Las categorías vuelven a las de
              siempre.
            </p>
            <Boton className="w-full" onClick={() => {
                setMensaje(null);
                setHoja({ tipo: 'reiniciar', paso: 1 });
              }}>
              <Icono nombre="basura" tamano={18} />
              Reiniciar todo
            </Boton>
          </div>
        </section>
      </div>

      {hoja?.tipo === 'categoria' && <HojaCategoria categoria={hoja.categoria} onCerrar={cerrar} />}
      {hoja?.tipo === 'tienda' && <HojaTienda tienda={hoja.tienda} onCerrar={cerrar} />}

      {hoja?.tipo === 'importar' && (
        <HojaInferior titulo="¿Importar este respaldo?" subtitulo={textoResumen(hoja.respaldo.resumen)} onCerrar={cerrar}>
          <p className="text-[15px] leading-relaxed text-tinta-suave">
            Esto <strong className="font-bold text-tinta">reemplaza todo</strong> lo que tenés ahora en Preordi (
            {textoResumen(actual)}). Si querés conservarlo, exportá un respaldo antes.
          </p>
          <div className="flex gap-2.5">
            <Boton className="flex-1" onClick={cerrar}>
              Volver
            </Boton>
            <Boton
              variante="principal"
              className="flex-1"
              disabled={ocupado !== null}
              onClick={() => importar(hoja.respaldo)}
            >
              {ocupado === 'importar' ? 'Importando…' : 'Reemplazar'}
            </Boton>
          </div>
        </HojaInferior>
      )}

      {hoja?.tipo === 'reiniciar' && hoja.paso === 1 && (
        <HojaInferior titulo="¿Reiniciar todo?" onCerrar={cerrar}>
          <p className="text-[15px] leading-relaxed text-tinta-suave">
            Se borra todo lo que hay en Preordi ({textoResumen(actual)}), además de tus tiendas y categorías
            personalizadas. Antes de seguir, te recomiendo exportar un respaldo.
          </p>
          <div className="flex flex-col gap-2.5">
            <Boton variante="principal" onClick={exportar} disabled={ocupado !== null}>
              <Icono nombre="subir" tamano={18} />
              {ocupado === 'exportar' ? 'Armando respaldo…' : 'Exportar respaldo primero'}
            </Boton>
            <div className="flex gap-2.5">
              <Boton className="flex-1" onClick={cerrar}>
                Volver
              </Boton>
              <Boton className="flex-1" onClick={() => setHoja({ tipo: 'reiniciar', paso: 2 })}>
                Continuar
              </Boton>
            </div>
          </div>
          {mensaje?.tipo === 'ok' && <p className="text-[13px] text-tinta-suave">{mensaje.texto}</p>}
        </HojaInferior>
      )}

      {hoja?.tipo === 'reiniciar' && hoja.paso === 2 && (
        <HojaInferior titulo="¿Seguro?" onCerrar={cerrar}>
          <p className="text-[15px] leading-relaxed text-tinta-suave">
            Esto no se puede deshacer. Solo vas a poder recuperar tus datos si tenés un respaldo.
          </p>
          <div className="flex gap-2.5">
            <Boton className="flex-1" onClick={cerrar}>
              Volver
            </Boton>
            <Boton variante="principal" className="flex-1" disabled={ocupado !== null} onClick={reiniciar}>
              Borrar todo
            </Boton>
          </div>
        </HojaInferior>
      )}
    </main>
  );
}
