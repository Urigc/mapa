// ════════════════════════════════════════════════════════════════════
//  Coordenadas y utilidades del Mapa Inteligente
//  Municipio: Temascaltepec de Gonzalez, Estado de Mexico
// ════════════════════════════════════════════════════════════════════
//
//  Esta version mapea CADA comunidad real del municipio a su coordenada
//  aproximada (lat/lng). Asi un puntero "San Pedro Tenayac" aparece
//  en el suroeste del municipio, no en una posicion aleatoria.
//
//  Como funciona:
//   1. Se normaliza el nombre de la comunidad (minusculas, sin acentos,
//      sin espacios duplicados).
//   2. Se busca primero por igualdad exacta en REGION_COORDINATES.
//   3. Si no hay match, se intenta match parcial (substring).
//   4. Si no hay nada, se cae al hash deterministico anterior dentro
//      de los limites del municipio. (Asi las comunidades aun no
//      registradas tampoco rompen el render.)
//
//  Cada obra se ubica con un offset pequeno (~150-300m) sobre el
//  centro de su comunidad para que multiples obras de la misma
//  comunidad no se apilen exactamente en el mismo pixel.
// ════════════════════════════════════════════════════════════════════

// Limites del municipio (caja envolvente aproximada)
const BOUNDS = {
  minLat: 18.96,
  maxLat: 19.12,
  minLng: -100.14,
  maxLng: -99.96,
};

export const TEMASCALTEPEC_CENTER: [number, number] = [19.0419, -100.0411];

export const DEFAULT_ZOOM = 12;
export const MIN_ZOOM = 10;
export const MAX_ZOOM = 17;

// ────────────────────────────────────────────────────────────────────
//  Catalogo de comunidades del municipio
//  Coordenadas aproximadas (centro de cada comunidad). Si necesitas
//  ajustar una, solo cambia el par [lat, lng] aqui.
// ────────────────────────────────────────────────────────────────────
const REGION_COORDINATES: Record<string, [number, number]> = {
  // Cabecera municipal
  'temascaltepec de gonzalez': [19.0463, -100.0411],
  'temascaltepec':             [19.0463, -100.0411],
  'cabecera municipal':        [19.0463, -100.0411],

  // Comunidades principales del municipio
  'real de arriba':            [19.0017, -100.0489],
  'real de abajo':             [18.9911, -100.0444],
  'san lucas del pulque':      [19.0911, -100.0689],
  'san lucas':                 [19.0911, -100.0689],
  'san pedro tenayac':         [19.0233, -100.1056],
  'san pedro':                 [19.0289, -100.1067],
  'san andres de los gama':    [19.0125, -100.0656],
  'san andres':                [19.0125, -100.0656],
  'san agustin':               [19.0367, -100.0633],
  'san agustin barrio norte':  [19.0389, -100.0617],
  'cieneguillas':              [19.0567, -100.1144],
  'meson viejo':               [19.0789, -100.0211],
  'meson':                     [19.0789, -100.0211],
  'el salitre':                [18.9911, -100.0411],
  'salitre':                   [18.9911, -100.0411],
  'rio grande':                [19.0850, -100.0067],
  'piedra ancha':              [19.0044, -100.0911],
  'cerro gordo':               [19.0967, -100.0244],
  'el maguey':                 [19.0667, -100.0833],
  'carboneras':                [19.0322, -100.0867],
  'la comunidad':              [19.0511, -100.0289],
  'albarranes':                [19.0233, -100.0233],
  'hidalgo':                   [19.0856, -100.1067],
  'la finca':                  [19.0644, -100.0511],
  'el potrero':                [19.0156, -100.0322],
  'tequesquipan':              [19.0089, -100.0144],
  'agua bendita':              [19.0911, -100.0356],
  'la albarrada':              [19.0789, -100.0667],
  'el peñon':                  [19.0667, -100.1011],
  'el penon':                  [19.0667, -100.1011],
  'cuadrilla nueva':           [19.0244, -100.0922],
  'la guacamaya':              [19.0411, -100.1133],
  'cajones':                   [19.0033, -100.0789],
  'la cumbre':                 [19.0989, -100.0789],
};

