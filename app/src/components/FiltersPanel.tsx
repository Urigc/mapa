// ════════════════════════════════════════════════════════════════════
//  FiltersPanel — Panel lateral derecho
//    - Bloque "Filtros": busqueda libre + pills de estado
//    - Bloque "Por Comunidad": resumen apilado por comunidad (status)
//    - Bloque "Actividad Reciente": linea de tiempo de eventos derivados
//
//  Los tres bloques comparten el espacio vertical del panel derecho y
//  cada uno tiene scroll propio para mantener visible la totalidad
//  del HUD.
// ════════════════════════════════════════════════════════════════════
import { motion } from 'framer-motion';
import { Search, Filter, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useMapState } from '@/context/MapContext';
import type { PublicObra, ObraStatus } from '@/types';
import { CommunitySummary } from './CommunitySummary';
import { RecentActivity } from './RecentActivity';

interface FiltersPanelProps {
  obras: PublicObra[]; // dataset completo (sin filtrar) para construir el catalogo
}

type StatusPill = {
  key: ObraStatus | 'todas';
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
};

const STATUS_PILLS: StatusPill[] = [
  {
    key: 'todas',
    label: 'Todos',
    icon: <Filter size={11} />,
    color: '#e8ecf1',
    bg: 'rgba(59,130,246,0.18)',
    border: 'rgba(59,130,246,0.35)',
  },
  {
    key: 'completada',
    label: 'Completadas',
    icon: <CheckCircle2 size={11} />,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.30)',
  },
  {
    key: 'en_progreso',
    label: 'En Progreso',
    icon: <Clock size={11} />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.30)',
  },
  {
    key: 'retrasada',
    label: 'Retrasadas',
    icon: <AlertTriangle size={11} />,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.30)',
  },
];

export function FiltersPanel({ obras }: FiltersPanelProps) {
  const { filters, setFilters } = useMapState();

  return (
    <aside
      className="fixed z-[1000] flex flex-col gap-3 pointer-events-none"
      style={{
        top: 84,
        bottom: 24,
        right: 12,
        width: 276,
      }}
    >
      {/* Filtros (compacto) */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="glass-panel pointer-events-auto p-3 flex flex-col gap-2.5"
        style={{ borderRadius: 14 }}
      >
        <h2
          className="text-[10px] uppercase tracking-[0.18em] font-semibold flex items-center gap-1.5"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          <Filter size={11} /> Filtros
        </h2>

        {/* Busqueda */}
        <div className="relative">
          <Search
            size={12}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            placeholder="Buscar obra, expediente..."
            className="w-full text-[11px] outline-none transition-all"
            style={{
              background: 'rgba(8,12,15,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '8px 10px 8px 28px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>

        {/* Pills de estado */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_PILLS.map((p) => {
            const active = filters.status === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setFilters((prev) => ({ ...prev, status: p.key }))}
                className="text-[10px] flex items-center gap-1 transition-all"
                style={{
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: active ? p.bg : 'rgba(8,12,15,0.5)',
                  border: `1px solid ${active ? p.border : 'rgba(255,255,255,0.06)'}`,
                  color: active ? p.color : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {p.icon}
                {p.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Resumen por comunidad */}
      <CommunitySummary obras={obras} />

      {/* Actividad reciente */}
      <RecentActivity obras={obras} />
    </aside>
  );
}
