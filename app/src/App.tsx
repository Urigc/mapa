// ════════════════════════════════════════════════════════════════════
//  App — Mapa Inteligente de Obras Publicas
//  Temascaltepec de Gonzalez, Estado de Mexico
//
//  Composicion:
//   - MapProvider (estado global de filtros + obra seleccionada)
//   - SmartMap    (capa base + marcadores + popup por obra)
//   - HeaderBar   (titulo + reloj)
//   - StatsPanel  (izquierda: metricas globales)
//   - FiltersPanel(derecha: busqueda + estado + comunidad)
//   - HudCorners + ScanLine (estetica HUD)
// ════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Popup, useMap, Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { motion } from 'framer-motion';
import { MapProvider, useMapState } from '@/context/MapContext';
import type { PublicObra } from '@/types';
import {
  TEMASCALTEPEC_CENTER,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  getObraCoordinates,
  getStatusColor,
} from '@/utils/coordinates';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';
import * as L from 'leaflet';
import { StatsPanel } from '@/components/StatsPanel';
import { FiltersPanel } from '@/components/FiltersPanel';
import { PopupCard } from '@/components/PopupCard';

const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-obraspublicas.onrender.com';

// ────────────────────────────────────────────────────────────────────
//  API
// ────────────────────────────────────────────────────────────────────

async function fetchObrasPublic(): Promise<PublicObra[]> {
  const res = await fetch(`${API_BASE}/api/public/obras`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'API error');
  return json.data;
}

async function fetchResumenPublic() {
  const res = await fetch(`${API_BASE}/api/public/resumen`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'API error');
  return json.data;
}

// ────────────────────────────────────────────────────────────────────
//  Marcadores con icono custom (por estado)
// ────────────────────────────────────────────────────────────────────

