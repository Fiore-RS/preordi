import { useAplicarTema } from './lib/tema';
import { Navigate, Route, Routes } from 'react-router';
import { LayoutConBarra, LayoutSinBarra } from './components/organisms/LayoutPrincipal';
import { PantallaCarga } from './components/organisms/PantallaCarga';
import { Configuracion } from './pages/Configuracion';
import { Deseos } from './pages/Deseos';
import { DetallePreorden } from './pages/DetallePreorden';
import { EditarPreorden } from './pages/EditarPreorden';
import { Historial } from './pages/Historial';
import { Inicio } from './pages/Inicio';
import { PorPagar } from './pages/PorPagar';
import { Preordenes } from './pages/Preordenes';

// Rutas — especificación sección 7. La pantalla de carga (8.10) va fuera de las rutas.
export default function App() {
  useAplicarTema();
  return (
    <>
      <PantallaCarga />
      <Routes>
        <Route element={<LayoutConBarra />}>
          <Route index element={<Inicio />} />
          <Route path="preordenes" element={<Preordenes />} />
          <Route path="deseos" element={<Deseos />} />
          <Route path="historial" element={<Historial />} />
        </Route>
        <Route element={<LayoutSinBarra />}>
          <Route path="preordenes/nueva" element={<EditarPreorden />} />
          <Route path="preordenes/:id" element={<DetallePreorden />} />
          <Route path="preordenes/:id/editar" element={<EditarPreorden />} />
          <Route path="config" element={<Configuracion />} />
          <Route path="por-pagar" element={<PorPagar />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
