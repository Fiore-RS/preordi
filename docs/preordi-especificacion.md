# Preordi — Especificación desde cero

> App personal para llevar orden de mis preórdenes (libros, manga, figuras, merch…): cuánto debo, qué viene pronto y qué ya llegó.

---

## 1. Visión

Preordi es una PWA instalable, sin backend, que registra cada preorden desde que es solo un deseo hasta que la tengo en la mano. Responde rápido tres preguntas:

1. **¿Cuánto debo todavía?** El saldo pendiente total y por preorden.
2. **¿Qué viene pronto?** Las próximas llegadas, y cuáles ya se atrasaron.
3. **¿Qué ya llegó?** Un historial con lo gastado.

No se conecta a ninguna tienda ni banco. Todo se ingresa a mano y en **colones (CRC)**.

Es una app de uso personal (igual que Sobres), así que se prioriza lo funcional: sin mascota ni elementos decorativos que no aporten al uso diario.

---

## 2. Alcance

### MVP
- CRUD de preórdenes con una imagen cada una
- Lista de deseos (estado previo a apartar)
- Registro de pagos: depósito, abonos, saldo y reembolsos
- Tres tipos de pago: depósito + saldo, pago completo y pago al envío
- Fecha estimada con precisión variable (día, mes o trimestre) e historial de reprogramaciones
- Costos extra (envío, courier, aduana)
- Inicio con totales y próximas llegadas
- Historial con estadísticas básicas
- Categorías y tiendas editables
- Exportar e importar respaldo en `.zip` con datos e imágenes
- PWA instalable con íconos y splash propios

### Fuera del MVP (ideas futuras)
- Recordatorios y notificaciones de pagos o llegadas
- Vista de calendario
- Importar respaldo **fusionando** en lugar de reemplazar
- Estadísticas avanzadas (gráficos por mes o tienda)
- Varias imágenes por preorden

---

## 3. Stack y arquitectura

| Pieza | Elección |
|---|---|
| Base | Vite + React 19 + TypeScript |
| Estilos | Tailwind v4, con tokens de color en `src/index.css` vía `@theme` |
| PWA | `vite-plugin-pwa` |
| Ruteo | React Router con `HashRouter` (por GitHub Pages) |
| Estado | React Context + reducer |
| Datos | `localStorage` (texto) |
| Imágenes | IndexedDB con `idb-keyval` |
| Respaldo | `.zip` con `fflate` |
| Despliegue | GitHub Actions → `fiore-rs.github.io/preordi` |

### Estructura de carpetas

```
preordi/
├─ .github/workflows/deploy.yml
├─ docs/
│  └─ preordi-especificacion.md
├─ public/                  # íconos, splash, manifest assets
├─ src/
│  ├─ assets/
│  ├─ components/
│  │  ├─ atoms/
│  │  ├─ molecules/
│  │  └─ organisms/
│  ├─ context/
│  │  └─ PreordiContext.tsx
│  ├─ lib/
│  │  ├─ calculos.ts        # totales, saldo, estado de pago
│  │  ├─ estados.ts         # transiciones permitidas
│  │  ├─ fechas.ts          # precisión, fin de periodo, formato
│  │  ├─ dinero.ts          # formato CRC
│  │  ├─ imagenes.ts        # compresión + IndexedDB
│  │  ├─ persistencia.ts    # localStorage + migraciones
│  │  └─ respaldo.ts        # exportar/importar .zip
│  ├─ pages/
│  ├─ types/
│  │  └─ index.ts
│  ├─ App.tsx
│  ├─ index.css
│  └─ main.tsx
├─ index.html
├─ package.json
└─ vite.config.ts
```

> Se puede reutilizar casi todo el esqueleto de Sobres: configuración de Vite, PWA, workflow de Actions y patrón de persistencia con Context.

---

## 4. Modelo de datos

Los montos son **enteros en colones**. Las fechas son strings ISO locales `YYYY-MM-DD`, sin hora, para evitar problemas de zona horaria. Los timestamps de auditoría (`creadaEl`, `actualizadaEl`) son ISO completos.

