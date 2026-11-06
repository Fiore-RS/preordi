import type { ID } from '../../types';
import { useImagen } from '../../lib/useImagen';
import { Icono } from './Icono';

interface Props {
  imagenId: ID | null;
  /** Tamaño y bordes (ej. "size-[72px] rounded-xl"). */
  className: string;
  /** Fondo y color del marcador cuando no hay imagen (ej. el tono del estado). */
  clasesMarcador: string;
  tamanoIcono?: number;
  /** Texto alternativo. Vacío si el nombre ya está escrito al lado (la imagen es decorativa). */
  alt?: string;
}

/** Imagen de una preorden, o un marcador con ícono si no tiene (o mientras carga). */
export function Miniatura({ imagenId, className, clasesMarcador, tamanoIcono = 24, alt = '' }: Props) {
  const url = useImagen(imagenId);
  if (url) {
    return <img src={url} alt={alt} className={`${className} shrink-0 object-cover`} />;
  }
  return (
    <span aria-hidden="true" className={`${className} flex shrink-0 items-center justify-center ${clasesMarcador}`}>
      <Icono nombre="imagen" tamano={tamanoIcono} grosor={1.6} />
    </span>
  );
}
