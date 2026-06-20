export type ObraStatus = 'completada' | 'en_progreso' | 'retrasada';

export interface PublicObra {
  id: string;
  expediente: string;
  nombre: string;
  descripcion: string;
  beneficiarios: string;
  fechaInicio: string;
  fechaFin: string;
  status: ObraStatus;
  avanceFisico: number;
  avanceFinanciero: number;
  presupuestoTotal: number;
  regionId: string;
  regionComunidad: string;
  regionBarrio: string;
  constructoraNombre: string;
  constructoraTipo: string;
  supervisorNombre: string;
  totalInformes: number;
  // ISO-8601 del informe más reciente, o null si no tiene ninguno
  ultimoInformeFecha: string | null;
}

export interface Region {
  id: string;
  comunidad: string;
  barrio: string;
  colonia?: string | null;
}

export interface PresupuestoPorRegion {
  region: string;
  comunidad: string;
  total: number;
}

export interface ObrasPorStatus {
  status: string;
  count: number;
}

export interface ObraReciente {
  id: string;
  nombre: string;
  fechaInicio: string;
  status: string;
  avanceFisico: number;
}

export interface TopConstructora {
  nombre: string;
  obrasCount: number;
}

export interface ResumenData {
  obrasActivas: number;
  obrasCompletadas: number;
  obrasRetrasadas: number;
  inversionTotal: number;
  avancePromedio: number;
  comunidadesImpactadas: number;
  presupuestoPorRegion: PresupuestoPorRegion[];
  obrasPorStatus: ObrasPorStatus[];
  obrasRecientes: ObraReciente[];
  promedioDuracionDias: number;
  topConstructoras: TopConstructora[];
}

export interface Filters {
  status: ObraStatus | 'todas';
  region: string;
  search: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// ════════════════════════════════════════════════════════════════
//  IMÁGENES DE INFORME (Cloudflare R2)
//  Mapeo 1:1 con ImagenInforme.to_dict() del backend
// ════════════════════════════════════════════════════════════════
export interface ImagenInforme {
  id: string;
  informeId: string;
  url: string;
  rutaR2: string;
  nombreOriginal: string;
  tipoMime: string | null;
  tamanoBytes: number | null;
  fechaSubida: string | null;
}
