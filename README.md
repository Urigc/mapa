# Mapa Inteligente — Obras Públicas

Visor geoespacial público que muestra, sobre un mapa interactivo, el desglose en tiempo real de las obras públicas ejecutadas en el municipio de **Temascaltepec de González, Estado de México**. Cada obra se representa como un marcador con estado de avance, presupuesto, constructora, fechas y beneficiarios, agrupado por clústeres y filtrable por estatus, región y búsqueda libre.

Este repositorio contiene **únicamente el frontend** (visor de mapa). Los datos provienen de un backend independiente del ecosistema de Obras Públicas, consumido vía API pública de solo lectura.

---

## ✨ Funcionalidades principales

- **Mapa interactivo** con tema oscuro (CARTO Dark Matter sobre OpenStreetMap) centrado en el municipio.
- **Clustering de marcadores** para mantener legibilidad cuando hay muchas obras cercanas.
- **Ficha emergente (popup)** por obra: expediente, presupuesto, avance físico, constructora, fechas de inicio/fin, beneficiarios, supervisor e informes.
- **Panel de KPIs** flotante: obras activas, completadas, en progreso, retrasadas e inversión total.
- **Filtros** por estatus, región/comunidad y búsqueda de texto (vía contexto global).
- **Geocodificación determinista**: como el backend no almacena coordenadas exactas por obra, el frontend calcula una posición estable (lat/lng) a partir de un hash de la comunidad/región y el ID de la obra, garantizando que cada obra siempre aparezca en el mismo punto sin depender de un servicio externo de geocodificación.

---

## 🧱 Tecnologías

| Capa | Tecnología |
|---|---|
| Build tool | [Vite](https://vitejs.dev/) |
| Framework | React 19 + TypeScript |
| Estilos | Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) (primitivas Radix UI) |
| Mapas | [Leaflet](https://leafletjs.com/) vía `react-leaflet` + `react-leaflet-cluster` |
| Animaciones | Framer Motion |
| Iconografía | lucide-react |
| Formularios / validación | react-hook-form + zod *(infraestructura lista para futuras vistas de captura)* |
| Gráficas | Recharts *(disponible para futuros dashboards de resumen)* |
| Linting | ESLint + typescript-eslint |
| Despliegue | **Netlify** |

---

## 🗂️ Estructura del repositorio

```
mapa/
└── app/                        # Aplicación Vite + React (todo el código vive aquí)
    ├── src/
    │   ├── App.tsx              # Composición del mapa, marcadores, popups, KPIs y carga de datos
    │   ├── main.tsx              # Punto de entrada de React
    │   ├── api/
    │   │   └── publicClient.ts   # Cliente HTTP hacia la API pública del backend
    │   ├── context/
    │   │   └── MapContext.tsx    # Estado global: filtros, obra seleccionada, conteos
    │   ├── types/
    │   │   └── index.ts          # Tipos compartidos (PublicObra, Region, ResumenData, Filters...)
    │   └── utils/
    │       └── coordinates.ts    # Bounding box del municipio + geocodificación determinista
    ├── netlify.toml              # Configuración de build y redirects para Netlify
    ├── tailwind.config.js
    ├── components.json           # Configuración de shadcn/ui
    └── package.json
```

---

## 🔌 Lógica de datos y conexión con el repo de Obras Públicas

Este visor **no tiene base de datos propia**. Todo su contenido se alimenta desde el backend del ecosistema de Obras Públicas (otro repositorio del proyecto), a través de endpoints públicos de solo lectura:

```
GET {VITE_API_URL}/api/public/obras      → listado completo de obras
GET {VITE_API_URL}/api/public/resumen    → KPIs agregados (inversión, avance promedio, etc.)
GET {VITE_API_URL}/api/public/regiones   → catálogo de comunidades/regiones
```

El cliente de estas peticiones vive en `src/api/publicClient.ts`. Si la variable de entorno `VITE_API_URL` no está definida, el cliente recurre por defecto al backend desplegado en Render:

```
https://backend-obraspublicas.onrender.com
```

Esto significa que el repo `mapa` y el repo backend de Obras Públicas son **proyectos independientes que se despliegan por separado**, comunicados únicamente por HTTP/JSON. Cualquier cambio en el modelo de datos del backend (nuevos campos de `PublicObra`, nuevos estatus, etc.) debe reflejarse en `src/types/index.ts` de este repositorio.

```
┌────────────────────┐        HTTPS / REST (solo lectura)        ┌──────────────────────────┐
│   repo: mapa        │ ───────────────────────────────────────▶ │  repo backend Obras       │
│   (este repositorio)│ ◀─────────────────────────────────────── │  Públicas (Render)        │
│   React + Leaflet   │           JSON: obras / resumen           │  API + base de datos       │
└────────────────────┘                                            └──────────────────────────┘
        │
        ▼
   Despliegue en Netlify (sitio estático)
```

---

## 🚀 Despliegue (Netlify)

El proyecto está configurado para desplegarse como sitio estático en **Netlify** mediante `app/netlify.toml`:

```toml
[build]
  command = "npm install --legacy-peer-deps && npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- **Base directory:** `app`
- **Comando de build:** `npm install --legacy-peer-deps && npm run build`
- **Carpeta de publicación:** `app/dist`
- **Redirect SPA:** todas las rutas redirigen a `index.html` (necesario porque es una Single Page Application).

### Variables de entorno en Netlify

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del backend de Obras Públicas | `https://backend-obraspublicas.onrender.com` |

---

## 💻 Desarrollo local

```bash
cd app
npm install --legacy-peer-deps

# Modo desarrollo
npm run dev

# Build de producción
npm run build

# Previsualizar el build
npm run preview

# Lint
npm run lint
```

Para apuntar a un backend distinto (por ejemplo, en local), crea un archivo `app/.env` con:

```
VITE_API_URL=http://localhost:PUERTO
```

---

## 📌 Notas

- Las coordenadas mostradas en el mapa son **aproximadas y deterministas**, no GPS reales tomadas en campo; se calculan a partir del nombre de la comunidad/región y el ID de la obra para mantener consistencia visual.
- El mapa usa capas de [CARTO](https://carto.com/) sobre datos de [OpenStreetMap](https://www.openstreetmap.org/copyright); se debe conservar la atribución correspondiente.
