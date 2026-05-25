// ════════════════════════════════════════════════════════════════════
//  PopupCard — Ficha tecnica que aparece al hacer click en un puntero
//  Muestra Estado, Expediente, Nombre, Comunidad, Presupuesto,
//  Constructora, Fechas y barra de Avance Fisico.
// ════════════════════════════════════════════════════════════════════
import { MapPin, DollarSign, User, Calendar, ChevronRight } from 'lucide-react';
import type { PublicObra } from '@/types';
import {
  getStatusColor,
  getStatusLabel,
  formatCurrency,
  formatDateShort,
} from '@/utils/coordinates';

export function PopupCard({
  obra,
  onDetails,
}: {
  obra: PublicObra;
  onDetails?: () => void;
}) {
  const statusColor = getStatusColor(obra.status);
  const statusLabel = getStatusLabel(obra.status);

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
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center"
            style={{
              width: 22, height: 22, borderRadius: 7,
              background: `${statusColor}22`,
              border: `1px solid ${statusColor}40`,
              color: statusColor,
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
            }} />
          </span>
          <span
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: statusColor, fontFamily: 'var(--font-display)' }}
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

      {/* Title */}
      <div style={{ padding: '12px 14px 6px' }}>
        <h3
          className="text-[15px] font-bold leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          {obra.nombre || 'Obra sin nombre'}
        </h3>
      </div>

      {/* Datos */}
      <div style={{ padding: '4px 14px 10px' }} className="flex flex-col gap-2">
        <Row
          icon={<MapPin size={12} style={{ color: '#3b82f6' }} />}
          text={[obra.regionComunidad, obra.regionBarrio].filter(Boolean).join(', ') || 'Sin comunidad'}
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

      {/* Avance */}
      <div style={{ padding: '4px 14px 12px' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Avance fisico
          </span>
          <span
            className="text-[12px] font-bold"
            style={{ fontFamily: 'var(--font-display)', color: statusColor }}
          >
            {obra.avanceFisico ?? 0}%
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
              width: `${Math.max(0, Math.min(100, obra.avanceFisico ?? 0))}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${statusColor}AA, ${statusColor})`,
              boxShadow: `0 0 8px ${statusColor}66`,
              transition: 'width 0.8s ease',
            }}
          />
        </div>
      </div>

      {/* Footer actions */}
      <div
        style={{
          padding: '10px 14px 12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          gap: 6,
        }}
      >
        <button
          onClick={onDetails}
          className="flex-1 text-[11px] font-medium transition-all"
          style={{
            padding: '8px 10px',
            borderRadius: 10,
            background: 'rgba(8,12,15,0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          Ver detalle
        </button>
        <button
          onClick={onDetails}
          className="flex items-center justify-center transition-all"
          style={{
            width: 32,
            borderRadius: 10,
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            color: '#60a5fa',
            cursor: 'pointer',
          }}
          aria-label="Detalle"
        >
          <ChevronRight size={14} />
        </button>
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
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
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
