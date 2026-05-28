// ════════════════════════════════════════════════════════════════════
//  RecentActivity — "ACTIVIDAD RECIENTE"
//  Linea de tiempo con los eventos mas recientes asociados a las obras
//  del municipio. Los eventos se derivan del dataset publico de obras
//  (PublicObra[]) ya que el backend no expone endpoint dedicado de
//  actividad.
//
//  Reglas de derivacion (1 evento por obra):
//   - status === 'completada'   → "Informe final de obra entregado"
//                                  (fecha = fechaFin)
//   - status === 'retrasada'    → "Alerta de retraso: avance solo X%"
//                                  (fecha = fechaFin)
//   - totalInformes > 0         → "Avance fisico del X% reportado"
//                                  (fecha = hoy - 7d, proxy del ultimo
//                                  informe del supervisor)
//   - default                   → "Obra registrada en sistema"
//                                  (fecha = fechaInicio)
//
//  Los eventos se ordenan por fecha descendente y se muestran hasta 10.
// ════════════════════════════════════════════════════════════════════
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';
import type { PublicObra } from '@/types';

interface RecentActivityProps {
  obras: PublicObra[];
  max?: number;
}

type EventKind = 'informe_final' | 'avance' | 'alerta' | 'registro';

interface ActivityEvent {
  obraId: string;
  obraNombre: string;
  kind: EventKind;
  description: string;
  date: Date;
}

function deriveEvents(obras: PublicObra[]): ActivityEvent[] {
  const today = new Date();
  const out: ActivityEvent[] = [];

  for (const o of obras) {
    const nombre = (o.nombre || '').trim() || 'Obra sin nombre';
    const avance = Math.max(0, Math.min(100, o.avanceFisico ?? 0));

    if (o.status === 'completada') {
      const fecha = o.fechaFin ? new Date(o.fechaFin + 'T00:00:00') : today;
      out.push({
        obraId: o.id,
        obraNombre: nombre,
        kind: 'informe_final',
        description: 'Informe final de obra entregado',
        date: isNaN(fecha.getTime()) ? today : fecha,
      });
      continue;
    }

    if (o.status === 'retrasada') {
      const fecha = o.fechaFin ? new Date(o.fechaFin + 'T00:00:00') : today;
      out.push({
        obraId: o.id,
        obraNombre: nombre,
        kind: 'alerta',
        description: `Alerta de retraso: avance solo ${avance}%`,
        date: isNaN(fecha.getTime()) ? today : fecha,
      });
      continue;
    }

    if ((o.totalInformes ?? 0) > 0) {
      // Proxy temporal: aprox una semana atras (no exponemos la fecha
      // del informe en el endpoint publico)
      const fecha = new Date(today);
      fecha.setDate(fecha.getDate() - 7);
      out.push({
        obraId: o.id,
        obraNombre: nombre,
        kind: 'avance',
        description: `Avance fisico del ${avance}% reportado`,
        date: fecha,
      });
      continue;
    }

    const fecha = o.fechaInicio ? new Date(o.fechaInicio + 'T00:00:00') : today;
    out.push({
      obraId: o.id,
      obraNombre: nombre,
      kind: 'registro',
      description: 'Obra registrada en sistema',
      date: isNaN(fecha.getTime()) ? today : fecha,
    });
  }

  return out.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);

  if (diffMin < 0) {
    // Evento en el futuro (ej. fechaFin posterior a hoy)
    const days = Math.round(-diffMs / 86_400_000);
    if (days < 1) return 'hoy';
    if (days < 30) return `en ${days}d`;
    if (days < 365) return `en ${Math.round(days / 30)}m`;
    return `en ${Math.round(days / 365)}a`;
  }
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `hace ${diffD}d`;
  const diffMo = Math.round(diffD / 30);
  if (diffMo < 12) return `hace ${diffMo}mes`;
  const diffY = Math.round(diffMo / 12);
  return `hace ${diffY}a`;
}

function getEventVisual(kind: EventKind) {
  const size = 14;
  switch (kind) {
    case 'informe_final':
      return {
        icon: <FileText size={size} />,
        color: '#60a5fa',
        bg: 'rgba(96,165,250,0.15)',
        border: 'rgba(96,165,250,0.30)',
        dot: '#60a5fa',
      };
    case 'avance':
      return {
        icon: <Activity size={size} />,
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.15)',
        border: 'rgba(245,158,11,0.30)',
        dot: '#f59e0b',
      };
    case 'alerta':
      return {
        icon: <AlertTriangle size={size} />,
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.15)',
        border: 'rgba(239,68,68,0.30)',
        dot: '#ef4444',
      };
    case 'registro':
    default:
      return {
        icon: <PlusCircle size={size} />,
        color: '#10b981',
        bg: 'rgba(16,185,129,0.15)',
        border: 'rgba(16,185,129,0.30)',
        dot: '#10b981',
      };
  }
}

export function RecentActivity({ obras, max = 10 }: RecentActivityProps) {
  const events = useMemo(() => deriveEvents(obras).slice(0, max), [obras, max]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
      className="glass-panel pointer-events-auto flex flex-col min-h-0"
      style={{ borderRadius: 14 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '12px 14px 10px' }}
      >
        <h2
          className="text-[10px] uppercase tracking-[0.18em] font-semibold flex items-center gap-1.5"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          Actividad Reciente
        </h2>
        <span
          className="text-[9px] uppercase tracking-wider"
          style={{
            color: 'var(--text-muted)',
            padding: '2px 8px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {events.length} eventos
        </span>
      </div>

      {/* Lista */}
      <div
        className="overflow-y-auto custom-scroll flex flex-col"
        style={{
          padding: '0 8px 10px',
          maxHeight: 320,
          gap: 6,
        }}
      >
        {events.length === 0 && (
          <div
            className="text-[11px] text-center"
            style={{ color: 'var(--text-muted)', padding: '12px 0' }}
          >
            Sin actividad reciente
          </div>
        )}
        {events.map((ev) => {
          const v = getEventVisual(ev.kind);
          return (
            <div
              key={`${ev.obraId}-${ev.kind}`}
              className="flex items-start gap-2.5"
              style={{
                padding: '8px 10px',
                borderRadius: 10,
                background: 'rgba(8,12,15,0.45)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  background: v.bg,
                  border: `1px solid ${v.border}`,
                  color: v.color,
                }}
              >
                {v.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[11px] truncate"
                  style={{
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                  }}
                  title={ev.obraNombre}
                >
                  {ev.obraNombre}
                </div>
                <div
                  className="text-[10px] truncate"
                  style={{ color: 'var(--text-secondary)' }}
                  title={ev.description}
                >
                  {ev.description}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: v.dot,
                      boxShadow: `0 0 4px ${v.dot}99`,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {timeAgo(ev.date)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