```ts
// src/types/index.ts

export type ID = string; // crypto.randomUUID()

/** Etapa logística de la preorden. */
export type Estado =
  | 'deseada' // en lista de deseos, aún no apartada
  | 'apartada' // ya hice la preorden
  | 'en_camino' // la tienda la despachó / ya salió
  | 'recibida' // la tengo en la mano
  | 'cancelada'; // la cancelé yo o la tienda

/** Cómo se paga esta preorden (define el flujo al apartar). */
export type TipoPago =
  | 'deposito' // parte al apartar, resto al llegar
  | 'completo' // todo al apartar
  | 'al_envio'; // nada al apartar, todo al despachar (ej. Amazon)

/** Qué tan precisa es la fecha que dio la tienda. */
export type Precision = 'dia' | 'mes' | 'trimestre';

export interface FechaEstimada {
  /** Para 'mes' = primer día del mes; para 'trimestre' = primer día del trimestre. */
  fecha: string;
  precision: Precision;
}

export type TipoMovimiento = 'deposito' | 'abono' | 'saldo' | 'reembolso';

export interface Pago {
  id: ID;
  fecha: string;
  /** Entero > 0, siempre positivo. 'reembolso' resta al total pagado. */
  monto: number;
  tipo: TipoMovimiento;
  nota?: string;
}

export interface CostoExtra {
  id: ID;
  concepto: string;
  monto: number;
}

export interface CambioFecha {
  id: ID;
  /** Día en que me enteré del cambio. */
  registradoEl: string;
  anterior: FechaEstimada | null;
  nueva: FechaEstimada;
  nota?: string;
}

export interface Preorden {
  id: ID;
  nombre: string;
  categoriaId: ID;
  tiendaId: ID | null;

  estado: Estado;
  tipoPago: TipoPago;

  precio: number;
  costosExtra: CostoExtra[];
  pagos: Pago[];

  fechaEstimada: FechaEstimada | null;
  /** Solo reprogramaciones (no la fecha inicial). */
  historialFechas: CambioFecha[];

  fechaApartada: string | null;
  fechaEnviada: string | null;
  fechaRecibida: string | null;
  fechaCancelada: string | null;

  /** Llave en IndexedDB. */
  imagenId: ID | null;
  link?: string;
  /** Texto libre: "$45 al ₡512". */
  referenciaOriginal?: string;
  notas?: string;

  /** ISO completo. */
  creadaEl: string;
  actualizadaEl: string;
}

export interface Categoria {
  id: ID;
  nombre: string;
  emoji?: string;
  orden: number;
}

export interface Tienda {
  id: ID;
  nombre: string;
  link?: string;
  /** Política de depósito, cancelación, etc. */
  notas?: string;
}

export interface DatosPreordi {
  schemaVersion: 1;
  preordenes: Preorden[];
  categorias: Categoria[];
  tiendas: Tienda[];
}

/** Estado de pago calculado a partir de los pagos (no se guarda). */
export type EstadoPago = 'sin_pagar' | 'parcial' | 'completo';
```

### Categorías por defecto
📚 Libro · 📖 Manga · 🧸 Figura · 🎀 Merch · 📦 Otro

No hay tiendas por defecto. La app arranca limpia, sin datos de ejemplo.

### Decisión de diseño: estado logístico ≠ estado de pago

En lugar de un estado "Pagada", hay **dos dimensiones separadas**:
- **Estado** (`Estado`): dónde va la preorden en su camino. Lo cambio yo.
- **Estado de pago**: se **calcula** a partir de los pagos (`sin_pagar`, `parcial` o `completo`).

Así una preorden puede estar *en camino* y *pagada por completo* (caso Amazon), o *apartada* y *pagada por completo* (pago completo), sin estados duplicados.

**"Retrasada"** tampoco es un estado: se calcula (ver 5.4).

---

## 5. Reglas de negocio

### 5.1 Cálculos de dinero (`lib/calculos.ts`)

```ts
costoTotal(p)    = p.precio + Σ p.costosExtra.monto
totalPagado(p)   = Σ pagos (no reembolso) − Σ pagos (reembolso)
saldoPendiente(p)= max(0, costoTotal(p) − totalPagado(p))

estadoPago(p) =
  totalPagado(p) <= 0         → 'sin_pagar'
  saldoPendiente(p) === 0     → 'completo'
  otro caso                   → 'parcial'

progresoPago(p) = min(1, totalPagado(p) / costoTotal(p))   // para la barra
```

- Una preorden `deseada` no tiene pagos. Si se cancela, sus pagos se conservan.
- **Pérdida en cancelada** = `totalPagado(p)` después de los reembolsos. Si es mayor que 0, es dinero que no volvió.

### 5.2 Totales globales

| Indicador | Qué suma |
|---|---|
| **Total pendiente** | `saldoPendiente` de preórdenes en `apartada`, `en_camino` y `recibida` |
| **Comprometido** | `costoTotal` de preórdenes en `apartada` y `en_camino` |
| **Ya pagado (activas)** | `totalPagado` de `apartada` y `en_camino` |
| **Si apartara mis deseos** | `costoTotal` de todas las `deseada` |
| **Gastado en el año X** | `totalPagado` de `recibida` con `fechaRecibida` en el año X |
| **Perdido en canceladas** | `totalPagado` de `cancelada` (si > 0) |

Las `recibida` con saldo mayor que 0 se incluyen en el pendiente, porque puede pasar que la recoja y pague después. En ese caso se muestran con una alerta.

