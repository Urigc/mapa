// ════════════════════════════════════════════════════════════════════
//  PopupCard — Ficha técnica sobre marcador del mapa
//
//  GALERÍA DE EVIDENCIA FOTOGRÁFICA:
//  Botón "Ver Fotografías" → GET /api/public/obras/<id>/imagenes
//  → 1 imagen de cada uno de los últimos 4 informes distintos.
//
//  BUG FIX v2:
//  - Lightbox montado en document.body vía createPortal para escapar
//    el overflow:hidden / stacking context del popup de Leaflet.
//  - onError en cada <img> con fallback visual + console.warn de la URL
//    para facilitar el diagnóstico de CORS/R2.
// ════════════════════════════════════════════════════════════════════
import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MapPin,
  DollarSign,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ImageOff,
} from 'lucide-react';
import type { PublicObra, ObraStatus, ImagenInforme } from '@/types';
import { fetchImagenesObra } from '@/api/publicClient';
import {
  getStatusColor,
  getStatusLabel,
  formatCurrency,
  formatDateShort,
} from '@/utils/coordinates';

// ────────────────────────────────────────────────────────────────
//  pickGalleryImages
//  Devuelve ≤4 imágenes, una por cada uno de los últimos 4 informes
//  distintos. El backend ya entrega DESC por fecha_subida.
// ────────────────────────────────────────────────────────────────
function pickGalleryImages(all: ImagenInforme[]): ImagenInforme[] {
  const seen = new Set<string>();
  const result: ImagenInforme[] = [];
  for (const img of all) {
    if (!seen.has(img.informeId)) {
      seen.add(img.informeId);
      result.push(img);
      if (result.length === 4) break;
    }
  }
  return result;
}

// ────────────────────────────────────────────────────────────────
//  StatusIcon
// ────────────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: ObraStatus | string }) {
  const size = 11;
  switch (status) {
    case 'completada':  return <CheckCircle2 size={size} />;
    case 'retrasada':   return <AlertTriangle size={size} />;
    default:            return <Clock size={size} />;
  }
}

// ────────────────────────────────────────────────────────────────
//  ImageWithFallback
//  Muestra la imagen con un fallback si el src falla (CORS, URL
//  incorrecta, bucket privado, etc.) y loggea la URL para debug.
// ────────────────────────────────────────────────────────────────
function ImageWithFallback({
  src,
  alt,
  style,
  onLoad,
}: {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
}) {
  const [errored, setErrored] = useState(false);

  const handleError = useCallback(() => {
    console.warn(
      '[PopupCard] No se pudo cargar la imagen. Verifica:\n' +
      '  1. Que el bucket R2 tenga acceso público habilitado.\n' +
      '  2. Que R2_PUBLIC_URL en el backend sea correcto.\n' +
      '  3. Que los CORS del bucket permitan el origen del mapa.\n' +
      '  URL fallida:', src
    );
    setErrored(true);
  }, [src]);

  if (errored) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          background: 'rgba(255,255,255,0.04)',
          border: '1px dashed rgba(255,255,255,0.10)',
          borderRadius: 7,
          color: 'var(--text-muted)',
        }}
      >
        <ImageOff size={16} />
        <span style={{ fontSize: 9, textAlign: 'center', padding: '0 4px' }}>
          Sin acceso
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onLoad={onLoad}
      onError={handleError}
      loading="lazy"
    />
  );
}

