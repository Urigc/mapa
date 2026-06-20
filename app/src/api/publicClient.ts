import type { PublicObra, Region, ResumenData, ImagenInforme } from '@/types';

// Use environment variable or fallback to Render backend
const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-obraspublicas.onrender.com';

export async function fetchObrasPublic(): Promise<PublicObra[]> {
  const res = await fetch(`${API_BASE}/api/public/obras`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'API error');
  return json.data;
}

export async function fetchResumenPublic(): Promise<ResumenData> {
  const res = await fetch(`${API_BASE}/api/public/resumen`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'API error');
  return json.data;
}

export async function fetchRegionesPublic(): Promise<Region[]> {
  const res = await fetch(`${API_BASE}/api/public/regiones`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'API error');
  return json.data;
}

// ════════════════════════════════════════════════════════════════
//  Imágenes de una obra (todas las de todos sus informes).
//  Endpoint público — sin autenticación.
//  GET /api/public/obras/<obra_id>/imagenes
// ════════════════════════════════════════════════════════════════
export async function fetchImagenesObra(obraId: string): Promise<ImagenInforme[]> {
  const res = await fetch(`${API_BASE}/api/public/obras/${encodeURIComponent(obraId)}/imagenes`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'API error');
  return json.data as ImagenInforme[];
}