### 5.3 Fechas estimadas (`lib/fechas.ts`)

**Fin de periodo**, usado para ordenar y para detectar atrasos:
- `dia` → la misma fecha
- `mes` → último día del mes
- `trimestre` → último día del trimestre (31 mar, 30 jun, 30 set, 31 dic)

**Formato para mostrar:**
- `dia` → "14 mar 2027"
- `mes` → "mar 2027"
- `trimestre` → "T1 2027"
- sin fecha → "Sin fecha"

**Reprogramar:** cambiar la fecha estimada de una preorden que ya tenía fecha agrega un `CambioFecha` al historial. Poner la primera fecha no cuenta como reprogramación.

### 5.4 Atrasos (calculados)

```ts
vencida(p)      = p.estado ∈ {apartada, en_camino}
                  && p.fechaEstimada
                  && finDePeriodo(p.fechaEstimada) < hoy

reprogramaciones(p) = p.historialFechas.length
```

- **Vencida**: la fecha ya pasó y no ha llegado. Badge de alerta.
- **Reprogramada N veces**: badge informativo, con el historial visible en el detalle.

### 5.5 Transiciones de estado (`lib/estados.ts`)

```
deseada   → apartada | (eliminar)
apartada  → en_camino | recibida | cancelada
en_camino → recibida | cancelada
recibida  → en_camino            (deshacer, con confirmación)
cancelada → apartada             (reactivar, con confirmación)
```

Cada transición fija su fecha (`fechaApartada`, `fechaEnviada`, `fechaRecibida` o `fechaCancelada`) con hoy por defecto, editable. Al deshacer, se limpia la fecha del estado que se abandona.

### 5.6 Flujos de pago según `tipoPago`

**Al apartar** (crear como `apartada` o pasar de `deseada` a `apartada`):

| tipoPago | Qué pasa |
|---|---|
| `deposito` | Pide el monto del depósito (> 0 y < costo total) y crea un `Pago` de tipo `deposito` |
| `completo` | Crea un `Pago` de tipo `saldo` por el costo total |
| `al_envio` | No crea pagos |

**Al pasar a `en_camino`:** si `tipoPago = al_envio` y hay saldo, ofrece "¿Registrar el cobro del envío?" con el monto del saldo precargado.

**Al pasar a `recibida`:** si hay saldo mayor que 0, ofrece "¿Registrar el pago del saldo?" con el saldo precargado. Puedo omitirlo y la preorden queda con alerta de saldo pendiente.

### 5.7 Validaciones

- `nombre` es obligatorio. `precio` es entero mayor que 0. `categoriaId` es obligatorio.
- Todos los montos son enteros positivos. Se aceptan entradas como "45 000" o "45.000" y se normalizan.
- **Un pago no puede superar el saldo pendiente.** Si lo intento, aparece el mensaje: "Supera el saldo por ₡X. ¿Querés agregarlo como costo extra?"
- Un reembolso no puede superar `totalPagado`.
- Al bajar el precio o borrar un costo extra, si `totalPagado > costoTotal` se muestra un aviso de sobrepago, sin bloquear.
- Una categoría o tienda en uso no se puede borrar: se pide reasignar primero.

### 5.8 Dinero (`lib/dinero.ts`)

```ts
new Intl.NumberFormat('es-CR', {
  style: 'currency', currency: 'CRC', maximumFractionDigits: 0,
}).format(monto) // → "₡45 000"
```

---

## 6. Persistencia

### 6.1 Datos de texto — `localStorage`
- Llave única: `preordi:datos`, con un objeto `DatosPreordi`.
- Se guarda después de cada cambio, desde el reducer, con un debounce de unos 300 ms.
- `schemaVersion` permite migraciones futuras en `persistencia.ts`.
- Si no hay datos, se arranca limpio con solo las categorías por defecto.

### 6.2 Imágenes — IndexedDB (`lib/imagenes.ts`)
- Store: `createStore('preordi', 'imagenes')` de `idb-keyval`. Guarda `id → Blob`.
- **Compresión al subir:**
  1. `<input type="file" accept="image/*">` (en el teléfono deja usar cámara o galería)
  2. Se dibuja en un canvas con el lado mayor de **800 px** como máximo
  3. Se exporta a **WebP con calidad 0.8**, o a JPEG 0.85 si el navegador no soporta WebP
  4. Resultado esperado: 40–100 KB por imagen
- Se muestra con `URL.createObjectURL` y se revoca al desmontar.
- Al reemplazar la imagen o eliminar la preorden, se borra el blob.
- **Limpieza de huérfanas** al iniciar: se borran los blobs cuyo id no aparece en ninguna preorden.

### 6.3 Respaldo (`lib/respaldo.ts`)

