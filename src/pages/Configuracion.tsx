import { useCallback, useId, useState } from 'react';
import { Boton } from '../components/atoms/Boton';
import { Icono } from '../components/atoms/Icono';
import { Encabezado } from '../components/molecules/Encabezado';
import { MensajeError } from '../components/molecules/Campo';
import { HojaCategoria } from '../components/organisms/HojaCategoria';
import { HojaInferior } from '../components/organisms/HojaInferior';
import { HojaTienda } from '../components/organisms/HojaTienda';
import { usePreordi } from '../context/PreordiContext';
import { contarUso, moverCategoria } from '../lib/configuracion';
import { hoy } from '../lib/fechas';
import { borrarTodasLasImagenes } from '../lib/imagenes';
import { datosIniciales } from '../lib/persistencia';
import {
  aplicarImagenes,
  descargar,
  exportarRespaldo,
  leerRespaldo,
  nombreRespaldo,
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

const CLASE_FILA = 'flex min-h-14 w-full items-center gap-3 px-3.5 py-2.5 text-left disabled:opacity-60';

// Especificación 8.9 y 6.3. El selector de tema llega en la fase 8.
export function Configuracion() {
  const { datos, dispatch } = usePreordi();
  const [hoja, setHoja] = useState<Hoja>(null);
  const cerrar = useCallback(() => setHoja(null), []);
  const idArchivo = useId();
  const [ocupado, setOcupado] = useState<'exportar' | 'importar' | 'reiniciar' | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const actual = resumir(datos, datos.preordenes.filter((p) => p.imagenId).length);

  async function exportar() {
    setOcupado('exportar');
    setMensaje(null);
    try {
      descargar(await exportarRespaldo(datos), nombreRespaldo(hoy()));
      setMensaje({ tipo: 'ok', texto: 'Respaldo descargado. Guardalo en un lugar seguro (Drive, iCloud o tu compu).' });
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

  const mover = (id: string, direccion: -1 | 1) =>
    dispatch({ tipo: 'reemplazarCategorias', categorias: moverCategoria(datos.categorias, id, direccion) });

  return (
    <main className="flex flex-1 flex-col">
      <Encabezado titulo="Configuración" volverA="/" />

      <div className="flex flex-col gap-7 px-5 pt-2 pb-10">
        <section aria-labelledby="titulo-categorias" className="flex flex-col gap-2.5">
          <h2 id="titulo-categorias" className="text-lg font-bold">
            Categorías
          </h2>
          <ul className="rounded-2xl border border-borde-suave bg-superficie">
            {categorias.map((c, i) => (
              <li key={c.id} className="flex items-center border-b border-borde-suave last:border-b-0">
                <button
                  type="button"
                  onClick={() => setHoja({ tipo: 'categoria', categoria: c })}
                  aria-label={`Editar ${c.nombre}`}
                  className="flex min-h-14 min-w-0 flex-1 flex-col justify-center px-3.5 text-left"
                >
                  <span className="truncate text-[15px]">{c.nombre}</span>
                  <span className="text-[13px] text-tinta-suave">{textoUso(uso.categorias.get(c.id) ?? 0)}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Subir ${c.nombre}`}
                  disabled={i === 0}
                  onClick={() => mover(c.id, -1)}
                  className="flex size-11 items-center justify-center rounded-full text-tinta-suave hover:bg-superficie-suave disabled:opacity-30"
                >
                  <Icono nombre="arriba" tamano={18} grosor={2} />
                </button>
                <button
                  type="button"
                  aria-label={`Bajar ${c.nombre}`}
                  disabled={i === categorias.length - 1}
                  onClick={() => mover(c.id, 1)}
                  className="mr-1 flex size-11 items-center justify-center rounded-full text-tinta-suave hover:bg-superficie-suave disabled:opacity-30"
                >
                  <Icono nombre="abajo" tamano={18} grosor={2} />
                </button>
              </li>
            ))}
          </ul>
          <Boton variante="discreto" tamano="chico" className="self-start" onClick={() => setHoja({ tipo: 'categoria' })}>
            + Agregar categoría
          </Boton>
        </section>

        <section aria-labelledby="titulo-tiendas" className="flex flex-col gap-2.5">
          <h2 id="titulo-tiendas" className="text-lg font-bold">
            Tiendas
          </h2>
          {datos.tiendas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-borde px-4 py-4 text-sm text-tinta-suave">
              Todavía no agregaste tiendas. También podés crearlas al registrar una preorden.
            </p>
          ) : (
            <ul className="rounded-2xl border border-borde-suave bg-superficie">
              {datos.tiendas.map((t) => (
                <li key={t.id} className="border-b border-borde-suave last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setHoja({ tipo: 'tienda', tienda: t })}
                    aria-label={`Editar ${t.nombre}`}
                    className="flex min-h-14 w-full items-center gap-3 px-3.5 py-2.5 text-left"
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[15px]">{t.nombre}</span>
                      <span className="truncate text-[13px] text-tinta-suave">
                        {t.notas || textoUso(uso.tiendas.get(t.id) ?? 0)}
                      </span>
                    </span>
                    <Icono nombre="editar" tamano={18} className="shrink-0 text-tinta-suave" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Boton variante="discreto" tamano="chico" className="self-start" onClick={() => setHoja({ tipo: 'tienda' })}>
            + Agregar tienda
          </Boton>
        </section>

        <section aria-labelledby="titulo-respaldo" className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-0.5">
            <h2 id="titulo-respaldo" className="text-lg font-bold">
              Respaldo
            </h2>
            <p className="text-[13px] text-tinta-suave">
              Un .zip con tus preórdenes, deseos, categorías, tiendas e imágenes.
            </p>
          </div>
          <ul className="rounded-2xl border border-borde-suave bg-superficie">
            <li className="border-b border-borde-suave">
              <button type="button" onClick={exportar} disabled={ocupado !== null} className={CLASE_FILA}>
                <Icono nombre="descargar" tamano={20} className="shrink-0 text-acento-texto" />
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
                <Icono nombre="subir" tamano={20} className="shrink-0 text-acento-texto" />
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
          <h2 id="titulo-peligro" className="text-lg font-bold">
            Zona peligrosa
          </h2>
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-borde-fuerte px-4 py-4">
            <p className="text-sm leading-relaxed text-tinta-suave">
              Borra todas las preórdenes, deseos, tiendas e imágenes de este dispositivo. Las categorías vuelven a las de
              siempre.
            </p>
            <Boton tamano="chico" className="self-start" onClick={() => {
                setMensaje(null);
                setHoja({ tipo: 'reiniciar', paso: 1 });
              }}>
              <Icono nombre="basura" tamano={16} />
              Reiniciar todo
            </Boton>
          </div>
        </section>

        <section aria-labelledby="titulo-acerca" className="flex flex-col items-center gap-1.5 pt-4 text-center">
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-naranja-500 text-marino-500">
            <Icono nombre="caja" tamano={22} grosor={2} />
          </span>
          <h2 id="titulo-acerca" className="text-base font-bold">
            Preordi
          </h2>
          <p className="text-[13px] text-tinta-suave">Tus datos se guardan solo en este dispositivo.</p>
          <a
            href="https://github.com/Fiore-RS/preordi"
            target="_blank"
            rel="noreferrer"
            className="text-[13px] font-medium text-acento-texto underline underline-offset-4"
          >
            Ver código en GitHub
          </a>
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
              <Icono nombre="descargar" tamano={18} />
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
