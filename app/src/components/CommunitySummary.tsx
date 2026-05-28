// ════════════════════════════════════════════════════════════════════
//  CommunitySummary — "POR COMUNIDAD"
//  Resumen de obras por comunidad con barra apilada de colores que
//  muestra la distribucion de estados (completada / en_progreso /
//  retrasada). Cada fila ademas funciona como filtro de comunidad.
//
//  Fuente: dataset filtrado de obras (PublicObra[]) provisto via MapContext.
//   - Comunidad = obra.regionComunidad
//   - Estados   = obra.status
//   - El conteo "N obra(s)" usa la cantidad de obras por comunidad.
// ════════════════════════════════════════════════════════════════════
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, MapPin } from 'lucide-react';
import { useMapState } from '@/context/MapContext';
import type { PublicObra, ObraStatus } from '@/types';
import { getStatusColor } from '@/utils/coordinates';

interface CommunitySummaryProps {
  obras: PublicObra[]; // dataset completo (sin filtrar) para construir el catalogo
}

interface ComunidadStats {
  name: string;
  total: number;
  completada: number;
  en_progreso: number;
  retrasada: number;
}

const STATUS_KEYS: ObraStatus[] = ['completada', 'en_progreso', 'retrasada'];

export function CommunitySummary({ obras }: CommunitySummaryProps) {
  const { filters, setFilters } = useMapState();

  const comunidades = useMemo<ComunidadStats[]>(() => {
    const map = new Map<string, ComunidadStats>();
    for (const o of obras) {
      const key = (o.regionComunidad || '').trim() || '— Sin comunidad —';
      if (!map.has(key)) {
        map.set(key, {
          name: key,
          total: 0,
          completada: 0,
          en_progreso: 0,
          retrasada: 0,
        });
      }
      const entry = map.get(key)!;
      entry.total += 1;
      if (o.status === 'completada') entry.completada += 1;
      else if (o.status === 'en_progreso') entry.en_progreso += 1;
      else if (o.status === 'retrasada') entry.retrasada += 1;
    }
    return Array.from(map.values()).sort(
      (a, b) => b.total - a.total || a.name.localeCompare(b.name),
    );
  }, [obras]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05, duration: 0.35, ease: 'easeOut' }}
      className="glass-panel pointer-events-auto flex flex-col min-h-0"
      style={{ borderRadius: 14 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '12px 14px 10px' }}
      >
        <h2
          className="text-[10px] uppercase tracking-[0.18em] font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          Por Comunidad
        </h2>
        <BarChart3 size={12} style={{ color: 'var(--text-muted)' }} />
      </div>

      {/* Lista */}
      <div
        className="overflow-y-auto custom-scroll flex flex-col"
        style={{
          padding: '2px 8px 10px',
          maxHeight: 280,
          gap: 6,
        }}
      >
        {comunidades.length === 0 && (
          <div
            className="text-[11px] text-center"
            style={{ color: 'var(--text-muted)', padding: '12px 0' }}
          >
            Sin obras registradas
          </div>
        )}
        {comunidades.map((c) => (
          <CommunityRow
            key={c.name}
            stats={c}
            active={filters.region === c.name}
            onToggle={() =>
              setFilters((prev) => ({
                ...prev,
                region: prev.region === c.name ? 'todas' : c.name,
              }))
            }
          />
        ))}
      </div>
    </motion.div>
  );
}

function CommunityRow({
  stats,
  active,
  onToggle,
}: {
  stats: ComunidadStats;
  active: boolean;
  onToggle: () => void;
}) {
  const total = stats.total || 1;

  return (
    <button
      onClick={onToggle}
      className="text-left transition-all w-full"
      style={{
        padding: '8px 10px',
        borderRadius: 10,
        background: active ? 'rgba(59,130,246,0.10)' : 'rgba(8,12,15,0.45)',
        border: `1px solid ${active ? 'rgba(59,130,246,0.30)' : 'rgba(255,255,255,0.05)'}`,
        cursor: 'pointer',
      }}
    >
      {/* Encabezado fila */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <MapPin
          size={11}
          style={{ color: active ? '#3b82f6' : '#60a5fa', flexShrink: 0 }}
        />
        <span
          className="text-[11px] flex-1 truncate"
          style={{
            color: 'var(--text-primary)',
            fontWeight: active ? 600 : 500,
          }}
          title={stats.name}
        >
          {stats.name}
        </span>
        <span
          className="text-[10px] tabular-nums"
          style={{ color: 'var(--text-muted)' }}
        >
          {stats.total} {stats.total === 1 ? 'obra' : 'obras'}
        </span>
      </div>

      {/* Barra apilada por estado */}
      <div
        className="overflow-hidden flex"
        style={{
          height: 5,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.05)',
          marginBottom: 6,
        }}
      >
        {STATUS_KEYS.map((s) => {
          const count = stats[s];
          if (!count) return null;
          const w = (count / total) * 100;
          const color = getStatusColor(s);
          return (
            <div
              key={s}
              style={{
                width: `${w}%`,
                height: '100%',
                background: color,
                boxShadow: `0 0 6px ${color}66 inset`,
              }}
              title={`${s}: ${count}`}
            />
          );
        })}
      </div>

      {/* Conteo por estado (dots) */}
      <div className="flex items-center gap-2.5">
        {STATUS_KEYS.map((s) => {
          const count = stats[s];
          if (!count) return null;
          const color = getStatusColor(s);
          return (
            <div key={s} className="flex items-center gap-1">
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 4px ${color}99`,
                }}
              />
              <span
                className="text-[10px] tabular-nums"
                style={{ color: 'var(--text-secondary)' }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </button>
  );
}