**Exportar** genera `preordi-respaldo-YYYY-MM-DD.zip` con:
```
datos.json          # DatosPreordi
imagenes/<id>.webp  # una por imagenId
```

**Importar:**
1. Elegir el `.zip`
2. Validar estructura y `schemaVersion`, y migrar si hace falta
3. Mostrar resumen: "N preórdenes, M imágenes. Esto **reemplaza** todo lo actual."
4. Confirmar, reemplazar `localStorage`, limpiar IndexedDB y cargar las imágenes

**Reiniciar:** borra todo con doble confirmación y sugiere exportar antes.

---

## 7. Navegación y rutas

**Barra inferior (4 pestañas):** Inicio · Preórdenes · Deseos · Historial
**Header:** ícono de engranaje para ir a Configuración.
**Botón flotante (+)** en Inicio, Preórdenes y Deseos.

| Ruta | Pantalla |
|---|---|
| `#/` | Inicio |
| `#/preordenes` | Lista de preórdenes |
| `#/preordenes/nueva` | Nueva preorden (`?estado=deseada` desde Deseos) |
| `#/preordenes/:id` | Detalle |
| `#/preordenes/:id/editar` | Editar |
| `#/deseos` | Lista de deseos |
| `#/historial` | Historial |
| `#/config` | Configuración |

Registrar pago, cambiar fecha y cambiar estado se abren como **hojas modales** (bottom sheets) sobre el detalle, no como rutas.

---

## 8. Pantallas

### 8.1 Inicio
- **Tarjeta principal:** total pendiente (grande) y, debajo, comprometido y ya pagado.
- **Chips de resumen:** N apartadas · N en camino · N deseos. Cada uno lleva a su lista filtrada.
- **Alerta** (si hay): "N preórdenes vencidas" y "N recibidas con saldo".
- **Próximas llegadas:** las 5 activas con fecha más cercana (por fin de periodo), con miniatura, nombre, fecha formateada y saldo.
- **Estado vacío:** ícono de caja con "Todavía no hay preórdenes" y botón "Agregar preorden".

### 8.2 Preórdenes (lista)
- **Filtro de estado (tabs):** Activas (`apartada` + `en_camino`, por defecto) · Apartadas · En camino · Todas
- **Filtros extra:** categoría y tienda
- **Orden:** fecha estimada (por defecto, sin fecha al final) · saldo mayor · nombre · más recientes
- **Tarjeta:** imagen cuadrada, nombre, tienda, fecha estimada, saldo, badge de estado de pago y badge de vencida o reprogramada

### 8.3 Deseos
- Cuadrícula de tarjetas con imagen grande
- Total arriba: "Si apartaras todo: ₡X"
- Cada tarjeta tiene el botón **Apartar**, que abre la hoja para elegir tipo de pago y depósito y luego pasa a `apartada`
- Estado vacío: "Tu lista de deseos está vacía" y botón "Agregar deseo"

### 8.4 Detalle de preorden
- Imagen grande (toque para verla completa)
- Nombre, categoría, tienda (con link) y link del producto
- **Bloque de dinero:** costo total (precio + extras desglosados), pagado, saldo y barra de progreso
- **Fecha estimada**, con botón "Cambiar fecha" y el historial de reprogramaciones si lo hay
- **Línea de tiempo de estados** con sus fechas
- **Lista de pagos** (más reciente primero), editable o eliminable con confirmación
- **Acciones:** botón principal según el estado ("Marcar en camino", "Marcar recibida", "Apartar") · Registrar pago · Editar · menú (cambiar estado manualmente, cancelar, eliminar)
- Notas y referencia original

### 8.5 Nueva / Editar preorden
Campos en orden:
1. Imagen (opcional)
2. Nombre *
3. Categoría * (selector y opción "+ Nueva")
4. Tienda (selector, "+ Nueva" o ninguna)
5. Precio * (CRC)
6. Referencia original (opcional, ej. "$45")
7. Estado inicial: **Deseo** o **Ya la aparté** (solo al crear)
8. Si es "Ya la aparté": tipo de pago, monto de depósito (si aplica) y fecha en que se apartó
9. Fecha estimada: precisión (día, mes, trimestre o sin fecha) y su selector correspondiente
10. Costos extra (lista con "+ Agregar")
11. Link y notas

Al editar no se muestran los pasos 7–8. Los pagos se manejan desde el detalle.

### 8.6 Registrar pago (hoja modal)
- Monto, con el botón rápido **"Pagar saldo (₡X)"**
- Tipo: abono · saldo · reembolso. El depósito solo aparece si no hay pagos aún.
- Fecha (hoy por defecto) y nota opcional
- Aplica las validaciones de 5.7

### 8.7 Cambiar fecha estimada (hoja modal)
- Precisión y fecha, más una nota opcional ("La tienda avisó retraso")
- Si ya había fecha, crea un `CambioFecha`