function createCustomIcon(color: string, status: string, obraId: string): L.DivIcon {
  // Icono triangular para retrasada (matchea el screenshot del usuario)
  if (status === 'retrasada') {
    return L.divIcon({
      className: 'custom-marker',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      html: `
        <div data-obra-id="${obraId}" style="
          width: 22px; height: 22px; border-radius: 6px;
          background: ${color};
          border: 2px solid rgba(255,255,255,0.85);
          box-shadow: 0 0 14px ${color}AA, 0 0 28px ${color}55;
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 12px; line-height: 1;
          cursor: pointer;
        ">!</div>
      `,
    });
  }
  return L.divIcon({
    className: 'custom-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `
      <div data-obra-id="${obraId}" style="
        width: 18px; height: 18px; border-radius: 50%;
        background: ${color};
        border: 2px solid rgba(255,255,255,0.85);
        box-shadow: 0 0 12px ${color}AA, 0 0 24px ${color}55;
        cursor: pointer;
      "></div>
    `,
  });
}

function ProjectMarker({
  obra,
  isSelected,
  onSelect,
}: {
  obra: PublicObra;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const color = getStatusColor(obra.status);
  const position = getObraCoordinates(obra.id, obra.regionComunidad, obra.regionBarrio);
  const icon = createCustomIcon(color, obra.status, obra.id);
  const markerRef = useRef<L.Marker | null>(null);

  // El cluster intercepta el click del marker (stopPropagation), así que el bind automático
  // de Leaflet no abre el popup. Lo abrimos imperativamente cuando isSelected cambia.
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    if (isSelected) marker.openPopup();
    else marker.closePopup();
  }, [isSelected]);

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      eventHandlers={{ click: onSelect }}
    >
      <Popup
        closeButton={false}
        autoPan
        autoPanPadding={[24, 24]}
        maxWidth={340}
        minWidth={320}
        className="dark-popup"
      >
        <PopupCard obra={obra} />
      </Popup>
    </Marker>
  );
}

// ────────────────────────────────────────────────────────────────────
//  Map event handler para deseleccionar al hacer click fuera
// ────────────────────────────────────────────────────────────────────

function MapEventHandler({
  obras,
  onSelect,
  onDeselect,
}: {
  obras: PublicObra[];
  onSelect: (obra: PublicObra) => void;
  onDeselect: () => void;
}) {
  // Workaround: react-leaflet-cluster@2.x es incompatible con react-leaflet@5 / React 19,
  // y los eventHandlers del <Marker>, así como `map.on('click')`, no se disparan dentro
  // del cluster (cluster usa stopPropagation). Escuchamos clicks al nivel DOM del contenedor
  // del mapa y resolvemos la obra por el data-obra-id que inyectamos en el icono.
  const map = useMap();
  const obrasRef = useRef(obras);
  obrasRef.current = obras;

  useEffect(() => {
    const container = map.getContainer();
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('.leaflet-popup') || target.closest('.leaflet-control')) return;

      const markerHost = target.closest('.leaflet-marker-icon') as HTMLElement | null;
      if (markerHost) {
        const idEl = markerHost.querySelector('[data-obra-id]') as HTMLElement | null;
        const obraId = idEl?.dataset.obraId ?? markerHost.getAttribute('data-obra-id');
        if (obraId) {
          const obra = obrasRef.current.find((o) => o.id === obraId);
          if (obra) onSelect(obra);
        }
        // Si es un cluster icon (sin data-obra-id), no hacemos nada: Leaflet maneja el zoom.
        return;
      }
      onDeselect();
    };
    container.addEventListener('click', handler);
    return () => container.removeEventListener('click', handler);
  }, [map, onSelect, onDeselect]);

  return null;
}

// ────────────────────────────────────────────────────────────────────
//  Header Bar
// ────────────────────────────────────────────────────────────────────

function HeaderBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] pointer-events-none">
      <div
        className="glass-panel mx-3 mt-3 px-5 py-3 flex items-center justify-between pointer-events-auto"
        style={{ borderRadius: 16 }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.15)' }}
          >
            <MapPin size={16} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <h1
              className="text-[13px] font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Mapa Inteligente — Obras Publicas
            </h1>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Temascaltepec de Gonzalez, Edo. Mex.
            </p>
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-[12px] font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            {time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div
            className="text-[9px] uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            {time.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
//  HUD Corners + Scan Line (estetica)
// ────────────────────────────────────────────────────────────────────

function HudCorners() {
  const c: React.CSSProperties = {
    position: 'fixed',
    width: 24,
    height: 24,
    borderColor: 'rgba(59,130,246,0.25)',
    zIndex: 999,
    pointerEvents: 'none',
  };
  return (
    <>
      <div style={{ ...c, top: 12, left: 12, borderTop: '2px solid', borderLeft: '2px solid' }} />
      <div style={{ ...c, top: 12, right: 12, borderTop: '2px solid', borderRight: '2px solid' }} />
      <div style={{ ...c, bottom: 12, left: 12, borderBottom: '2px solid', borderLeft: '2px solid' }} />
      <div style={{ ...c, bottom: 12, right: 12, borderBottom: '2px solid', borderRight: '2px solid' }} />
    </>
  );
}

function ScanLine() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[998]"
      style={{
        background: 'linear-gradient(to bottom, transparent 50%, rgba(59,130,246,0.015) 50%)',
        backgroundSize: '100% 4px',
      }}
    />
  );
}

// ────────────────────────────────────────────────────────────────────
//  SmartMap — capa de mapa + marcadores, consume filteredObras del context
// ────────────────────────────────────────────────────────────────────

function SmartMap() {
  const { filteredObras, selectedObra, setSelectedObra } = useMapState();

  const createClusterIcon = useCallback((cluster: { getChildCount: () => number }): L.DivIcon => {
    const count = cluster.getChildCount();
    const size = Math.min(Math.max(32, count * 4), 56);
    return L.divIcon({
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      html: `
        <div style="
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: rgba(59,130,246,0.18);
          border: 2px solid rgba(59,130,246,0.45);
          box-shadow: 0 0 16px rgba(59,130,246,0.25);
          display: flex; align-items: center; justify-content: center;
          color: white; font-family: 'Syne', sans-serif;
          font-weight: 700; font-size: ${Math.max(11, size * 0.3)}px;
        ">${count}</div>
      `,
    });
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={TEMASCALTEPEC_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        style={{ width: '100%', height: '100%', background: '#080c0f' }}
        zoomControl
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        <MapEventHandler
          obras={filteredObras}
          onSelect={(obra) =>
            setSelectedObra(selectedObra?.id === obra.id ? null : obra)
          }
          onDeselect={() => setSelectedObra(null)}
        />

        <MarkerClusterGroup
          showCoverageOnHover={false}
          spiderLegPolylineOptions={{ opacity: 0 }}
          iconCreateFunction={createClusterIcon}
          maxClusterRadius={60}
        >
          {filteredObras.map((obra) => (
            <ProjectMarker
              key={obra.id}
              obra={obra}
              isSelected={selectedObra?.id === obra.id}
              onSelect={() =>
                setSelectedObra(selectedObra?.id === obra.id ? null : obra)
              }
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
//  Loading + Error
// ────────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: '#080c0f' }}>
      <Loader2 size={32} className="animate-spin mb-4" style={{ color: '#3b82f6' }} />
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando mapa inteligente...</p>
      <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Conectando con el servidor</p>
    </div>
  );
}

function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-6" style={{ background: '#080c0f' }}>
      <AlertTriangle size={40} className="mb-4" style={{ color: '#ef4444' }} />
      <h2 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
        Error de conexion
      </h2>
      <p className="text-sm text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
        No se pudo cargar la informacion del mapa. Verifica tu conexion a internet.
      </p>
      <p className="text-[10px] mb-6 text-center" style={{ color: 'var(--text-muted)' }}>{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all"
        style={{
          background: 'rgba(59,130,246,0.15)',
          color: '#3b82f6',
          border: '1px solid rgba(59,130,246,0.3)',
        }}
      >
        Reintentar
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
//  Composicion final
// ────────────────────────────────────────────────────────────────────

function AppShell({ obras }: { obras: PublicObra[] }) {
  const { filteredObras } = useMapState();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: '#080c0f' }}
    >
      <SmartMap />
      <HeaderBar />
      <HudCorners />
      <ScanLine />
      <StatsPanel obras={obras} filteredObras={filteredObras} />
      <FiltersPanel obras={obras} />
    </motion.div>
  );
}

export default function App() {
  const [obras, setObras] = useState<PublicObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [obrasData] = await Promise.all([
        fetchObrasPublic(),
        fetchResumenPublic().catch(() => null),
      ]);
      setObras(obrasData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error cargando datos:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen error={error} onRetry={loadData} />;

  return (
    <MapProvider obras={obras}>
      <AppShell obras={obras} />
    </MapProvider>
  );
}
