// ════════════════════════════════════════════════════════════════════
//  StatsPanel — Panel lateral izquierdo con metricas globales
//  Replica el muestreo de datos solicitado en las capturas:
//    - Obras Activas (de N totales)
//    - Completadas (X% del total)
//    - Retrasadas (Requieren atencion)
//    - Presupuesto Total (Ejercido: $X.XM)
//    - Promedio de Avance (Avance fisico promedio)
// ════════════════════════════════════════════════════════════════════
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import type { PublicObra } from '@/types';
import { formatCurrency } from '@/utils/coordinates';

interface StatsPanelProps {
  obras: PublicObra[];          // dataset completo (para totales globales)
  filteredObras: PublicObra[];  // dataset filtrado (para el conteo visible)
}

interface StatCardData {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
  sub: string;
  borderTint: string;
}

export function StatsPanel({ obras, filteredObras }: StatsPanelProps) {
  const total = obras.length || 1; // evitar division entre 0

  const activas      = filteredObras.filter((o) => o.status === 'en_progreso' || o.status === 'retrasada').length;
  const completadas  = filteredObras.filter((o) => o.status === 'completada').length;
  const retrasadas   = filteredObras.filter((o) => o.status === 'retrasada').length;

  const presupuestoTotal = filteredObras.reduce((s, o) => s + (o.presupuestoTotal || 0), 0);
  // "Ejercido" = monto ya ejercido segun el avance financiero del ultimo informe
  const presupuestoEjercido = filteredObras.reduce(
    (s, o) => s + (o.presupuestoTotal || 0) * ((o.avanceFinanciero || 0) / 100),
    0,
  );

  const avancePromedio = filteredObras.length
    ? Math.round(filteredObras.reduce((s, o) => s + (o.avanceFisico || 0), 0) / filteredObras.length)
    : 0;

  const pctCompletadas = Math.round((completadas / total) * 100);

  const cards: StatCardData[] = [
    {
      icon: <Clock size={16} />,
      iconColor: '#3b82f6',
      iconBg: 'rgba(59,130,246,0.15)',
      borderTint: 'rgba(59,130,246,0.18)',
      value: String(activas),
      label: 'Obras Activas',
      sub: `de ${obras.length} obras totales`,
    },
    {
      icon: <CheckCircle2 size={16} />,
      iconColor: '#10b981',
      iconBg: 'rgba(16,185,129,0.15)',
      borderTint: 'rgba(16,185,129,0.18)',
      value: String(completadas),
      label: 'Completadas',
      sub: `${pctCompletadas}% del total`,
    },
    {
      icon: <AlertTriangle size={16} />,
      iconColor: '#ef4444',
      iconBg: 'rgba(239,68,68,0.15)',
      borderTint: 'rgba(239,68,68,0.18)',
      value: String(retrasadas),
      label: 'Retrasadas',
      sub: 'Requieren atencion',
    },
    {
      icon: <DollarSign size={16} />,
      iconColor: '#60a5fa',
      iconBg: 'rgba(96,165,250,0.15)',
      borderTint: 'rgba(96,165,250,0.18)',
      value: formatCurrency(presupuestoTotal),
      label: 'Presupuesto Total',
      sub: `Ejercido: ${formatCurrency(presupuestoEjercido)}`,
    },
    {
      icon: <TrendingUp size={16} />,
      iconColor: '#f59e0b',
      iconBg: 'rgba(245,158,11,0.15)',
      borderTint: 'rgba(245,158,11,0.18)',
      value: `${avancePromedio}%`,
      label: 'Promedio de Avance',
      sub: 'Avance fisico promedio',
    },
  ];

  return (
    <aside
      className="fixed z-[1000] flex flex-col gap-3 pointer-events-none"
      style={{
        top: 84,
        bottom: 24,
        left: 12,
        width: 232,
      }}
    >
      <div
        className="glass-panel pointer-events-auto px-4 py-3"
        style={{ borderRadius: 14 }}
      >
        <h2
          className="text-[10px] uppercase tracking-[0.18em] font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          Panel de Control
        </h2>
      </div>

      <div
        className="flex-1 overflow-y-auto pr-1 pointer-events-auto custom-scroll"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div className="flex flex-col gap-3">
          {cards.map((c, i) => (
            <StatCard key={c.label} data={c} index={i} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function StatCard({ data, index }: { data: StatCardData; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.35, ease: 'easeOut' }}
      className="glass-panel px-4 py-3.5"
      style={{
        borderRadius: 14,
        borderColor: data.borderTint,
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div
          className="flex items-center justify-center"
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: data.iconBg,
            color: data.iconColor,
            border: `1px solid ${data.borderTint}`,
          }}
        >
          {data.icon}
        </div>
      </div>
      <div
        className="text-[26px] font-bold leading-none mb-1.5"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        {data.value}
      </div>
      <div
        className="text-[11px] font-medium mb-0.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {data.label}
      </div>
      <div
        className="text-[10px]"
        style={{ color: 'var(--text-muted)' }}
      >
        {data.sub}
      </div>
    </motion.div>
  );
}