### 8.8 Historial
- Tabs: **Recibidas** · **Canceladas**
- Filtro por año
- **Resumen del año:** total gastado, cantidad recibida y desglose por categoría (barras simples con CSS)
- En Canceladas: total perdido, si lo hay
- Lista ordenada por fecha de recepción o cancelación (más reciente primero)

### 8.9 Configuración
- **Categorías:** crear, renombrar, cambiar emoji, reordenar y borrar (si no están en uso)
- **Tiendas:** crear, editar (nombre, link, notas) y borrar (si no están en uso)
- **Tema:** Sistema · Claro · Oscuro (ver 10.4)
- **Respaldo:** exportar e importar
- **Zona peligrosa:** reiniciar todo
- **Acerca de:** versión y link al repo

### 8.10 Pantalla de carga
Igual que en Sobres y Teleo:
- Aparece al abrir la app, **encima de todo**, mientras la app ya se monta debajo.
- Muestra el **ícono de la caja pulsando** (`animate-pulse`) sobre el fondo de marca.
- Dura **2 s** y luego se desvanece en **250 ms**; después se quita por completo.
- Usa **colores de marca fijos**, no los del tema, para verse igual en modo claro y oscuro.
- Es el **mismo dibujo que las pantallas de arranque de iOS** (`apple-touch-startup-image` en `public/splash/`), así el paso de una a la otra no se nota.
- `aria-hidden="true"`. Con "reducir movimiento" activado, el pulso se desactiva por la regla global de `index.css`.
- Componente: `components/organisms/PantallaCarga.tsx`, montado en `App.tsx` fuera de las rutas.
- Fondo propuesto: `marino-500`, el mismo del ícono. Se define junto con el ícono final.

---

## 9. Ejemplo de cálculo

**Figura de ejemplo** comprada en tienda local:
- Precio ₡45 000, tipo de pago `deposito`, depósito de ₡10 000 al apartar
- Fecha estimada: **mar 2027** (precisión `mes`)

| Momento | Costo total | Pagado | Saldo | Estado de pago |
|---|---|---|---|---|
| Al apartar | ₡45 000 | ₡10 000 | ₡35 000 | parcial |
| Se agrega courier ₡6 500 | ₡51 500 | ₡10 000 | ₡41 500 | parcial |
| Abono ₡15 000 | ₡51 500 | ₡25 000 | ₡26 500 | parcial |
| Al recibir, paga saldo ₡26 500 | ₡51 500 | ₡51 500 | ₡0 | completo |

**Fechas:**
- Fin de periodo de "mar 2027" = 31/03/2027. Si hoy es 01/04/2027 y no ha llegado, queda **vencida**.
- La tienda avisa y la reprogramo a **T2 2027**, lo que crea un `CambioFecha` (mar 2027 → T2 2027). Ya no está vencida y muestra "Reprogramada 1 vez".

**Caso Amazon** (`al_envio`): se aparta con ₡0 pagado y saldo igual al total. Al marcar "en camino", la app ofrece registrar el cobro y la preorden pasa a pago completo.

> Este ejemplo está automatizado en `src/lib/calculos.test.ts` (`npm test`).

---

## 10. Identidad visual

### 10.1 Paleta base

| Color | Hex | Rol |
|---|---|---|
| Naranja | `#E28C00` | Color de marca: botón +, barras de progreso de pago, estado *apartada* |
| Amarillo | `#ECCD00` | Estado *deseada* y lista de deseos |
| Papel | `#FFFDF8` | Fondo en modo claro (blanco apenas cálido) |
| Celeste | `#62AEDC` | Estado *en camino* |
| Marino | `#203856` | Tinta (todo el texto), estado *recibida* y fondo en modo oscuro |

### 10.2 Colores por estado

| Estado | Relleno (claro) | Texto sobre el relleno | Relleno (oscuro) |
|---|---|---|---|
| deseada | `amarillo-100` | `amarillo-900` | `amarillo-500` + texto `marino-500` |
| apartada | `naranja-100` | `naranja-900` | `naranja-500` + texto `marino-500` |
| en_camino | `celeste-100` | `marino-700` | `celeste-500` + texto `marino-700` |
| recibida | `marino-100` | `marino-700` | `marino-300` + texto `marino-900` |
| cancelada | `marino-50` | `marino-400` | `marino-700` + texto `marino-300` |

### 10.3 Reglas de contraste
- Naranja, amarillo y celeste **no se usan como color de texto** sobre fondos claros, porque no alcanzan el contraste mínimo.
- Se usan como **rellenos con texto marino encima**: marino sobre amarillo da unos 7.5:1, sobre celeste 4.9:1 y sobre naranja 4.5:1.
- Para texto de color se usan los tonos oscuros (`-700` / `-900`) de cada escala.
- **Alertas** (vencida, saldo en recibida, eliminar): `naranja-700` con ícono de advertencia. Sin rojo, para no romper la paleta.

