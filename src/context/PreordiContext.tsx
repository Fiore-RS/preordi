import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import type { Categoria, DatosPreordi, ID, Preorden, Tienda } from '../types';
import { reasignarCategoria, reasignarTienda } from '../lib/configuracion';
import { limpiarHuerfanas, precargarImagenes } from '../lib/imagenes';
import { cargarDatos, guardarDatos } from '../lib/persistencia';

export type Accion =
  | { tipo: 'reemplazar'; datos: DatosPreordi }
  | { tipo: 'guardarPreorden'; preorden: Preorden }
  | { tipo: 'eliminarPreorden'; id: ID }
  | { tipo: 'guardarCategoria'; categoria: Categoria }
  | { tipo: 'eliminarCategoria'; id: ID }
  | { tipo: 'guardarTienda'; tienda: Tienda }
  | { tipo: 'eliminarTienda'; id: ID }
  /** Nuevo orden de las categorías (Configuración). */
  | { tipo: 'reemplazarCategorias'; categorias: Categoria[] }
  /** Nuevo orden de las tiendas (Configuración): el orden del arreglo es el de los menús. */
  | { tipo: 'reemplazarTiendas'; tiendas: Tienda[] }
  /** Borrar una categoría en uso: primero pasa sus preórdenes a otra (5.7). */
  | { tipo: 'moverYEliminarCategoria'; de: ID; a: ID }
  /** Borrar una tienda en uso: sus preórdenes pasan a otra tienda o a ninguna. */
  | { tipo: 'moverYEliminarTienda'; de: ID; a: ID | null };

function upsert<T extends { id: ID }>(lista: T[], item: T): T[] {
  const i = lista.findIndex((x) => x.id === item.id);
  if (i === -1) return [...lista, item];
  const copia = [...lista];
  copia[i] = item;
  return copia;
}

function reducer(datos: DatosPreordi, accion: Accion): DatosPreordi {
  switch (accion.tipo) {
    case 'reemplazar':
      return accion.datos;
    case 'guardarPreorden':
      return {
        ...datos,
        preordenes: upsert(datos.preordenes, { ...accion.preorden, actualizadaEl: new Date().toISOString() }),
      };
    case 'eliminarPreorden':
      return { ...datos, preordenes: datos.preordenes.filter((p) => p.id !== accion.id) };
    case 'guardarCategoria':
      return { ...datos, categorias: upsert(datos.categorias, accion.categoria) };
    case 'eliminarCategoria':
      // Solo si no está en uso (5.7): la pantalla pide reasignar antes.
      if (datos.preordenes.some((p) => p.categoriaId === accion.id)) return datos;
      return { ...datos, categorias: datos.categorias.filter((c) => c.id !== accion.id) };
    case 'guardarTienda':
      return { ...datos, tiendas: upsert(datos.tiendas, accion.tienda) };
    case 'eliminarTienda':
      if (datos.preordenes.some((p) => p.tiendaId === accion.id)) return datos;
      return { ...datos, tiendas: datos.tiendas.filter((t) => t.id !== accion.id) };
    case 'reemplazarCategorias':
      return { ...datos, categorias: accion.categorias };
    case 'reemplazarTiendas':
      return { ...datos, tiendas: accion.tiendas };
    case 'moverYEliminarCategoria':
      if (accion.de === accion.a || !datos.categorias.some((c) => c.id === accion.a)) return datos;
      return {
        ...datos,
        preordenes: reasignarCategoria(datos.preordenes, accion.de, accion.a, new Date().toISOString()),
        categorias: datos.categorias.filter((c) => c.id !== accion.de),
      };
    case 'moverYEliminarTienda':
      if (accion.de === accion.a) return datos;
      return {
        ...datos,
        preordenes: reasignarTienda(datos.preordenes, accion.de, accion.a, new Date().toISOString()),
        tiendas: datos.tiendas.filter((t) => t.id !== accion.de),
      };
  }
}

interface ValorContexto {
  datos: DatosPreordi;
  dispatch: Dispatch<Accion>;
}

const PreordiContext = createContext<ValorContexto | null>(null);

export function PreordiProvider({ children }: { children: ReactNode }) {
  const [datos, dispatch] = useReducer(reducer, undefined, cargarDatos);

  // Al abrir la app, borra imágenes que ya no pertenecen a ninguna preorden (6.2).
  useEffect(() => {
    const enUso = new Set(datos.preordenes.flatMap((p) => (p.imagenId ? [p.imagenId] : [])));
    limpiarHuerfanas(enUso).catch(() => {
      // Si IndexedDB no está disponible, no hay nada que limpiar.
    });
    // Mientras se ve la pantalla de carga, deja listas las fotos de Inicio, Preórdenes y Deseos para que no parpadeen.
    // Las recibidas y canceladas (el historial, que crece con los años) cargan las suyas al abrirse.
    const visibles = datos.preordenes
      .filter((p) => p.imagenId && (p.estado === 'deseada' || p.estado === 'apartada' || p.estado === 'en_camino'))
      .map((p) => p.imagenId!);
    precargarImagenes(visibles).catch(() => {});
    // Pide que el navegador no borre los datos cuando necesite espacio (6.2).
    navigator.storage?.persist?.().catch(() => {});
    // Solo una vez, con los datos con los que arrancó la app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guarda en localStorage unos 300 ms después del último cambio.
  useEffect(() => {
    const espera = window.setTimeout(() => guardarDatos(datos), 300);
    return () => window.clearTimeout(espera);
  }, [datos]);

  return <PreordiContext.Provider value={{ datos, dispatch }}>{children}</PreordiContext.Provider>;
}

export function usePreordi(): ValorContexto {
  const valor = useContext(PreordiContext);
  if (!valor) throw new Error('usePreordi debe usarse dentro de <PreordiProvider>.');
  return valor;
}
