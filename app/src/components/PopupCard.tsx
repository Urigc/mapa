// ════════════════════════════════════════════════════════════════════
//  PopupCard — Ficha tecnica que aparece al hacer click en un puntero
//  Muestra Estado, Expediente, Nombre, Comunidad (Region), Presupuesto,
//  Constructora, Fechas (inicio + entrega) y barra de Avance Fisico
//  basada en el ultimo informe del supervisor (0% si no hay informes).
//
//  Mapeo a la BD (publico via /api/public/obras):
//   - Region       → obra.regionComunidad + obra.regionBarrio
//   - Presupuesto  → PresupuestoObra.presupuesto_total
//   - Constructora → Constructora.nombre_const
//   - Fecha inicio → Obra.fecha_inicio
//   - Fecha entrega→ Obra.fecha_final
//   - Avance fisico→ Informe.porcentaje_avance_fisico (mas reciente)
//                     0 si totalInformes === 0
// ════════════════════════════════════════════════════════════════════
import {
  MapPin,
  DollarSign,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { PublicObra, ObraStatus } from '@/types';
import {
  getStatusColor,
  getStatusLabel,
  formatCurrency,
  formatDateShort,
} from '@/utils/coordinates';

function StatusIcon({ status }: { status: ObraStatus | string }) {
  const size = 11;
  switch (status) {
    case 'completada':
      return <CheckCircle2 size={size} />;
    case 'retrasada':
      return <AlertTriangle size={size} />;
    case 'en_progreso':
    default:
      return <Clock size={size} />;
  }
}

export function PopupCard({ obra }: { obra: PublicObra }) {
  const statusColor = getStatusColor(obra.status);
  const statusLabel = getStatusLabel(obra.status);
  const avance = Math.max(0, Math.min(100, obra.avanceFisico ?? 0));

  return (
    <div
      className="text-left"
      style={{
        width: 320,
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Header: estado + expediente */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="flex items-center gap-1.5"
          style={{
            padding: '4px 9px',
            borderRadius: 999,
            background: `${statusColor}1A`,
            border: `1px solid ${statusColor}40`,
            color: statusColor,
          }}
        >
          <StatusIcon status={obra.status} />
          <span
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {statusLabel}
          </span>
        </div>
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {obra.expediente || '—'}
        </span>
      </div>

      {/* Titulo */}
      <div style={{ padding: '12px 14px 8px' }}>
        <h3
          className="text-[15px] font-bold leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          {obra.nombre || 'Obra sin nombre'}
        </h3>
      </div>

      {/* Datos (Region, Presupuesto, Constructora, Fechas) */}
      <div style={{ padding: '4px 14px 10px' }} className="flex flex-col gap-2.5">
        <Row
          icon={<MapPin size={12} style={{ color: '#3b82f6' }} />}
          text={
            [obra.regionComunidad, obra.regionBarrio]
              .filter(Boolean)
              .join(', ') || 'Sin comunidad'
          }
        />
        <Row
          icon={<DollarSign size={12} style={{ color: '#10b981' }} />}
          label="Presupuesto:"
          text={formatCurrency(obra.presupuestoTotal)}
          textBold
        />
        <Row
          icon={<User size={12} style={{ color: '#a78bfa' }} />}
          text={obra.constructoraNombre || 'Constructora sin asignar'}
        />
        <Row
          icon={<Calendar size={12} style={{ color: '#f59e0b' }} />}
          text={`${formatDateShort(obra.fechaInicio)} — ${formatDateShort(obra.fechaFin)}`}
        />
      </div>

      {/* Avance fisico (ultimo informe del supervisor) */}
      <div style={{ padding: '6px 14px 14px' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Avance fisico
          </span>
          <span
            className="text-[13px] font-bold"
            style={{ fontFamily: 'var(--font-display)', color: statusColor }}
          >
            {avance}%
          </span>
        </div>
        <div
          className="overflow-hidden"
          style={{
            height: 5,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              width: `${avance}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${statusColor}AA, ${statusColor})`,
              boxShadow: `0 0 8px ${statusColor}66`,
              transition: 'width 0.8s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  text,
  textBold,
}: {
  icon: React.ReactNode;
  label?: string;
  text: string;
  textBold?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ flexShrink: 0 }}>{icon}</span>
      {label && (
        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
      <span
        className="text-[11px] truncate"
        style={{
          color: 'var(--text-primary)',
          fontWeight: textBold ? 700 : 400,
        }}
        title={text}
      >
        {text}
      </span>
    </div>
  );
}