### 10.4 Modo oscuro
Igual que en Sobres:
- **Tema** con tres opciones en Configuración: *Sistema* (por defecto), *Claro* y *Oscuro*.
- En *Sistema* sigue `prefers-color-scheme` y **escucha los cambios en tiempo real**: si el teléfono pasa a modo oscuro con la app abierta, la app cambia también.
- Se aplica con la clase `.dark` en `<html>`.
- **Sin destello claro al abrir:** un script corto en `index.html` lee el tema guardado y pone `.dark` antes de pintar la página. La misma lógica vive en el código de la app.
- La etiqueta `<meta name="theme-color">` se crea desde el código con el color de fondo del tema activo, para que la barra del navegador se funda con la app. El manifest no declara colores, así Android usa los del modo del teléfono.
- El tema se guarda en `localStorage` con la llave `preordi:tema`, aparte de los datos: así no cambia el modelo ni hace falta migrar.
- La pantalla de carga (8.10) usa colores de marca fijos y se ve igual en los dos modos.

**Tokens semánticos.** Como en Sobres, los componentes usan colores por **rol** en lugar de colores fijos de la paleta. `.dark` solo redefine esos tokens y toda la app cambia de tema sin tocar ningún componente.

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `fondo` | Fondo de pantalla y de las hojas | `#FFFDF8` (papel) | `#0D1726` (marino-900) |
| `superficie` | Tarjetas, campos, barra inferior | `#FFFFFF` | `#16273D` (marino-700) |
| `superficie-suave` | Segmentados, íconos de tarjeta, hover | `#E9EDF2` (marino-50) | `#203856` (marino-500) |
| `exterior` | Fondo alrededor de la tarjeta en PC | `#E9EDF2` | `#070D16` |
| `tinta` | Texto principal | `#203856` (marino-500) | `#FFFDF8` |
| `tinta-suave` | Texto secundario | `#4A5F7A` (marino-400) | `#94A8C2` (marino-300) |
| `tinta-tenue` | Placeholders | `#94A8C2` | `#4A5F7A` |
| `borde` / `borde-suave` / `borde-fuerte` | Campos y divisores / tarjetas / bordes punteados | `#C9D2DE` / `#E9EDF2` / `#94A8C2` | `#2A4466` / `#1E3350` / `#4A5F7A` |
| `principal` / `principal-texto` | Botón principal, chip seleccionado | `#203856` / `#FFFDF8` | `#FFFDF8` / `#16273D` |
| `acento-texto` | Saldo, links, errores | `#A86600` (naranja-700) | `#F0AE4D` (naranja-300) |
| `acento-tenue` / `acento-tenue-texto` / `acento-borde` | Alertas y opción seleccionada | `#FDF3E3` / `#5C3800` / `#F0AE4D` | `#33240C` / `#FBE0B8` / `#A86600` |
| `resalte` / `resalte-texto` | Pestaña activa, chip "Pagar saldo" | `#FBE0B8` / `#5C3800` | `#E28C00` / `#0D1726` |
| `tono-*` / `tono-*-texto` | Badges y rellenos por estado (amarillo, naranja, celeste, marino, gris) | tono `-100` / texto `-900` | tono `-500` / texto `#0D1726` |
| `tono-amarillo-tenue` / `-texto` | Recuadros grandes de imagen en Deseos | `#FBF1B0` / `#4D4100` | `#2E2A0E` / `#ECCD00` |

- **No cambian entre modos:** el naranja de marca (botón +, logo, barras de progreso, checks del camino), la tarjeta del total pendiente en Inicio y el fondo oscuro detrás de las hojas.
- Los tokens viven en `src/index.css`: en `@theme` los valores claros y en `.dark` los oscuros. Componentes nuevos: usar siempre tokens, nunca la paleta directa, salvo lo de la lista anterior.

### 10.5 Tokens (`src/index.css`)

```css
@theme {
  --color-naranja-50: #FDF3E3;
  --color-naranja-100: #FBE0B8;
  --color-naranja-300: #F0AE4D;
  --color-naranja-500: #E28C00;
  --color-naranja-700: #A86600;
  --color-naranja-900: #5C3800;

  --color-amarillo-50: #FEFAE0;
  --color-amarillo-100: #FBF1B0;
  --color-amarillo-500: #ECCD00;
  --color-amarillo-700: #A88F00;
  --color-amarillo-900: #4D4100;

  --color-celeste-50: #EEF6FB;
  --color-celeste-100: #D3E8F5;
  --color-celeste-300: #94C8E8;
  --color-celeste-500: #62AEDC;
  --color-celeste-700: #2F7FB0;

  --color-marino-50: #E9EDF2;
  --color-marino-100: #C9D2DE;
  --color-marino-300: #94A8C2;
  --color-marino-400: #4A5F7A;
  --color-marino-500: #203856;
  --color-marino-700: #16273D;
  --color-marino-900: #0D1726;

  --color-papel: #FFFDF8;
}
```