// Normaliza un string para hacer matching robusto (minusculas, sin
// acentos, sin espacios duplicados)
function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Hash deterministico string -> [0,1] (fallback)
function hash01(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return (Math.abs(hash) % 1000000) / 1000000;
}

/**
 * Devuelve el centro geografico de una comunidad.
 * - Match exacto contra REGION_COORDINATES (normalizado).
 * - Match parcial por substring si no hay exacto.
 * - Fallback: hash deterministico dentro de los limites del municipio.
 */
function getRegionCenter(comunidad: string): [number, number] {
  if (!comunidad) return TEMASCALTEPEC_CENTER;

  const key = normalize(comunidad);

  // 1) Match exacto
  if (REGION_COORDINATES[key]) return REGION_COORDINATES[key];

  // 2) Match parcial: la comunidad de la BD contiene alguna clave conocida
  //    (o viceversa). Se prioriza la coincidencia mas larga.
  let bestMatch: { len: number; coord: [number, number] } | null = null;
  for (const dictKey of Object.keys(REGION_COORDINATES)) {
    if (key.includes(dictKey) || dictKey.includes(key)) {
      const len = Math.min(key.length, dictKey.length);
      if (!bestMatch || len > bestMatch.len) {
        bestMatch = { len, coord: REGION_COORDINATES[dictKey] };
      }
    }
  }
  if (bestMatch) return bestMatch.coord;

  // 3) Fallback: hash deterministico dentro del municipio
  const h1 = hash01(key);
  const h2 = hash01(key + '_salt');
  return [
    BOUNDS.minLat + h1 * (BOUNDS.maxLat - BOUNDS.minLat),
    BOUNDS.minLng + h2 * (BOUNDS.maxLng - BOUNDS.minLng),
  ];
}

/**
 * Devuelve la coordenada de una obra: el centro de su comunidad
 * mas un pequeno offset deterministico (~150-300m) basado en el id
 * de la obra, para que multiples obras en la misma comunidad no se
 * apilen exactamente en el mismo punto.
 */
export function getObraCoordinates(
  obraId: string,
  comunidad: string,
  barrio?: string,
): [number, number] {
  // Si hay barrio, intentamos primero usar la combinacion comunidad+barrio
  // (por ejemplo "San Agustin Barrio Norte" -> coord especifica)
  if (barrio) {
    const combinedKey = normalize(`${comunidad} ${barrio}`);
    if (REGION_COORDINATES[combinedKey]) {
      const [lat, lng] = REGION_COORDINATES[combinedKey];
      const o1 = (hash01(obraId + '_lat') - 0.5) * 0.0014;
      const o2 = (hash01(obraId + '_lng') - 0.5) * 0.0014;
      return [lat + o1, lng + o2];
    }
  }

  const [centerLat, centerLng] = getRegionCenter(comunidad);
  const o1 = (hash01(obraId + '_lat') - 0.5) * 0.0028; // ~150m
  const o2 = (hash01(obraId + '_lng') - 0.5) * 0.0028;
  return [centerLat + o1, centerLng + o2];
}

/**
 * True si la comunidad esta en el catalogo (match exacto o parcial).
 * Util para distinguir entre obras ubicadas con coordenadas reales y
 * obras ubicadas por fallback.
 */
export function isKnownRegion(comunidad: string): boolean {
  const key = normalize(comunidad);
  if (REGION_COORDINATES[key]) return true;
  return Object.keys(REGION_COORDINATES).some(
    (k) => key.includes(k) || k.includes(key),
  );
}

// ────────────────────────────────────────────────────────────────────
//  Helpers de presentacion
// ────────────────────────────────────────────────────────────────────

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completada':  return '#10b981';
    case 'retrasada':   return '#ef4444';
    case 'en_progreso': return '#f59e0b';
    case 'suspendida':  return '#94a3b8';
    default:            return '#3b82f6';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'completada':  return 'Completada';
    case 'retrasada':   return 'Retrasada';
    case 'en_progreso': return 'En Progreso';
    case 'suspendida':  return 'Suspendida';
    default:            return 'Desconocido';
  }
}

export function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return '—';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

export function formatCurrencyLong(amount: number): string {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatDateShort(isoDate: string | null): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).replace('.', '');
}
