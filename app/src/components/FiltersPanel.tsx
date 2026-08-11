// ════════════════════════════════════════════════════════════════════
//  FiltersPanel — Panel lateral derecho con busqueda + filtros
//    - Busqueda libre (nombre, expediente, comunidad)
//    - Filtro por estado (pills): Todos, Completadas, En Progreso, Retrasadas
//    - Lista de comunidades con conteo por comunidad
// ════════════════════════════════════════════════════════════════════
import { motion } from 'framer-motion';
import { Search, Filter, CheckCircle2, Clock, AlertTriangle, MapPin } from 'lucide-react';
import { useMemo } from 'react';
import { useMapState } from '@/context/MapContext';
import type { PublicObra, ObraStatus } from '@/types';

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

  // Lista de comunidades unicas con conteo
  const comunidades = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of obras) {
      const key = (o.regionComunidad || '').trim() || '— Sin comunidad —';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [obras]);

  return (
    <aside
      className="fixed z-[1000] flex flex-col gap-3 pointer-events-none"
      style={{
        top: 84,
        bottom: 24,
        right: 12,
        width: 256,
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="glass-panel pointer-events-auto p-4 flex flex-col gap-3"
        style={{ borderRadius: 14 }}
      >
        <h2
          className="text-[10px] uppercase tracking-[0.18em] font-semibold flex items-center gap-1.5"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          <Filter size={11} /> Filtros
        </h2>

        {/* Search */}
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

        {/* Status pills */}
        <div>
          <div
            className="text-[9px] uppercase tracking-wider mb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Estado
          </div>
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
        </div>
      </motion.div>

      {/* Community list */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
        className="glass-panel pointer-events-auto flex flex-col flex-1 min-h-0"
        style={{ borderRadius: 14 }}
      >
        <div className="px-4 pt-4 pb-2">
          <div
            className="text-[9px] uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Comunidad
          </div>
        </div>

        <div className="overflow-y-auto px-2 pb-3 custom-scroll">
          <CommunityRow
            label="Todas las comunidades"
            count={obras.length}
            active={filters.region === 'todas'}
            highlight
            onClick={() => setFilters((p) => ({ ...p, region: 'todas' }))}
          />
          {comunidades.map((c) => (
            <CommunityRow
              key={c.name}
              label={c.name}
              count={c.count}
              active={filters.region === c.name}
              onClick={() => setFilters((p) => ({ ...p, region: c.name }))}
            />
          ))}
        </div>
      </motion.div>
    </aside>
  );
}

function CommunityRow({
  label,
  count,
  active,
  highlight,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 transition-all text-left"
      style={{
        padding: '8px 10px',
        borderRadius: 10,
        background: active
          ? highlight
            ? 'rgba(59,130,246,0.18)'
            : 'rgba(255,255,255,0.04)'
          : 'transparent',
        border: active
          ? `1px solid ${highlight ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.06)'}`
          : '1px solid transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        marginBottom: 2,
        cursor: 'pointer',
      }}
    >
      <MapPin
        size={11}
        style={{ color: active && highlight ? '#3b82f6' : 'var(--text-muted)', flexShrink: 0 }}
      />
      <span className="text-[11px] flex-1 truncate" style={{ fontWeight: active ? 600 : 400 }}>
        {label}
      </span>
      <span
        className="text-[10px] flex items-center justify-center"
        style={{
          minWidth: 22,
          height: 18,
          padding: '0 6px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.05)',
          color: 'var(--text-muted)',
        }}
      >
        {count}
      </span>
    </button>
  );
}