### 10.6 Tipografía

| Uso | Fuente | Pesos |
|---|---|---|
| Títulos, wordmark y montos grandes | **Bricolage Grotesque** | 500, 700 |
| Interfaz y texto general | **DM Sans** | 400, 500, 700 |

- Autoalojadas con `@fontsource-variable` para que funcionen offline en la PWA.
- **Todos los montos** usan `tabular-nums`, para que las cifras se alineen en listas y totales.
- Escala base: título de pantalla 28 px · sección 18–20 px · cuerpo 15–16 px · secundario 13–14 px · mínimo 12 px.
- Total pendiente en Inicio: Bricolage 42 px, peso 700.

```css
@theme {
  --font-display: 'Bricolage Grotesque Variable', sans-serif;
  --font-sans: 'DM Sans Variable', sans-serif;
}
```

### 10.7 Componentes base (según los mockups)
- **Botón principal:** relleno `marino-500`, texto `papel`, pill de 50 px de alto. Uno solo por pantalla.
- **Botón secundario:** borde `marino-500` de 1.5 px, fondo transparente.
- **Botón flotante (+):** 60 px, `naranja-500` con ícono `marino-500`.
- **Barra inferior:** 4 pestañas; la activa lleva una pastilla `naranja-100` detrás del ícono.
- **Tarjetas:** fondo blanco, borde `marino-50`, radio 14–18 px.
- **Badges de estado:** pill con los colores de 10.2, 12 px.
- **Áreas táctiles** de al menos 44 px.

### 10.8 Ícono de la app
Una caja sencilla, sin personaje: caja naranja con cinta amarilla sobre fondo marino. Se usa en el ícono de instalación, la pantalla de carga (8.10), los splash de iOS y los estados vacíos. Hay una versión provisional en `public/` (`favicon.svg` y los PNG).

### 10.9 Refinamiento visual (fase 7)

**Objetivo:** que la interfaz se vea hecha a mano y con identidad propia, no como una plantilla genérica. Se mantienen la paleta de la bandera, las fuentes y los tokens; lo que cambia es cómo se usan.

**Lo que hoy se siente genérico:**
- Todo es una tarjeta redondeada con borde fino y el mismo radio, así que las pantallas se ven iguales entre sí
- Botones y filtros en forma de pastilla en todas partes
- La misma estructura en todas las secciones: título, subtítulo gris y lista dentro de una tarjeta
- Mucho texto gris secundario y jerarquía plana: casi todo pesa igual
- Badges en tonos pastel, cajas punteadas y espaciado uniforme
- Íconos de línea genéricos sin ajustes propios

**Direcciones a explorar:**
- **La bandera como motivo:** usar las cinco franjas con intención (bordes, separadores, encabezados, barras de progreso) en vez de solo como colores sueltos
- **Tipografía con más contraste:** títulos más grandes y expresivos con Bricolage Grotesque, números y montos con más presencia, y menos texto auxiliar
- **Menos cajas:** quitar tarjetas donde no hacen falta y dejar que el contenido respire sobre el fondo, con divisores, alineaciones y espacios distintos según la importancia
- **Formas propias:** variar los radios y probar esquinas, etiquetas y botones con una forma reconocible de Preordi
- **Toques de autor:** detalles ilustrados o a mano (estados vacíos, texturas suaves, pequeños gestos), aprovechando que Fiorella ilustra
- **Imágenes protagonistas:** dar más espacio a las fotos de las figuras y libros, que son lo más personal de la app
- **Movimiento con criterio:** pocas animaciones pero con carácter (al marcar recibida, al completar el pago)

**Cómo se trabaja:**
1. Juntar referencias que le gusten a Fiorella (apps, revistas, empaques, tiendas de figuras)
2. Probar dos o tres direcciones sobre Inicio y Detalle antes de tocar el resto
3. Elegir una, documentarla en esta sección y aplicarla pantalla por pantalla, revisando claro y oscuro