// ────────────────────────────────────────────────────────────────
//  Lightbox — montado en document.body para escapar el stacking
//  context del popup de Leaflet (overflow:hidden, z-index propio).
// ────────────────────────────────────────────────────────────────
function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: ImagenInforme[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);
  const [imgLoaded, setImgLoaded] = useState(false);

  const prev = useCallback(() => {
    setImgLoaded(false);
    setCurrent((c) => (c - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setImgLoaded(false);
    setCurrent((c) => (c + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  const img = images[current];

  const portal = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        // z-index mayor que el popup de Leaflet (z-index 700) y el HUD (1000)
        zIndex: 99999,
        background: 'rgba(4,7,11,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          color: '#e8ecf1',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100,
        }}
      >
        <X size={16} />
      </button>

      {/* Imagen central */}
      <motion.div
        key={current}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: 'min(90vw, 640px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {!imgLoaded && (
          <div
            style={{
              width: 320,
              height: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Loader2 size={28} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        <ImageWithFallback
          src={img.url}
          alt={img.nombreOriginal}
          onLoad={() => setImgLoaded(true)}
          style={{
            display: imgLoaded ? 'block' : 'none',
            maxWidth: '100%',
            maxHeight: 'min(70vh, 420px)',
            borderRadius: 10,
            border: '1px solid rgba(59,130,246,0.2)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            objectFit: 'contain',
          }}
        />

        {imgLoaded && (
          <div
            style={{
              color: 'rgba(148,163,184,0.7)',
              fontSize: 10,
              textAlign: 'center',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {img.nombreOriginal}&nbsp;·&nbsp;{current + 1} / {images.length}
          </div>
        )}
      </motion.div>

      {/* Navegación (solo si hay > 1 imagen) */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              color: '#e8ecf1',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              color: '#e8ecf1',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </motion.div>
  );

  // ★ Portal: monta el overlay en document.body, fuera del popup de Leaflet
  return createPortal(portal, document.body);
}

// ────────────────────────────────────────────────────────────────
//  GallerySection
// ────────────────────────────────────────────────────────────────
type GalleryState = 'idle' | 'loading' | 'loaded' | 'error';

function GallerySection({ obraId }: { obraId: string }) {
  const [state, setState] = useState<GalleryState>('idle');
  const [images, setImages] = useState<ImagenInforme[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fetchedRef = useRef(false);

  const load = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setState('loading');
    try {
      const all = await fetchImagenesObra(obraId);
      setImages(pickGalleryImages(all));
      setState('loaded');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al cargar imágenes');
      setState('error');
    }
  }, [obraId]);

  // ── Botón inicial ──────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div style={{ padding: '0 14px 14px' }}>
        <button
          onClick={load}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '7px 0',
            borderRadius: 8,
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.22)',
            color: '#3b82f6',
            fontSize: 11,
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'rgba(59,130,246,0.08)')
          }
        >
          <Camera size={12} />
          Ver Fotografías
        </button>
      </div>
    );
  }

  // ── Cargando ───────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div style={{ padding: '0 14px 14px' }}>
        <div
          style={{
            width: '100%',
            padding: '10px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderRadius: 8,
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.14)',
            color: 'rgba(148,163,184,0.7)',
            fontSize: 10,
          }}
        >
          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          Cargando imágenes...
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div style={{ padding: '0 14px 14px' }}>
        <div
          style={{
            width: '100%',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderRadius: 8,
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.18)',
            color: '#ef4444',
            fontSize: 10,
          }}
        >
          <AlertTriangle size={11} />
          {errorMsg || 'No se pudieron cargar las imágenes'}
        </div>
      </div>
    );
  }

  // ── Cargado — sin imágenes ─────────────────────────────────
  if (state === 'loaded' && images.length === 0) {
    return (
      <div style={{ padding: '0 14px 14px' }}>
        <div
          style={{
            width: '100%',
            padding: '10px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(148,163,184,0.7)',
            fontSize: 10,
          }}
        >
          <ImageOff size={12} />
          Sin fotografías registradas
        </div>
      </div>
    );
  }

  // ── Cargado — grid de miniaturas ───────────────────────────
  return (
    <>
      <div
        style={{
          padding: '0 14px 14px',
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(images.length, 4)}, 1fr)`,
          gap: 5,
        }}
      >
        {images.map((img, idx) => (
          <motion.button
            key={img.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.06, duration: 0.2 }}
            onClick={() => setLightboxIndex(idx)}
            style={{
              padding: 0,
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 7,
              overflow: 'hidden',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)',
              aspectRatio: '1 / 1',
            }}
          >
            <ImageWithFallback
              src={img.url}
              alt={img.nombreOriginal}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 0.25s',
              }}
            />
          </motion.button>
        ))}
      </div>

      {/* ★ Lightbox via Portal — escapa del DOM del popup Leaflet */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={images}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ────────────────────────────────────────────────────────────────
//  Row helper
// ────────────────────────────────────────────────────────────────
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
        style={{ color: 'var(--text-primary)', fontWeight: textBold ? 700 : 400 }}
        title={text}
      >
        {text}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//  PopupCard — exportado
// ────────────────────────────────────────────────────────────────
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
        style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
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

      {/* Título */}
      <div style={{ padding: '12px 14px 8px' }}>
        <h3
          className="text-[15px] font-bold leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          {obra.nombre || 'Obra sin nombre'}
        </h3>
      </div>

      {/* Datos */}
      <div style={{ padding: '4px 14px 10px' }} className="flex flex-col gap-2.5">
        <Row
          icon={<MapPin size={12} style={{ color: '#3b82f6' }} />}
          text={
            [obra.regionComunidad, obra.regionBarrio].filter(Boolean).join(', ') ||
            'Sin comunidad'
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

      {/* Avance físico */}
      <div style={{ padding: '6px 14px 14px' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Avance físico
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
          style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}
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

      {/* Separador */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 14px' }} />

      {/* Galería */}
      <div style={{ paddingTop: 10 }}>
        <GallerySection obraId={obra.id} />
      </div>
    </div>
  );
}
