import { useParams } from 'react-router';
import { Encabezado } from '../components/molecules/Encabezado';
import { Pendiente } from '../components/molecules/Pendiente';

// Incluye las hojas modales de Registrar pago (8.6) y Cambiar fecha (8.7).
export function DetallePreorden() {
  const { id } = useParams();
  return (
    <main className="mx-auto max-w-lg">
      <Encabezado titulo="Detalle" volverA="/preordenes" />
      <Pendiente seccion={`8.4 (id: ${id ?? '—'})`} />
    </main>
  );
}
