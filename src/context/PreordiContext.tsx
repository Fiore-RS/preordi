import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import type { Categoria, DatosPreordi, ID, Preorden, Tienda } from '../types';
import { cargarDatos, guardarDatos } from '../lib/persistencia';

export type Accion =
  | { tipo: 'reemplazar'; datos: DatosPreordi }
  | { tipo: 'guardarPreorden'; preorden: Preorden }
  | { tipo: 'eliminarPreorden'; id: ID }
  | { tipo: 'guardarCategoria'; categoria: Categoria }
  | { tipo: 'eliminarCategoria'; id: ID }
  | { tipo: 'guardarTienda'; tienda: Tienda }
  | { tipo: 'eliminarTienda'; id: ID };

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
  }
}

interface ValorContexto {
  datos: DatosPreordi;
  dispatch: Dispatch<Accion>;
}

const PreordiContext = createContext<ValorContexto | null>(null);

export function PreordiProvider({ children }: { children: ReactNode }) {
  const [datos, dispatch] = useReducer(reducer, undefined, cargarDatos);

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