**Dirección elegida: A · Vitrina** (a partir de referencias de apps de comida). Las fotos mandan.
- **Títulos de sección:** una etiqueta sólida en mayúsculas más una palabra en Bricolage extrabold naranja (`acento-texto`): "LLEGAN **pronto**", "TAMBIÉN **por pagar**". Átomo `TituloEtiqueta`. Se probó una letra a mano (Caveat), pero se descartó porque se sentía ajena al resto; queda la idea de usar la letra propia de Fiorella más adelante.
- **Montos destacados:** el símbolo ₡ más pequeño y elevado (átomo `Monto`), en Bricolage extrabold.
- **Tarjetas con foto:** altas (196 × 264), la foto de fondo con degradado marino hacia abajo, la fecha en una etiqueta clara arriba, el saldo en amarillo y una esquina naranja con flecha (`TarjetaVitrina`). Sin foto: el color fijo del estado (naranja, celeste o amarillo) con la inicial grande. Los colores no cambian en modo oscuro.
- **Menos cajas:** el resumen de dinero de Inicio ya no va en una tarjeta marino, sino directo sobre el fondo con el número grande. Las filas de lista van sin borde, solo con miniatura.
- **Formas:** menos pastillas. Los chips de estado y los botones son rectángulos redondeados (8–20 px) y las tarjetas con foto, de 22 px.
- **Detalle:** la foto ocupa todo el ancho arriba (340 px) con las esquinas inferiores de 38 px y botones cuadrados claros encima. Debajo van la categoría en etiqueta y el estado en naranja, el nombre, el costo total grande y una fila con Pagado · Saldo · Llega (tocar "Llega" cambia la fecha). Las secciones (Costo *desglosado*, Camino *a casa*, Pagos *hechos*, Notas *para mí*) van sin tarjetas. Sin foto: el color del estado con la inicial gigante (`PortadaSinFoto`).
- **Acción principal:** naranja de marca con texto marino en los dos modos (tokens `principal`). Los botones son rectángulos de 16 px (grandes) y 12 px (chicos), y el botón + es un cuadrado redondeado de 20 px con sombra.

- **Lista de Preórdenes:** filas sin caja separadas por una línea fina, con la portada vertical (76 × 96) a la izquierda, el nombre en Bricolage, el saldo grande a la derecha y abajo el estado y la barra de pago. Las vencidas se marcan en el texto de la fecha (naranja con ícono), no con un badge más.
- **Controles:** la opción activa del control segmentado y los filtros aplicados van sólidos en `tinta`, como las etiquetas. Los badges son rectángulos de 6 px.
- **Pantallas vacías:** sin ícono ni ilustración, solo el título, el texto y el botón de agregar (Inicio, Preórdenes, Deseos e Historial).
- **Deseos:** el total "Si apartaras todo" grande sobre el fondo, sin tarjeta, y una cuadrícula de dos columnas con tarjetas altas (3:4) como las de Inicio: foto de fondo, la categoría arriba y el nombre con el precio en amarillo (`TarjetaDeseo`). El botón "Apartar" va debajo de cada tarjeta.
- **Tarjetas sin foto:** el color del estado sin degradado, con el texto en marino (el degradado oscuro sobre amarillo o naranja se veía sucio).
- **Historial:** el total del año grande sobre el fondo (naranja si es lo perdido en canceladas). POR **categoría** con barras gruesas que recorren los colores de la bandera, y LLEGARON / CANCELADAS **en 2026** con filas sin caja y portada vertical pequeña; las canceladas, en gris y semitransparentes.

Avance: Inicio ✅ · Detalle ✅ · Preórdenes ✅ · Deseos ✅ · pantallas vacías ✅ · Historial ✅

---

## 11. Fases de trabajo

1. **Especificación** ✅ (este documento)
2. **Identidad y diseño:** paleta ✅, tipografía ✅, mockups de las pantallas ✅, ícono
3. **Esqueleto** ✅: repo `preordi`, Vite + PWA, tokens de color y fuentes, rutas y workflow de Pages
4. **Lógica:** tipos ✅, `calculos` ✅, `fechas` ✅, `estados` ✅ y persistencia ✅, verificados con el ejemplo de la sección 9
5. **Pantallas MVP** ✅: las nueve de la sección 8 (Configuración por ahora sin respaldo ni tema, que llegan en las fases 6 y 8)
   - Componentes pasados a los tokens semánticos de 10.4 ✅ (el modo oscuro ya funciona con la clase `.dark`; falta activarlo según el sistema, en la fase 8)
6. **Imágenes y respaldo** ✅: compresión, IndexedDB y `.zip`
7. **Refinamiento visual (10.9):** revisar el diseño general para que se sienta más natural, con más carácter y menos "generado con IA"; va antes del pulido PWA porque el ícono, la pantalla de carga y los splash dependen de la dirección visual que salga de acá
8. **Pulido PWA:** ícono final, pantalla de carga (8.10) y splash de iOS, modo oscuro con selector de tema (10.4) y prueba de instalación en el teléfono
9. **Publicar:** agregar al hub `index`

---

## 12. Pendientes por decidir
- Dirección visual del refinamiento (10.9), a partir de referencias
- Diseño final del ícono (caja)
- Fondo de la pantalla de carga y de los splash de iOS (junto con el ícono final)
