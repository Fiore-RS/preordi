import { useParams, useSearchParams } from 'react-router';
import { Encabezado } from '../components/molecules/Encabezado';
import { Pendiente } from '../components/molecules/Pendiente';

// Sirve para #/preordenes/nueva (con ?estado=deseada desde Deseos) y #/preordenes/:id/editar.
export function EditarPreorden() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const esDeseo = params.get('estado') === 'deseada';
  const titulo = id ? 'Editar preorden' : esDeseo ? 'Nuevo deseo' : 'Nueva preorden';

  return (
    <main className="mx-auto max-w-lg">
      <Encabezado titulo={titulo} volverA={id ? `/preordenes/${id}` : '/'} />
      <Pendiente seccion="8.5" />
    </main>
  );
}
