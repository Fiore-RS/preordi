import { useCallback, useState } from 'react';
import { Boton } from '../components/atoms/Boton';
import { Icono } from '../components/atoms/Icono';
import { Encabezado } from '../components/molecules/Encabezado';
import { HojaCategoria } from '../components/organisms/HojaCategoria';
import { HojaTienda } from '../components/organisms/HojaTienda';
import { usePreordi } from '../context/PreordiContext';
import { contarUso, moverCategoria } from '../lib/configuracion';
import type { Categoria, Tienda } from '../types';

type Hoja = { tipo: 'categoria'; categoria?: Categoria } | { tipo: 'tienda'; tienda?: Tienda } | null;

const textoUso = (n: number) => (n === 0 ? 'Sin usar' : `${n} ${n === 1 ? 'preorden' : 'preórdenes'}`);

// Especificación 8.9. Respaldo, tema y "reiniciar todo" llegan en las fases 6 y 7.
export function Configuracion() {
  const { datos, dispatch } = usePreordi();
  const [hoja, setHoja] = useState<Hoja>(null);
  const cerrar = useCallback(() => setHoja(null), []);

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
    </main>
  );
}
