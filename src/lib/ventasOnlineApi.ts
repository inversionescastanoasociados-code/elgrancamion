/**
 * Cliente API Ventas Online — ver VENTAS_ONLINE_API_DOCS.md (repo raíz)
 */

export const VENTAS_ONLINE_API_BASE = 'https://rifas-backend-production.up.railway.app';
export const VENTAS_ONLINE_API_KEY = 'pk_4f9a8c7e2d1b6a9f3c0d5e7f8a2b4c6d';

export const RESERVA_TOKEN_STORAGE_KEY = 'elgrancamion_reserva_token';
export const ULTIMA_RESERVA_TOKEN_KEY = 'elgrancamion_ultima_reserva_token';

export class VentasOnlineApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'VentasOnlineApiError';
  }
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

export interface RifaPublica {
  id: string;
  nombre: string;
  precio_boleta: string;
  fecha_sorteo: string;
  descripcion: string | null;
  premio_principal: string | null;
  imagen_url: string | null;
  total_boletas: number;
  boletas_vendidas: number;
  boletas_disponibles: string;
}

export interface BoletaDisponible {
  id: string;
  numero: number;
  estado: string;
  qr_url: string | null;
  imagen_url: string | null;
}

export interface BoletasResponse {
  rifa: {
    id: string;
    nombre: string;
    precio_boleta: string;
    total_boletas: number;
    boletas_vendidas: number;
    estado: string;
  };
  boletas: BoletaDisponible[];
  total_disponibles: number;
}

export interface BloqueoResult {
  reserva_token: string;
  bloqueo_hasta: string;
  tiempo_bloqueo_minutos: number;
  boletas: { id: string; numero: number }[];
}

export interface MedioPago {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface ClienteInput {
  nombre: string;
  telefono: string;
  email?: string;
  identificacion?: string;
  direccion?: string;
}

export interface ReservaResult {
  reserva_token: string;
  venta_id: string;
  estado: string;
  monto_total: number;
  boletas: number[];
  cantidad_boletas: number;
  rifa: string;
  precio_boleta: number;
  cliente_nombre: string;
  expires_at: string;
  mensaje: string;
  instrucciones: string[];
}

export interface EstadoReserva {
  estado: 'PENDIENTE' | 'ABONADA' | 'PAGADA' | 'CANCELADA';
  monto_total: number;
  abono_total: number;
  saldo_pendiente: number;
  expires_at: string;
  rifa: string;
  premio: string | null;
  fecha_sorteo: string;
  cliente: string;
  boletas: { numero: number; estado: string }[];
  created_at: string;
}

const apiHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-api-key': VENTAS_ONLINE_API_KEY,
};

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const res = await fetch(`${VENTAS_ONLINE_API_BASE}${endpoint}`, {
    ...options,
    headers: { ...apiHeaders, ...((options.headers as Record<string, string>) || {}) },
  });
  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    const message = json.message || `Error ${res.status}`;
    throw new VentasOnlineApiError(message, res.status);
  }
  return json;
}

export const ventasOnlineApi = {
  getRifas: () => apiCall<RifaPublica[]>('/api/ventas-online/rifas'),

  getBoletas: (rifaId: string) =>
    apiCall<BoletasResponse>(`/api/ventas-online/rifas/${rifaId}/boletas`),

  bloquear: (rifaId: string, boletaIds: string[], tiempoBloqueoMinutos = 15) =>
    apiCall<BloqueoResult>('/api/ventas-online/boletas/bloquear', {
      method: 'POST',
      body: JSON.stringify({
        rifa_id: rifaId,
        boleta_ids: boletaIds,
        tiempo_bloqueo_minutos: tiempoBloqueoMinutos,
      }),
    }),

  liberar: (reservaToken: string) =>
    apiCall<{ boletas_liberadas: number; numeros: number[] }>('/api/ventas-online/boletas/liberar', {
      method: 'POST',
      body: JSON.stringify({ reserva_token: reservaToken }),
    }),

  getMediosPago: () => apiCall<MedioPago[]>('/api/ventas-online/medios-pago'),

  reservar: (body: {
    reserva_token: string;
    cliente: ClienteInput;
    medio_pago_id?: string;
    notas?: string;
  }) =>
    apiCall<ReservaResult>('/api/ventas-online/reservas', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getEstado: (token: string) =>
    apiCall<EstadoReserva>(`/api/ventas-online/reservas/${encodeURIComponent(token)}/estado`),

  /** Consulta historial por cédula (formulario cliente recurrente) */
  consultaCedula: <T>(cedula: string) =>
    apiCall<T>(`/api/ventas-online/consulta/cedula/${encodeURIComponent(cedula)}`),
};

export function saveReservaToken(token: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RESERVA_TOKEN_STORAGE_KEY, token);
    localStorage.setItem(ULTIMA_RESERVA_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearReservaToken() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RESERVA_TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function readReservaToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(RESERVA_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Mensaje amigable según código HTTP de la doc */
export function mensajeErrorVentasOnline(err: unknown): string {
  if (err instanceof VentasOnlineApiError) {
    if (err.status === 429) return `${err.message} Intente de nuevo en unos minutos.`;
    if (err.status === 410) return `${err.message} Vuelve a seleccionar tus números.`;
    if (err.status === 409) return `${err.message} Actualiza la página y elige otros números.`;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Error inesperado. Intente de nuevo.';
}
