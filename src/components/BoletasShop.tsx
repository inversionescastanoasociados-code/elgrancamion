'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════
   API CONFIG
═══════════════════════════════════════════════════ */
const API_BASE = 'https://rifas-backend-production.up.railway.app';
const API_KEY = 'pk_4f9a8c7e2d1b6a9f3c0d5e7f8a2b4c6d';
const BOLETAS_PER_PAGE = 60;

const apiHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

/* ═══════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════ */
interface RifaPublica {
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

interface BoletaDisponible {
  id: string;
  numero: number;
  estado: string;
  qr_url: string | null;
  imagen_url: string | null;
}

interface BloqueoResult {
  reserva_token: string;
  bloqueo_hasta: string;
  tiempo_bloqueo_minutos: number;
  boletas: { id: string; numero: number }[];
}

interface MedioPago {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

interface ReservaResult {
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

interface EstadoReserva {
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

/* ── Cédula lookup types ── */
interface CedulaAbonoInfo {
  monto: number;
  moneda: string;
  estado: string;
  referencia: string | null;
  metodo_pago: string;
  notas: string | null;
  fecha: string;
}

interface CedulaBoletaInfo {
  numero: number;
  estado: string;
  qr_hash: string | null;
  qr_url: string | null;
  precio_boleta: number;
  total_pagado_boleta: number;
  saldo_pendiente_boleta: number;
  porcentaje_pagado: number;
  abonos: CedulaAbonoInfo[];
}

interface CedulaVenta {
  venta_id: string;
  rifa_nombre: string;
  premio_principal: string | null;
  fecha_sorteo: string;
  estado_venta: string;
  monto_total: number;
  abono_total: number;
  saldo_pendiente: number;
  medio_pago: string | null;
  created_at: string;
  expires_at: string | null;
  boletas: CedulaBoletaInfo[];
}

interface CedulaLookupResult {
  cliente: {
    nombre: string;
    telefono: string;
    email: string | null;
    identificacion: string;
  };
  ventas: CedulaVenta[];
  total_ventas: number;
}

type ShopStep = 'pick-rifa' | 'auth' | 'selecting' | 'blocking' | 'checkout' | 'reserving' | 'confirmed' | 'status' | 'mi-cuenta';

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);
}

function formatNumero(n: number, totalBoletas: number): string {
  const digits = String(totalBoletas - 1).length;
  return String(n).padStart(digits, '0');
}

/* ═══ Countdown hook — generic ═══ */
function useCountdown(target: Date) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

/* ═══ Bloqueo countdown — minutes + seconds ═══ */
function useBloqueoTimer(bloqueoHasta: string | null) {
  const [remaining, setRemaining] = useState({ minutes: 0, seconds: 0, expired: false, total: 0 });
  useEffect(() => {
    if (!bloqueoHasta) return;
    const calc = () => {
      const diff = new Date(bloqueoHasta).getTime() - Date.now();
      if (diff <= 0) return { minutes: 0, seconds: 0, expired: true, total: 0 };
      return {
        minutes: Math.floor(diff / 60000),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
        total: diff,
      };
    };
    setRemaining(calc());
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [bloqueoHasta]);
  return remaining;
}

/* ═══════════════════════════════════════════════════
   API FUNCTIONS
═══════════════════════════════════════════════════ */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; count?: number }> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...apiHeaders, ...((options.headers as Record<string, string>) || {}) },
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `Error ${res.status}`);
  }
  return json;
}

const api = {
  getRifas: () => apiCall<RifaPublica[]>('/api/ventas-online/rifas'),
  getBoletas: (rifaId: string) =>
    apiCall<{
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
    }>(`/api/ventas-online/rifas/${rifaId}/boletas`),
  bloquear: (rifaId: string, boletaIds: string[]) =>
    apiCall<BloqueoResult>('/api/ventas-online/boletas/bloquear', {
      method: 'POST',
      body: JSON.stringify({ rifa_id: rifaId, boleta_ids: boletaIds, tiempo_bloqueo_minutos: 15 }),
    }),
  liberar: (token: string) =>
    apiCall<{ boletas_liberadas: number; numeros: number[] }>('/api/ventas-online/boletas/liberar', {
      method: 'POST',
      body: JSON.stringify({ reserva_token: token }),
    }),
  getMediosPago: () => apiCall<MedioPago[]>('/api/ventas-online/medios-pago'),
  reservar: (body: {
    reserva_token: string;
    cliente: {
      nombre: string;
      telefono: string;
      email?: string;
      identificacion?: string;
      direccion?: string;
    };
    medio_pago_id?: string;
    notas?: string;
  }) =>
    apiCall<ReservaResult>('/api/ventas-online/reservas', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getEstado: (token: string) =>
    apiCall<EstadoReserva>(`/api/ventas-online/reservas/${token}/estado`),
  consultaCedula: (cedula: string) =>
    apiCall<CedulaLookupResult>(`/api/ventas-online/consulta/cedula/${encodeURIComponent(cedula)}`),
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function BoletasShop() {
  /* ─── Core Data State ─── */
  const [rifas, setRifas] = useState<RifaPublica[]>([]);
  const [rifa, setRifa] = useState<RifaPublica | null>(null);
  const [boletas, setBoletas] = useState<BoletaDisponible[]>([]);
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);
  const [loadingBoletas, setLoadingBoletas] = useState(false);

  /* ─── UI State ─── */
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Cargando rifa...');
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available'>('available');

  /* ─── Selection & Flow State ─── */
  const [selectedIds, setSelectedIds] = useState<Map<string, number>>(new Map()); // id -> numero
  const [step, setStep] = useState<ShopStep>('pick-rifa');
  const [reservaToken, setReservaToken] = useState<string | null>(null);
  const [bloqueoHasta, setBloqueoHasta] = useState<string | null>(null);
  const [reservaResult, setReservaResult] = useState<ReservaResult | null>(null);
  const [estadoReserva, setEstadoReserva] = useState<EstadoReserva | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /* ─── Client Form State ─── */
  const [buyerData, setBuyerData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    identificacion: '',
    direccion: '',
  });
  const [selectedMedioPago, setSelectedMedioPago] = useState<string>('');
  const [notas, setNotas] = useState('');
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});

  /* ─── Lookup token state ─── */
  const [lookupToken, setLookupToken] = useState('');

  /* ─── Cédula lookup state ─── */
  const [lookupCedula, setLookupCedula] = useState('');
  const [cedulaResult, setCedulaResult] = useState<CedulaLookupResult | null>(null);
  const [selectedBoletaView, setSelectedBoletaView] = useState<{ venta: CedulaVenta; boleta: CedulaBoletaInfo } | null>(null);

  /* ─── Auth step state ─── */
  const [isReturningClient, setIsReturningClient] = useState(false);
  const [authCedula, setAuthCedula] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authConfirmed, setAuthConfirmed] = useState(false); // true = client data shown, waiting for confirm

  /* ─── Refs ─── */
  const gridRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);

  /* ─── Derived values ─── */
  const precio = rifa ? parseFloat(rifa.precio_boleta) : 0;
  const totalBoletas = rifa?.total_boletas ?? 10000;
  const selectedCount = selectedIds.size;
  const totalAmount = selectedCount * precio;
  const sorteoDate = useMemo(() => new Date(rifa?.fecha_sorteo || '2026-12-31'), [rifa]);
  const countdown = useCountdown(sorteoDate);
  const bloqueoTimer = useBloqueoTimer(bloqueoHasta);
  const pad = (n: number) => String(n).padStart(2, '0');

  const soldPercent = rifa ? Math.round((rifa.boletas_vendidas / rifa.total_boletas) * 100) : 0;
  const availableCount = rifa ? parseInt(rifa.boletas_disponibles, 10) : 0;

  /* ─── Form validation ─── */
  const formErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    const { nombre, telefono, email, identificacion } = buyerData;
    if (nombre.trim().length > 0 && nombre.trim().length < 2) errors.nombre = 'Mínimo 2 caracteres';
    if (nombre.trim().length > 255) errors.nombre = 'Máximo 255 caracteres';
    if (telefono.trim().length > 0 && telefono.trim().length < 7) errors.telefono = 'Mínimo 7 dígitos';
    if (telefono.trim().length > 20) errors.telefono = 'Máximo 20 caracteres';
    if (telefono.trim() && !/^[0-9+\-() ]+$/.test(telefono.trim())) errors.telefono = 'Solo números, +, -, (, ) y espacios';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Correo no válido';
    if (identificacion.trim().length > 0 && identificacion.trim().length < 4) errors.identificacion = 'Mínimo 4 caracteres';
    return errors;
  }, [buyerData]);

  const isFormValid = buyerData.nombre.trim().length >= 2 && buyerData.telefono.trim().length >= 7 && Object.keys(formErrors).length === 0;

  /* ─── Selected numbers for display ─── */
  const selectedNums = useMemo(() => {
    return Array.from(selectedIds.values()).sort((a, b) => a - b);
  }, [selectedIds]);

  /* ═══════════════════════════════════════════════════
     INITIAL DATA LOAD — Only fetch rifas list
  ═══════════════════════════════════════════════════ */
  useEffect(() => {
    let cancelled = false;

    async function loadRifas() {
      try {
        setLoading(true);
        setLoadingMsg('Cargando rifas disponibles...');
        const rifasRes = await api.getRifas();
        if (cancelled) return;

        const data = rifasRes.data;
        if (!data || data.length === 0) {
          setError('No hay rifas activas en este momento.');
          setLoading(false);
          return;
        }

        setRifas(data);
        setStep('pick-rifa');
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Error al cargar los datos');
        setLoading(false);
      }
    }

    loadRifas();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ═══ Select a rifa → go to auth step ═══ */
  const handleSelectRifa = useCallback((selectedRifa: RifaPublica) => {
    setRifa(selectedRifa);
    setActionError(null);
    setAuthError(null);
    setAuthCedula('');
    setIsReturningClient(false);
    setStep('auth');
  }, []);

  /* ═══ After auth, load boletas and proceed ═══ */
  const handleProceedToSelecting = useCallback(async () => {
    if (!rifa) return;
    setLoadingBoletas(true);
    setActionError(null);
    setBoletas([]);
    setSelectedIds(new Map());

    try {
      const boletasRes = await api.getBoletas(rifa.id);
      if (boletasRes.data) {
        setBoletas(boletasRes.data.boletas);
        setRifa(prev => prev ? {
          ...prev,
          boletas_vendidas: boletasRes.data!.rifa.boletas_vendidas,
          total_boletas: boletasRes.data!.rifa.total_boletas,
        } : prev);
      }
      setStep('selecting');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al cargar boletas');
      setStep('auth');
    } finally {
      setLoadingBoletas(false);
    }
  }, [rifa]);

  /* ═══ Auth: New client → proceed directly ═══ */
  const handleNewClient = useCallback(() => {
    setIsReturningClient(false);
    setBuyerData({ nombre: '', telefono: '', email: '', identificacion: '', direccion: '' });
    setFormTouched({});
    handleProceedToSelecting();
  }, [handleProceedToSelecting]);

  /* ═══ Auth: Returning client → lookup by cédula, show confirmation ═══ */
  const handleAuthCedulaLookup = useCallback(async () => {
    const cedula = authCedula.trim().replace(/\D/g, '');
    if (!cedula || cedula.length < 4) {
      setAuthError('Ingresa un número de cédula válido (mínimo 4 dígitos).');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setAuthConfirmed(false);

    try {
      const res = await api.consultaCedula(cedula);
      if (res.data) {
        const raw = res.data as unknown as Record<string, unknown>;
        const cliente = raw.cliente as CedulaLookupResult['cliente'] | null;
        if (cliente) {
          setBuyerData({
            nombre: cliente.nombre || '',
            telefono: cliente.telefono || '',
            email: cliente.email || '',
            identificacion: cliente.identificacion || cedula,
            direccion: '',
          });
          setFormTouched({ nombre: true, telefono: true, email: true, identificacion: true });
          setIsReturningClient(true);
          setAuthConfirmed(true); // Show confirmation card, DON'T proceed yet
        } else {
          setBuyerData(prev => ({ ...prev, identificacion: cedula }));
          setAuthError('No se encontró un cliente con esa cédula. ¿Deseas registrarte como nuevo cliente?');
        }
      } else {
        setAuthError('No se encontró un cliente con esa cédula. ¿Deseas registrarte como nuevo cliente?');
      }
    } catch {
      setAuthError('No se encontró un cliente con esa cédula. Puedes continuar como nuevo cliente.');
    } finally {
      setAuthLoading(false);
    }
  }, [authCedula]);

  /* ═══ Auth: Confirm client data → proceed to selecting ═══ */
  const handleConfirmAuth = useCallback(() => {
    handleProceedToSelecting();
  }, [handleProceedToSelecting]);

  /* ═══ Auth: Cancel confirmation → go back to cédula input ═══ */
  const handleCancelAuth = useCallback(() => {
    setAuthConfirmed(false);
    setIsReturningClient(false);
    setBuyerData({ nombre: '', telefono: '', email: '', identificacion: '', direccion: '' });
    setFormTouched({});
  }, []);

  /* ═══ Go back to rifa selection ═══ */
  const handleBackToRifas = useCallback(() => {
    setRifa(null);
    setBoletas([]);
    setSelectedIds(new Map());
    setStep('pick-rifa');
    setActionError(null);
    setAuthError(null);
    setAuthCedula('');
    setIsReturningClient(false);
    setAuthConfirmed(false);
    setSearch('');
    setPage(0);
  }, []);

  /* ═══ Handle bloqueo expiration ═══ */
  useEffect(() => {
    if (bloqueoTimer.expired && step === 'checkout') {
      setActionError('⏰ El tiempo de reserva ha expirado. Por favor selecciona tus boletas nuevamente.');
      setStep('selecting');
      setReservaToken(null);
      setBloqueoHasta(null);
      // Reload boletas to get fresh state
      if (rifa) {
        api
          .getBoletas(rifa.id)
          .then((res) => {
            if (res.data) setBoletas(res.data.boletas);
          })
          .catch(() => {});
      }
    }
  }, [bloqueoTimer.expired, step, rifa]);

  /* ═══════════════════════════════════════════════════
     FILTERING & PAGINATION
  ═══════════════════════════════════════════════════ */
  const filtered = useMemo(() => {
    return boletas.filter((b) => {
      const numStr = formatNumero(b.numero, totalBoletas);
      if (search && !numStr.includes(search)) return false;
      if (filterStatus === 'available' && b.estado !== 'DISPONIBLE') return false;
      return true;
    });
  }, [boletas, search, filterStatus, totalBoletas]);

  const totalPages = Math.ceil(filtered.length / BOLETAS_PER_PAGE);
  const paginated = filtered.slice(page * BOLETAS_PER_PAGE, (page + 1) * BOLETAS_PER_PAGE);

  /* ═══════════════════════════════════════════════════
     ACTIONS
  ═══════════════════════════════════════════════════ */
  const toggleBoleta = useCallback((b: BoletaDisponible) => {
    if (b.estado !== 'DISPONIBLE') return;
    setSelectedIds((prev) => {
      const next = new Map(prev);
      if (next.has(b.id)) {
        next.delete(b.id);
      } else {
        if (next.size >= 20) return prev; // Max 20
        next.set(b.id, b.numero);
      }
      return next;
    });
  }, []);

  const pickRandom = useCallback(() => {
    const available = boletas.filter(
      (b) => b.estado === 'DISPONIBLE' && !selectedIds.has(b.id)
    );
    if (available.length === 0 || selectedIds.size >= 20) return;
    const pick = available[Math.floor(Math.random() * available.length)];
    setSelectedIds((prev) => {
      const next = new Map(prev);
      next.set(pick.id, pick.numero);
      return next;
    });
  }, [boletas, selectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Map());
  }, []);

  const jumpToNumber = useCallback(
    (numStr: string) => {
      const num = parseInt(numStr, 10);
      const idx = filtered.findIndex((b) => b.numero === num);
      if (idx >= 0) {
        setPage(Math.floor(idx / BOLETAS_PER_PAGE));
        setTimeout(() => {
          const el = document.getElementById(`boleta-${num}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el?.classList.add('boleta-highlight');
          setTimeout(() => el?.classList.remove('boleta-highlight'), 1500);
        }, 100);
      }
    },
    [filtered]
  );

  /* ═══ STEP 3: Bloquear boletas ═══ */
  const handleBloquear = useCallback(async () => {
    if (!rifa || selectedIds.size === 0) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const boletaIds = Array.from(selectedIds.keys());
      const res = await api.bloquear(rifa.id, boletaIds);
      if (res.data) {
        setReservaToken(res.data.reserva_token);
        setBloqueoHasta(res.data.bloqueo_hasta);
        setStep('checkout');

        // Also load payment methods
        try {
          const mpRes = await api.getMediosPago();
          if (mpRes.data) setMediosPago(mpRes.data);
        } catch {
          /* non-critical */
        }

        // Scroll to checkout
        setTimeout(() => {
          checkoutRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al reservar boletas';
      setActionError(msg);
      // If conflict, refresh boletas
      if (
        msg.includes('No se pudieron bloquear') ||
        msg.includes('reservada') ||
        msg.includes('vendida')
      ) {
        if (rifa) {
          try {
            const freshRes = await api.getBoletas(rifa.id);
            if (freshRes.data) {
              setBoletas(freshRes.data.boletas);
              // Remove unavailable from selection
              const freshIds = new Set(
                freshRes.data.boletas.filter((b) => b.estado === 'DISPONIBLE').map((b) => b.id)
              );
              setSelectedIds((prev) => {
                const next = new Map(prev);
                Array.from(next.keys()).forEach((id) => {
                  if (!freshIds.has(id)) next.delete(id);
                });
                return next;
              });
            }
          } catch {
            /* ignore */
          }
        }
      }
    } finally {
      setActionLoading(false);
    }
  }, [rifa, selectedIds]);

  /* ═══ Cancel bloqueo ═══ */
  const handleCancelBloqueo = useCallback(async () => {
    if (!reservaToken) return;
    try {
      await api.liberar(reservaToken);
    } catch {
      /* ignore */
    }
    setStep('selecting');
    setReservaToken(null);
    setBloqueoHasta(null);
    setActionError(null);
    // Refresh boletas
    if (rifa) {
      try {
        const res = await api.getBoletas(rifa.id);
        if (res.data) setBoletas(res.data.boletas);
      } catch {
        /* ignore */
      }
    }
  }, [reservaToken, rifa]);

  /* ═══ STEP 5: Crear reserva ═══ */
  const handleReservar = useCallback(async () => {
    if (!reservaToken) return;
    if (!isFormValid) {
      setFormTouched({ nombre: true, telefono: true, email: true, identificacion: true, direccion: true });
      setActionError('Por favor completa los campos obligatorios correctamente.');
      return;
    }
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await api.reservar({
        reserva_token: reservaToken,
        cliente: {
          nombre: buyerData.nombre.trim(),
          telefono: buyerData.telefono.trim(),
          ...(buyerData.email.trim() && { email: buyerData.email.trim() }),
          ...(buyerData.identificacion.trim() && {
            identificacion: buyerData.identificacion.trim(),
          }),
          ...(buyerData.direccion.trim() && { direccion: buyerData.direccion.trim() }),
        },
        ...(selectedMedioPago && { medio_pago_id: selectedMedioPago }),
        ...(notas.trim() && { notas: notas.trim() }),
      });
      if (res.data) {
        setReservaResult(res.data);
        setStep('confirmed');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al crear la reserva');
    } finally {
      setActionLoading(false);
    }
  }, [reservaToken, buyerData, selectedMedioPago, notas, isFormValid]);

  /* ═══ STEP 6: Consultar estado ═══ */
  const handleCheckStatus = useCallback(
    async (tokenToCheck?: string) => {
      const token = tokenToCheck || reservaToken || lookupToken.trim();
      if (!token) return;
      setActionLoading(true);
      setActionError(null);

      try {
        const res = await api.getEstado(token);
        if (res.data) {
          setEstadoReserva(res.data);
          setReservaToken(token);
          setStep('status');
        }
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Reserva no encontrada');
      } finally {
        setActionLoading(false);
      }
    },
    [reservaToken, lookupToken]
  );

  /* ═══ Cédula lookup ═══ */
  const handleCedulaLookup = useCallback(async (cedulaToCheck?: string) => {
    const cedula = (cedulaToCheck || lookupCedula).trim().replace(/\D/g, '');
    if (!cedula || cedula.length < 4) {
      setActionError('Ingresa un número de cédula válido (mínimo 4 dígitos).');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    setCedulaResult(null);
    setSelectedBoletaView(null);

    try {
      const res = await api.consultaCedula(cedula);
      if (res.data) {
        // Normalize response: ensure cliente and ventas exist
        const raw = res.data as unknown as Record<string, unknown>;
        const normalized: CedulaLookupResult = {
          cliente: (raw.cliente as CedulaLookupResult['cliente']) || {
            nombre: 'Sin nombre',
            telefono: '',
            email: null,
            identificacion: cedula,
          },
          ventas: Array.isArray(raw.ventas) ? (raw.ventas as CedulaVenta[]) : [],
          total_ventas: typeof raw.total_ventas === 'number' ? raw.total_ventas : (Array.isArray(raw.ventas) ? (raw.ventas as CedulaVenta[]).length : 0),
        };
        setCedulaResult(normalized);
        setStep('mi-cuenta');
      } else {
        setActionError('No se encontraron compras con esa cédula.');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se encontraron compras con esa cédula');
    } finally {
      setActionLoading(false);
    }
  }, [lookupCedula]);

  /* ═══ Reset to start ═══ */
  const handleReset = useCallback(() => {
    setSelectedIds(new Map());
    setRifa(null);
    setBoletas([]);
    setStep('pick-rifa');
    setReservaToken(null);
    setBloqueoHasta(null);
    setReservaResult(null);
    setEstadoReserva(null);
    setCedulaResult(null);
    setSelectedBoletaView(null);
    setActionError(null);
    setAuthError(null);
    setAuthCedula('');
    setIsReturningClient(false);
    setAuthConfirmed(false);
    setBuyerData({ nombre: '', telefono: '', email: '', identificacion: '', direccion: '' });
    setFormTouched({});
    setSelectedMedioPago('');
    setNotas('');
    setLookupToken('');
    setLookupCedula('');
    setSearch('');
    setPage(0);
  }, []);

  /* ═══════════════════════════════════════════════════
     LOADING STATE
  ═══════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#111113] flex flex-col items-center justify-center gap-6">
        <div className="shop-loader" />
        <p className="text-white/60 text-sm font-semibold animate-pulse">{loadingMsg}</p>
      </div>
    );
  }

  /* ═══ Error state ═══ */
  if (error && !rifa) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <i className="fas fa-exclamation-triangle text-[#E63946] text-3xl" />
        </div>
        <h2
          className="text-3xl tracking-wider uppercase text-[#1A1A1A]"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          OOPS
        </h2>
        <p className="text-[#999] text-center max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary text-[13px] px-8 py-3 mt-2"
        >
          <i className="fas fa-redo text-xs" />
          Reintentar
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════ */
  return (
    <>
      {/* ═══ SHOP NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-3 bg-white/95 backdrop-blur-xl border-b border-black/[0.06] shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0">
              <Image
                src="/uploads/logos/logo-principal.png"
                alt="Gran Rifa Camionera"
                fill
                className="object-contain drop-shadow-sm"
                sizes="44px"
                priority
              />
            </div>
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 -ml-1 opacity-60">
              <Image
                src="/uploads/logos/logo-negro.png"
                alt=""
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
            <span
              className="text-base sm:text-lg tracking-wider text-[#1A1A1A] hidden sm:block"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              GRAN RIFA <span className="text-truck-red">CAMIONERA</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Back to rifa selection */}
            {step !== 'pick-rifa' && rifas.length > 1 && (
              <button
                onClick={handleBackToRifas}
                className="text-[11px] sm:text-[12px] font-bold text-[#888] hover:text-[#E63946] transition-colors flex items-center gap-1.5"
              >
                <i className="fas fa-arrow-left text-[9px]" />
                <span className="hidden sm:inline">Cambiar rifa</span>
              </button>
            )}

            {/* Bloqueo timer in navbar */}
            {step === 'checkout' && bloqueoHasta && !bloqueoTimer.expired && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF8E7] border border-[#FFB703]/30">
                <i className="fas fa-clock text-[#FFB703] text-[10px] animate-pulse" />
                <span
                  className="text-sm font-black text-[#B87A00] tabular-nums"
                  style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}
                >
                  {pad(bloqueoTimer.minutes)}:{pad(bloqueoTimer.seconds)}
                </span>
              </div>
            )}

            {/* Cart badge */}
            {selectedCount > 0 && step === 'selecting' && (
              <button
                onClick={handleBloquear}
                disabled={actionLoading}
                className="btn-primary text-[11px] sm:text-[12px] px-4 sm:px-6 py-2.5 relative"
              >
                {actionLoading ? (
                  <i className="fas fa-spinner fa-spin text-[10px]" />
                ) : (
                  <i className="fas fa-shopping-cart text-[10px]" />
                )}
                <span className="hidden sm:inline">Reservar</span>
                <span className="sm:hidden">Reservar</span>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-warning-yellow text-black text-[11px] font-black flex items-center justify-center shadow-lg">
                  {selectedCount}
                </span>
              </button>
            )}

            {/* Mi Cuenta button */}
            {(step === 'pick-rifa' || step === 'selecting' || step === 'auth') && (
              <button
                onClick={() => {
                  setStep('mi-cuenta');
                  setActionError(null);
                  setCedulaResult(null);
                  setSelectedBoletaView(null);
                }}
                className="text-[11px] sm:text-[12px] font-bold text-[#555] hover:text-[#E63946] transition-colors flex items-center gap-1.5"
              >
                <i className="fas fa-user-circle text-[12px]" />
                <span className="hidden sm:inline">Mi Cuenta</span>
              </button>
            )}

            {/* Back from mi-cuenta */}
            {step === 'mi-cuenta' && (
              <button
                onClick={handleReset}
                className="text-[11px] sm:text-[12px] font-bold text-[#888] hover:text-[#E63946] transition-colors flex items-center gap-1.5"
              >
                <i className="fas fa-arrow-left text-[9px]" />
                <span className="hidden sm:inline">Volver</span>
              </button>
            )}

            <Link
              href="/"
              className="text-[13px] text-[#888] hover:text-[#333] transition-colors font-semibold hidden sm:block"
            >
              ← Inicio
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
         STEP: PICK RIFA
      ═══════════════════════════════════════════════════ */}
      {step === 'pick-rifa' && (
        <main className="pt-16 min-h-screen bg-[#111113] relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#E63946_0%,transparent_50%)] opacity-[0.04]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#FFB703_0%,transparent_50%)] opacity-[0.03]" />

          <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
            {/* Header */}
            <div className="text-center mb-10 sm:mb-14 shop-fade-in">
              <div className="inline-flex items-center gap-2 bg-[#E63946]/15 border border-[#E63946]/25 rounded-full px-4 py-2 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E63946] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E63946]" />
                </span>
                <span className="text-[11px] font-bold tracking-[3px] uppercase text-[#FF8A93]">
                  {rifas.length} {rifas.length === 1 ? 'rifa disponible' : 'rifas disponibles'}
                </span>
              </div>

              <h1
                className="text-[clamp(36px,7vw,72px)] leading-[0.9] uppercase tracking-wider text-white mb-4"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                ELIGE TU{' '}
                <span className="bg-gradient-to-r from-[#E63946] to-[#FF6B6B] bg-clip-text text-transparent">
                  RIFA
                </span>
              </h1>
              <p className="text-white/40 text-sm sm:text-base max-w-lg mx-auto">
                Selecciona la rifa en la que quieres participar y elige tus boletas de la suerte.
              </p>
            </div>

            {/* Rifa cards grid */}
            {loadingBoletas ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <div className="shop-loader" />
                <p className="text-white/50 text-sm font-semibold animate-pulse">Cargando boletas…</p>
              </div>
            ) : (
              <div className={`grid gap-6 sm:gap-8 ${rifas.length === 1 ? 'max-w-lg mx-auto' : rifas.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {rifas.map((r, idx) => {
                  const precioBoleta = parseFloat(r.precio_boleta) || 0;
                  const vendidas = r.boletas_vendidas;
                  const total = r.total_boletas;
                  const disponibles = parseInt(r.boletas_disponibles) || 0;
                  const porcentaje = total > 0 ? Math.round((vendidas / total) * 100) : 0;
                  const sorteoDate = new Date(r.fecha_sorteo);
                  const sorteoStr = sorteoDate.toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRifa(r)}
                      disabled={loadingBoletas}
                      className="shop-pop-in group relative bg-gradient-to-br from-[#1A1A1E] to-[#16161A] rounded-2xl border border-white/[0.06] hover:border-[#E63946]/40 transition-all duration-300 text-left overflow-hidden hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#E63946]/10 focus:outline-none focus:ring-2 focus:ring-[#E63946]/30"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      {/* Image header */}
                      <div className="relative h-40 sm:h-48 overflow-hidden">
                        {r.imagen_url ? (
                          <Image
                            src={r.imagen_url}
                            alt={r.nombre}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 100vw, 400px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#E63946]/20 to-[#FFB703]/10 flex items-center justify-center">
                            <i className="fas fa-truck text-5xl text-white/10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1E] via-transparent to-transparent" />

                        {/* Price badge */}
                        <div className="absolute top-3 right-3 bg-[#E63946] rounded-full px-3 py-1.5 shadow-lg">
                          <span className="text-[11px] font-black text-white tracking-wide">
                            {formatCOP(precioBoleta)}
                          </span>
                        </div>

                        {/* Urgency badge */}
                        {porcentaje >= 70 && (
                          <div className="absolute top-3 left-3 bg-[#FFB703] rounded-full px-3 py-1 shadow-lg">
                            <span className="text-[10px] font-black text-black tracking-wider uppercase">
                              🔥 ¡Se agota!
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-5 sm:p-6">
                        {/* Premio principal */}
                        {r.premio_principal && (
                          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FFB703]/15 to-[#FFD700]/10 border border-[#FFB703]/20 rounded-full px-3 py-1 mb-3">
                            <span className="text-sm">🏆</span>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFD700]">
                              {r.premio_principal}
                            </span>
                          </div>
                        )}

                        {/* Name */}
                        <h2
                          className="text-xl sm:text-2xl uppercase tracking-wider text-white mb-2 leading-tight group-hover:text-[#FF8A93] transition-colors"
                          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                        >
                          {r.nombre}
                        </h2>

                        {/* Description */}
                        {r.descripcion && (
                          <p className="text-white/35 text-[13px] line-clamp-2 mb-4 leading-relaxed">
                            {r.descripcion}
                          </p>
                        )}

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mb-4 text-[11px]">
                          <div className="flex items-center gap-1.5 text-white/50">
                            <i className="fas fa-calendar-alt text-[#E63946] text-[10px]" />
                            <span className="font-semibold">{sorteoStr}</span>
                          </div>
                          <div className="w-px h-3 bg-white/10" />
                          <div className="flex items-center gap-1.5 text-white/50">
                            <i className="fas fa-ticket-alt text-[#FFB703] text-[10px]" />
                            <span className="font-semibold">{disponibles.toLocaleString()} disponibles</span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-5">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                            <span className="text-white/30">Progreso</span>
                            <span className="text-[#E63946]">{porcentaje}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#E63946] to-[#FF6B6B] transition-all duration-1000"
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="flex items-center justify-between">
                          <span
                            className="text-sm font-bold uppercase tracking-wider text-[#E63946] group-hover:text-white transition-colors"
                            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                          >
                            Elegir Boletas →
                          </span>
                          <div className="w-8 h-8 rounded-full bg-[#E63946]/10 flex items-center justify-center group-hover:bg-[#E63946]/20 transition-colors">
                            <i className="fas fa-chevron-right text-[#E63946] text-[10px] group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Error in rifa selection */}
            {actionError && step === 'pick-rifa' && (
              <div className="mt-8 max-w-lg mx-auto bg-[#E63946]/10 border border-[#E63946]/20 rounded-xl px-5 py-4 flex items-center gap-3">
                <i className="fas fa-exclamation-circle text-[#E63946]" />
                <p className="text-[#FF8A93] text-sm font-semibold flex-1">{actionError}</p>
              </div>
            )}

            {/* Trust footer */}
            <div className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-6 sm:gap-10 text-center opacity-40">
              {[
                { icon: 'fas fa-shield-alt', label: 'Compra segura' },
                { icon: 'fas fa-lock', label: 'Datos protegidos' },
                { icon: 'fas fa-headset', label: 'Soporte 24/7' },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2">
                  <i className={`${t.icon} text-white/60 text-xs`} />
                  <span className="text-[11px] font-bold text-white/50 tracking-wider uppercase">{t.label}</span>
                </div>
              ))}
            </div>

            {/* ═══ CONSULTAR MIS BOLETAS — Section in pick-rifa ═══ */}
            <div className="mt-16 sm:mt-20 pt-10 border-t border-white/[0.06]">
              <div className="max-w-lg mx-auto text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/[0.06] mb-4">
                  <i className="fas fa-user-circle text-white/40 text-xl" />
                </div>
                <h3
                  className="text-2xl sm:text-3xl tracking-wider uppercase text-white mb-2"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  CONSULTA TUS <span className="text-truck-red">BOLETAS</span>
                </h3>
                <p className="text-white/35 text-sm mb-6">
                  Ingresa tu cédula para ver el estado de tus compras y boletas
                </p>

                {/* Cédula input */}
                <div className="flex gap-2 max-w-sm mx-auto mb-3">
                  <div className="relative flex-1">
                    <i className="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm" />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Nº de cédula..."
                      value={lookupCedula}
                      onChange={(e) => setLookupCedula(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCedulaLookup();
                      }}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.07] border border-white/10 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-[#E63946]/40 focus:ring-2 focus:ring-[#E63946]/10 transition-all"
                    />
                  </div>
                  <button
                    onClick={() => handleCedulaLookup()}
                    disabled={!lookupCedula.trim() || actionLoading}
                    className="px-6 py-3.5 rounded-xl bg-[#E63946] text-white text-sm font-bold hover:bg-[#D62B39] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {actionLoading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-search" />}
                    <span className="hidden sm:inline">Buscar</span>
                  </button>
                </div>

                {/* Token lookup below */}
                <div className="flex gap-2 max-w-sm mx-auto">
                  <div className="relative flex-1">
                    <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm" />
                    <input
                      type="text"
                      placeholder="O ingresa tu token de reserva..."
                      value={lookupToken}
                      onChange={(e) => setLookupToken(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCheckStatus();
                      }}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-xs font-mono placeholder:text-white/15 focus:outline-none focus:border-white/20 transition-all"
                    />
                  </div>
                  <button
                    onClick={() => handleCheckStatus()}
                    disabled={!lookupToken.trim() || actionLoading}
                    className="px-5 py-3 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                  >
                    <i className="fas fa-search" />
                  </button>
                </div>

                {actionError && step === 'pick-rifa' && (
                  <div className="mt-4 bg-[#E63946]/10 border border-[#E63946]/20 rounded-xl px-4 py-3 flex items-center gap-2 max-w-sm mx-auto">
                    <i className="fas fa-exclamation-circle text-[#E63946] text-sm" />
                    <p className="text-[#FF8A93] text-sm font-medium flex-1 text-left">{actionError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ═══════════════════════════════════════════════════
         STEP: AUTH (New or Returning Client)
      ═══════════════════════════════════════════════════ */}
      {step === 'auth' && rifa && (
        <main className="pt-16 min-h-screen bg-[#111113] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#E63946_0%,transparent_50%)] opacity-[0.04]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#FFB703_0%,transparent_50%)] opacity-[0.03]" />

          <div className="relative z-10 max-w-[700px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
            {/* Back button */}
            <button
              onClick={handleBackToRifas}
              className="text-[12px] font-bold text-white/40 hover:text-[#E63946] transition-colors flex items-center gap-1.5 mb-8"
            >
              <i className="fas fa-arrow-left text-[10px]" />
              Volver a rifas
            </button>

            {/* Header */}
            <div className="text-center mb-10 shop-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-full px-4 py-2 mb-5">
                <i className="fas fa-ticket-alt text-[#FFB703] text-[10px]" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-white/50">
                  {rifa.nombre}
                </span>
              </div>
              <h2
                className="text-[clamp(28px,6vw,52px)] leading-[0.9] uppercase tracking-wider text-white mb-3"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                ¿CÓMO QUIERES{' '}
                <span className="bg-gradient-to-r from-[#E63946] to-[#FF6B6B] bg-clip-text text-transparent">
                  CONTINUAR
                </span>
                ?
              </h2>
              <p className="text-white/35 text-sm max-w-md mx-auto">
                Si ya has comprado boletas antes, podemos cargar tus datos automáticamente
              </p>
            </div>

            {/* Auth options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6 shop-pop-in">
              {/* New Client */}
              <button
                onClick={handleNewClient}
                disabled={loadingBoletas}
                className="group relative bg-gradient-to-br from-[#1A1A1E] to-[#16161A] rounded-2xl border border-white/[0.06] hover:border-[#E63946]/40 p-6 sm:p-8 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#E63946]/10 focus:outline-none focus:ring-2 focus:ring-[#E63946]/30"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#E63946]/10 flex items-center justify-center mb-5 group-hover:bg-[#E63946]/20 transition-colors">
                  <i className="fas fa-user-plus text-[#E63946] text-xl" />
                </div>
                <h3
                  className="text-xl sm:text-2xl uppercase tracking-wider text-white mb-2 group-hover:text-[#FF8A93] transition-colors"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  SOY NUEVO
                </h3>
                <p className="text-white/30 text-[13px] leading-relaxed">
                  Primera vez comprando boletas. Registraré mis datos al momento de la compra.
                </p>
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[#E63946] uppercase tracking-wider group-hover:text-white transition-colors" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                    Continuar →
                  </span>
                </div>
                {loadingBoletas && (
                  <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                    <div className="shop-loader" />
                  </div>
                )}
              </button>

              {/* Returning Client */}
              <button
                onClick={() => setIsReturningClient(true)}
                className={`group relative bg-gradient-to-br from-[#1A1A1E] to-[#16161A] rounded-2xl border p-6 sm:p-8 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#FFB703]/10 focus:outline-none focus:ring-2 focus:ring-[#FFB703]/30 ${
                  isReturningClient
                    ? 'border-[#FFB703]/40 shadow-lg shadow-[#FFB703]/5'
                    : 'border-white/[0.06] hover:border-[#FFB703]/40'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#FFB703]/10 flex items-center justify-center mb-5 group-hover:bg-[#FFB703]/20 transition-colors">
                  <i className="fas fa-user-check text-[#FFB703] text-xl" />
                </div>
                <h3
                  className="text-xl sm:text-2xl uppercase tracking-wider text-white mb-2 group-hover:text-[#FFD700] transition-colors"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  YA SOY CLIENTE
                </h3>
                <p className="text-white/30 text-[13px] leading-relaxed">
                  Ya he comprado antes. Ingresaré mi cédula para cargar mis datos automáticamente.
                </p>
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[#FFB703] uppercase tracking-wider group-hover:text-white transition-colors" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                    Identificarme →
                  </span>
                </div>
              </button>
            </div>

            {/* Returning client: Cédula input (only if NOT confirmed yet) */}
            {isReturningClient && !authConfirmed && (
              <div className="shop-fade-in bg-gradient-to-br from-[#1A1A1E] to-[#16161A] rounded-2xl border border-[#FFB703]/20 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-[#FFB703]/10 flex items-center justify-center">
                    <i className="fas fa-id-card text-[#FFB703] text-sm" />
                  </div>
                  <div>
                    <h4
                      className="text-lg tracking-wider uppercase text-white"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      INGRESA TU CÉDULA
                    </h4>
                    <p className="text-[11px] text-white/30">Buscaremos tus datos para pre-llenar el formulario</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <i className="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm" />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1.234.567.890"
                      value={authCedula}
                      onChange={(e) => setAuthCedula(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAuthCedulaLookup();
                      }}
                      className="w-full pl-11 pr-4 py-4 rounded-xl bg-white/[0.06] border border-white/10 text-white text-lg font-mono font-semibold placeholder:text-white/15 focus:outline-none focus:border-[#FFB703]/40 focus:ring-2 focus:ring-[#FFB703]/10 transition-all tracking-wider"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleAuthCedulaLookup}
                    disabled={!authCedula.trim() || authLoading}
                    className="px-6 py-4 rounded-xl bg-[#FFB703] text-black text-sm font-bold hover:bg-[#FFD700] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {authLoading ? (
                      <i className="fas fa-spinner fa-spin" />
                    ) : (
                      <>
                        <i className="fas fa-search text-xs" />
                        <span className="hidden sm:inline">Buscar</span>
                      </>
                    )}
                  </button>
                </div>

                {authError && (
                  <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
                    <i className="fas fa-info-circle text-amber-400 text-sm mt-0.5" />
                    <div className="flex-1">
                      <p className="text-amber-300 text-sm font-medium">{authError}</p>
                      <button
                        onClick={handleNewClient}
                        className="mt-2 text-[12px] font-bold text-[#E63946] hover:text-[#FF6B6B] transition-colors"
                      >
                        → Continuar como nuevo cliente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ Client Data Confirmation Card ═══ */}
            {authConfirmed && buyerData.nombre && (
              <div className="shop-pop-in bg-gradient-to-br from-[#1A1A1E] to-[#16161A] rounded-2xl border border-green-500/30 overflow-hidden">
                {/* Green header */}
                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/10 px-6 py-4 border-b border-green-500/10 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-green-500/20 flex items-center justify-center">
                    <i className="fas fa-user-check text-green-400 text-sm" />
                  </div>
                  <div>
                    <h4
                      className="text-lg tracking-wider uppercase text-white"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      ¡TE ENCONTRAMOS!
                    </h4>
                    <p className="text-[11px] text-green-400/60">Confirma que estos son tus datos</p>
                  </div>
                </div>

                {/* Client data grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {[
                      { icon: 'fa-user', label: 'Nombre', value: buyerData.nombre },
                      { icon: 'fa-id-card', label: 'Cédula', value: buyerData.identificacion },
                      { icon: 'fa-phone', label: 'Teléfono', value: buyerData.telefono || 'No registrado' },
                      { icon: 'fa-envelope', label: 'Correo', value: buyerData.email || 'No registrado' },
                    ].map((item) => (
                      <div key={item.label} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <i className={`fas ${item.icon} text-green-400 text-[9px]`} />
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">{item.label}</span>
                        </div>
                        <p className="text-[14px] font-semibold text-white truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* WhatsApp edit notice */}
                  <div className="bg-amber-500/[0.08] border border-amber-500/15 rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5">
                    <i className="fas fa-info-circle text-amber-400 text-sm mt-0.5" />
                    <div>
                      <p className="text-[12px] text-amber-300/80 leading-relaxed">
                        ¿Algún dato es incorrecto? Escríbenos para corregirlo:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <a
                          href={`https://wa.me/573207120787?text=${encodeURIComponent(
                            `Hola! Soy ${buyerData.nombre}, CC ${buyerData.identificacion}. Necesito actualizar mis datos de registro para la rifa.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-[11px] font-bold hover:bg-green-500/30 transition-colors"
                        >
                          <i className="fab fa-whatsapp text-xs" />
                          320 712 0787
                        </a>
                        <a
                          href={`https://wa.me/573207120779?text=${encodeURIComponent(
                            `Hola! Soy ${buyerData.nombre}, CC ${buyerData.identificacion}. Necesito actualizar mis datos de registro para la rifa.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-[11px] font-bold hover:bg-green-500/30 transition-colors"
                        >
                          <i className="fab fa-whatsapp text-xs" />
                          320 712 0779
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleConfirmAuth}
                      disabled={loadingBoletas}
                      className="flex-1 relative inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white text-[14px] font-bold hover:from-green-500 hover:to-green-600 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50"
                    >
                      {loadingBoletas ? (
                        <>
                          <i className="fas fa-spinner fa-spin text-sm" />
                          CARGANDO BOLETAS...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle text-sm" />
                          SÍ, SOY YO · CONTINUAR
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancelAuth}
                      disabled={loadingBoletas}
                      className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-white/10 text-white/50 text-[13px] font-bold hover:border-white/20 hover:text-white/70 transition-all disabled:opacity-30"
                    >
                      <i className="fas fa-arrow-left text-xs" />
                      CANCELAR
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Trust footer */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-center opacity-30">
              {[
                { icon: 'fas fa-shield-alt', label: 'Compra segura' },
                { icon: 'fas fa-lock', label: 'Datos protegidos' },
                { icon: 'fas fa-headset', label: 'Soporte 24/7' },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2">
                  <i className={`${t.icon} text-white/60 text-xs`} />
                  <span className="text-[11px] font-bold text-white/50 tracking-wider uppercase">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ═══════════════════════════════════════════════════
         MAIN CONTENT (after rifa selected)
      ═══════════════════════════════════════════════════ */}
      {step !== 'pick-rifa' && step !== 'auth' && (
      <main className="pt-16 min-h-screen bg-[#FAFAFA]">
        {/* ═══ HERO BANNER ═══ */}
        <section className="relative bg-[#111113] overflow-hidden">
          <Image
            src="/uploads/IMG_7996.JPG"
            alt="Camión VW Worker"
            fill
            className="object-cover object-center opacity-30"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#111113]/60 via-[#111113]/80 to-[#111113]" />

          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 pb-10 sm:pt-16 sm:pb-14">
            <div className="text-center">
              {/* Urgency pill */}
              <div className="inline-flex items-center gap-2 bg-[#E63946]/15 border border-[#E63946]/25 rounded-full px-4 py-2 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E63946] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E63946]" />
                </span>
                <span className="text-[11px] font-bold tracking-[3px] uppercase text-[#FF8A93]">
                  {availableCount.toLocaleString()} boletas disponibles
                </span>
              </div>

              <h1
                className="text-[clamp(32px,6vw,64px)] leading-[0.9] uppercase tracking-wider text-white mb-4"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                ESCOGE TU <span className="text-truck-red">NÚMERO</span>{' '}
                <span className="bg-gradient-to-r from-[#FFB703] via-[#FFD700] to-[#FFB703] bg-clip-text text-transparent">
                  DE LA SUERTE
                </span>
              </h1>

              <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto mb-6">
                Cada boleta es una oportunidad real de ganar.{' '}
                <strong className="text-white/70">Solo {formatCOP(precio)}</strong> separa tu sueño.
              </p>

              {/* Mini countdown */}
              <div className="flex justify-center gap-4 sm:gap-6 mb-6">
                {[
                  { v: pad(countdown.days), l: 'Días' },
                  { v: pad(countdown.hours), l: 'Hrs' },
                  { v: pad(countdown.minutes), l: 'Min' },
                  { v: pad(countdown.seconds), l: 'Seg' },
                ].map((item) => (
                  <div key={item.l} className="text-center">
                    <div
                      className="text-2xl sm:text-3xl text-white font-black tabular-nums"
                      style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '2px' }}
                    >
                      {item.v}
                    </div>
                    <div className="text-[9px] font-bold tracking-[2px] uppercase text-white/35">
                      {item.l}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                  <span className="text-white/40">Boletas vendidas</span>
                  <span className="text-[#E63946]">{soldPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#E63946] to-[#FF6B6B] transition-all duration-1000"
                    style={{ width: `${soldPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/25 mt-2 text-center">
                  ¡No te quedes sin la tuya! Se están agotando rápido
                </p>
              </div>
            </div>
          </div>

          {/* Prize strip */}
          <div className="relative z-10 border-t border-white/[0.06]">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4">
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-center">
                {[
                  {
                    icon: '🚛',
                    label: rifa?.premio_principal || 'Premio Principal',
                    sub: rifa?.nombre || '',
                  },
                  { icon: '🚗', label: 'Kia Picanto', sub: '$45M' },
                  { icon: '💰', label: 'Premios Cash', sub: '$20M' },
                  { icon: '🚢', label: 'Crucero', sub: 'Bahamas' },
                ].map((p) => (
                  <div key={p.label} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">{p.icon}</span>
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-white/70 leading-tight">{p.label}</div>
                      <div className="text-[10px] text-white/35 font-bold tracking-wider">{p.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ ERROR BANNER ═══ */}
        {actionError && (
          <div className="bg-[#FFF0F0] border-b border-[#E63946]/20 px-4 py-3">
            <div className="max-w-[1400px] mx-auto flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-[#E63946]" />
              <p className="text-[#E63946] text-sm font-semibold flex-1">{actionError}</p>
              <button
                onClick={() => setActionError(null)}
                className="text-[#E63946]/60 hover:text-[#E63946] text-sm"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
           STEP: SELECTING BOLETAS
        ═══════════════════════════════════════════════════ */}
        {(step === 'selecting' || step === 'checkout') && (
          <>
            {/* ═══ SEARCH & CONTROLS ═══ */}
            <section className="sticky top-[52px] z-40 bg-white/95 backdrop-blur-xl border-b border-black/[0.06] shadow-sm">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#999] text-sm" />
                    <input
                      ref={searchRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder={`Buscar número... (ej: ${formatNumero(777, totalBoletas)})`}
                      value={search}
                      onChange={(e) => {
                        const digits = String(totalBoletas - 1).length;
                        const v = e.target.value.replace(/\D/g, '').slice(0, digits);
                        setSearch(v);
                        setPage(0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && search.length > 0) {
                          jumpToNumber(search);
                        }
                      }}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/[0.08] bg-[#FAFAFA] text-[#1A1A1A] text-sm font-semibold placeholder:text-[#bbb] focus:outline-none focus:border-[#E63946]/40 focus:ring-2 focus:ring-[#E63946]/10 transition-all"
                    />
                    {search && (
                      <button
                        onClick={() => {
                          setSearch('');
                          setPage(0);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#333] text-xs"
                      >
                        <i className="fas fa-times" />
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex rounded-lg border border-black/[0.08] overflow-hidden text-[11px] font-bold">
                      <button
                        onClick={() => {
                          setFilterStatus('available');
                          setPage(0);
                        }}
                        className={`px-3 py-2 transition-colors ${
                          filterStatus === 'available'
                            ? 'bg-[#E63946] text-white'
                            : 'bg-white text-[#888] hover:bg-gray-50'
                        }`}
                      >
                        Disponibles
                      </button>
                      <button
                        onClick={() => {
                          setFilterStatus('all');
                          setPage(0);
                        }}
                        className={`px-3 py-2 transition-colors ${
                          filterStatus === 'all'
                            ? 'bg-[#E63946] text-white'
                            : 'bg-white text-[#888] hover:bg-gray-50'
                        }`}
                      >
                        Todas
                      </button>
                    </div>

                    <button
                      onClick={pickRandom}
                      disabled={step !== 'selecting'}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#F57F17] text-white text-[11px] font-bold tracking-wider uppercase shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-dice text-xs" />
                      <span className="hidden sm:inline">Suerte</span>
                    </button>

                    {selectedCount > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#E63946]/[0.06] border border-[#E63946]/20">
                        <i className="fas fa-ticket text-[#E63946] text-[10px]" />
                        <span className="text-[12px] font-bold text-[#E63946]">
                          {selectedCount}
                        </span>
                        {step === 'selecting' && (
                          <button
                            onClick={clearSelection}
                            className="text-[10px] text-[#E63946]/60 hover:text-[#E63946] ml-1"
                          >
                            <i className="fas fa-times" />
                          </button>
                        )}
                      </div>
                    )}

                    {selectedCount >= 20 && (
                      <span className="text-[10px] text-[#E63946] font-bold">Máx. 20</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ═══ BOLETAS GRID ═══ */}
            <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12" ref={gridRef}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4 text-[11px] font-semibold text-[#999]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-[#f0f0f0] to-[#e8e8e8] border border-black/[0.06]" />
                    Disponible
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-[#E63946] to-[#C62828]" />
                    Seleccionada
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#ddd]" />
                    Vendida / Reservada
                  </span>
                </div>
                <p className="text-[11px] text-[#bbb]">
                  Mostrando {paginated.length} de {filtered.length.toLocaleString()} boletas
                </p>
              </div>

              {paginated.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 sm:gap-2.5">
                  {paginated.map((b) => {
                    const isSelected = selectedIds.has(b.id);
                    const isAvailable = b.estado === 'DISPONIBLE';
                    const numStr = formatNumero(b.numero, totalBoletas);

                    return (
                      <button
                        key={b.id}
                        id={`boleta-${b.numero}`}
                        disabled={!isAvailable || step === 'checkout'}
                        onClick={() => toggleBoleta(b)}
                        className={`
                          boleta-cell relative aspect-square rounded-xl font-black text-sm sm:text-base
                          transition-all duration-200 select-none
                          ${
                            isSelected
                              ? 'bg-gradient-to-br from-[#E63946] to-[#B71C1C] text-white shadow-lg shadow-[#E63946]/25 scale-105 ring-2 ring-[#E63946]/30 ring-offset-1 ring-offset-white z-10'
                              : isAvailable
                                ? 'bg-gradient-to-br from-white to-[#f5f5f5] text-[#555] border border-black/[0.06] hover:border-[#E63946]/30 hover:shadow-md hover:shadow-[#E63946]/10 hover:-translate-y-0.5 hover:text-[#E63946] cursor-pointer'
                                : 'bg-[#eee] text-[#ccc] cursor-not-allowed line-through'
                          }
                        `}
                        style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}
                      >
                        {numStr}
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-[#E63946] flex items-center justify-center shadow-sm">
                            <i className="fas fa-check text-[8px]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-[#999] text-lg font-semibold">No se encontró la boleta #{search}</p>
                  <p className="text-[#ccc] text-sm mt-1 mb-6">
                    Puede que esté vendida o reservada. Mira estas boletas con números parecidos:
                  </p>
                  {/* Similar numbers */}
                  {(() => {
                    const searchNum = parseInt(search, 10);
                    if (isNaN(searchNum)) return null;
                    // Find boletas with close numbers (±10 range), available preferred
                    const similar = boletas
                      .filter(b => {
                        const diff = Math.abs(b.numero - searchNum);
                        return diff > 0 && diff <= 20;
                      })
                      .sort((a, b) => {
                        // Prioritize available, then by closeness
                        if (a.estado === 'DISPONIBLE' && b.estado !== 'DISPONIBLE') return -1;
                        if (a.estado !== 'DISPONIBLE' && b.estado === 'DISPONIBLE') return 1;
                        return Math.abs(a.numero - searchNum) - Math.abs(b.numero - searchNum);
                      })
                      .slice(0, 12);

                    if (similar.length === 0) {
                      return (
                        <p className="text-[#bbb] text-sm">
                          No hay boletas con números cercanos disponibles.
                          <button onClick={() => setSearch('')} className="text-[#E63946] font-bold ml-1 hover:underline">Ver todas</button>
                        </p>
                      );
                    }

                    return (
                      <div className="max-w-md mx-auto">
                        <p className="text-[10px] font-bold text-[#999] uppercase tracking-wider mb-3">
                          Números similares a #{String(searchNum).padStart(String(totalBoletas - 1).length, '0')}
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {similar.map((b) => {
                            const isAvailable = b.estado === 'DISPONIBLE';
                            const isSelected = selectedIds.has(b.id);
                            return (
                              <button
                                key={b.id}
                                onClick={() => { if (isAvailable) { toggleBoleta(b); setSearch(''); } }}
                                disabled={!isAvailable || step === 'checkout'}
                                className={`relative p-2.5 rounded-xl border text-center transition-all ${
                                  isSelected
                                    ? 'bg-[#E63946] border-[#E63946] text-white shadow-lg shadow-[#E63946]/20 scale-105'
                                    : isAvailable
                                    ? 'bg-white border-green-200 text-[#1A1A1A] hover:border-[#E63946]/40 hover:shadow-sm cursor-pointer'
                                    : 'bg-[#F5F5F5] border-black/[0.04] text-[#ccc] cursor-not-allowed'
                                }`}
                              >
                                <span className="text-[14px] font-black tracking-wider" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                                  {formatNumero(b.numero, totalBoletas)}
                                </span>
                                {isAvailable && !isSelected && (
                                  <span className="block text-[8px] font-bold text-green-600 uppercase mt-0.5">Disponible</span>
                                )}
                                {!isAvailable && (
                                  <span className="block text-[8px] font-bold text-[#ccc] uppercase mt-0.5">{b.estado === 'VENDIDA' ? 'Vendida' : 'Reservada'}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setSearch('')}
                          className="mt-4 text-[12px] font-bold text-[#E63946] hover:text-[#FF6B6B] transition-colors"
                        >
                          ← Ver todas las boletas
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="w-10 h-10 rounded-xl border border-black/[0.08] flex items-center justify-center text-[#999] hover:text-[#333] hover:border-black/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <i className="fas fa-chevron-left text-xs" />
                  </button>
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i;
                    } else if (page < 3) {
                      pageNum = i;
                    } else if (page > totalPages - 4) {
                      pageNum = totalPages - 7 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                          page === pageNum
                            ? 'bg-[#E63946] text-white shadow-md shadow-[#E63946]/20'
                            : 'border border-black/[0.08] text-[#999] hover:text-[#333] hover:border-black/20'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page === totalPages - 1}
                    className="w-10 h-10 rounded-xl border border-black/[0.08] flex items-center justify-center text-[#999] hover:text-[#333] hover:border-black/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <i className="fas fa-chevron-right text-xs" />
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════
           STEP: CHECKOUT (After boletas are blocked)
        ═══════════════════════════════════════════════════ */}
        {step === 'checkout' && (
          <section ref={checkoutRef} className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="shop-fade-in">
              {/* ── Checkout Header ── */}
              <div className="text-center mb-8">
                <h2
                  className="text-3xl sm:text-4xl tracking-wider uppercase text-[#1A1A1A]"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  COMPLETA TU <span className="text-truck-red">RESERVA</span>
                </h2>
                <p className="text-[#999] text-sm mt-2">
                  Llena tus datos para asegurar {selectedCount > 1 ? 'tus' : 'tu'}{' '}
                  {selectedCount} boleta{selectedCount > 1 ? 's' : ''}
                </p>
              </div>

              {/* ── Returning Client Badge ── */}
              {isReturningClient && buyerData.nombre && (
                <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-4 shop-fade-in">
                  <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-user-check text-green-600 text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-green-800 truncate">{buyerData.nombre}</p>
                    <p className="text-[11px] text-green-600">
                      CC {buyerData.identificacion}
                      {buyerData.telefono && <span> · {buyerData.telefono}</span>}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-[10px] font-bold text-green-700 border border-green-200">
                    <i className="fas fa-check-circle text-[8px]" />
                    VERIFICADO
                  </span>
                </div>
              )}

              {/* ── Timer Bar (if active) ── */}
              {bloqueoHasta && !bloqueoTimer.expired && (
                <div className="mb-6 bg-gradient-to-r from-[#111113] to-[#1a1a1f] rounded-2xl px-5 py-4 shadow-lg border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-clock text-[#FFB703] text-sm" />
                      <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
                        Tiempo para completar
                      </span>
                    </div>
                    <span
                      className={`text-xl font-black tabular-nums ${
                        bloqueoTimer.total < 120000
                          ? 'text-[#E63946] animate-pulse'
                          : 'text-[#FFB703]'
                      }`}
                      style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '2px' }}
                    >
                      {pad(bloqueoTimer.minutes)}:{pad(bloqueoTimer.seconds)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        bloqueoTimer.total < 120000 ? 'bg-[#E63946]' : 'bg-[#FFB703]'
                      }`}
                      style={{
                        width: `${Math.min(100, (bloqueoTimer.total / (15 * 60 * 1000)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* ══════════════════════════════════════
                   LEFT COLUMN — Client Form (3/5)
                ══════════════════════════════════════ */}
                <div className="lg:col-span-3 space-y-5">
                  {/* ── Section: Datos Personales ── */}
                  <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.04] bg-[#FAFAFA]">
                      <div className="w-8 h-8 rounded-full bg-[#E63946]/10 flex items-center justify-center">
                        <i className="fas fa-user text-[#E63946] text-xs" />
                      </div>
                      <div>
                        <h4
                          className="text-base tracking-wider uppercase text-[#1A1A1A]"
                          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                        >
                          DATOS DEL COMPRADOR
                        </h4>
                        <p className="text-[10px] text-[#999] font-medium">
                          Si ya has comprado antes, te identificamos automáticamente
                        </p>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Nombre */}
                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-[#666] uppercase tracking-wider mb-1.5">
                          Nombre Completo <span className="text-[#E63946]">*</span>
                        </label>
                        <div className="relative">
                          <i className={`fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isReturningClient ? 'text-green-400' : 'text-[#ccc]'}`} />
                          <input
                            type="text"
                            placeholder="Juan Carlos Pérez"
                            value={buyerData.nombre}
                            onChange={(e) => { if (!isReturningClient) setBuyerData({ ...buyerData, nombre: e.target.value }); }}
                            onBlur={() => setFormTouched({ ...formTouched, nombre: true })}
                            readOnly={isReturningClient}
                            className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-[#1A1A1A] text-sm font-medium placeholder:text-[#ccc] focus:outline-none transition-all ${
                              isReturningClient
                                ? 'border-green-200 bg-green-50/40 text-green-900 cursor-not-allowed'
                                : formTouched.nombre && formErrors.nombre
                                ? 'border-[#E63946]/40 bg-[#FFF5F5] focus:border-[#E63946]/60 focus:ring-2 focus:ring-[#E63946]/10'
                                : formTouched.nombre && buyerData.nombre.trim().length >= 2
                                ? 'border-green-300 bg-green-50/30 focus:border-green-400 focus:ring-2 focus:ring-green-100'
                                : 'border-black/[0.08] bg-white focus:border-[#E63946]/40 focus:ring-2 focus:ring-[#E63946]/10'
                            }`}
                          />
                          {(isReturningClient || (formTouched.nombre && buyerData.nombre.trim().length >= 2 && !formErrors.nombre)) && (
                            <i className={`fas ${isReturningClient ? 'fa-lock' : 'fa-check-circle'} absolute right-4 top-1/2 -translate-y-1/2 text-green-500 text-sm`} />
                          )}
                        </div>
                        {formTouched.nombre && formErrors.nombre && !isReturningClient && (
                          <p className="text-[11px] text-[#E63946] mt-1 font-medium flex items-center gap-1">
                            <i className="fas fa-exclamation-circle text-[9px]" />
                            {formErrors.nombre}
                          </p>
                        )}
                      </div>

                      {/* Cédula */}
                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-[#666] uppercase tracking-wider mb-1.5">
                          Cédula / Documento
                          {!isReturningClient && <span className="text-[10px] font-normal normal-case text-[#bbb] tracking-normal ml-1">(opcional)</span>}
                        </label>
                        <div className="relative">
                          <i className={`fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isReturningClient ? 'text-green-400' : 'text-[#ccc]'}`} />
                          <input
                            type="text"
                            placeholder="1.234.567.890"
                            value={buyerData.identificacion}
                            onChange={(e) => { if (!isReturningClient) setBuyerData({ ...buyerData, identificacion: e.target.value }); }}
                            onBlur={() => setFormTouched({ ...formTouched, identificacion: true })}
                            readOnly={isReturningClient}
                            className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-[#1A1A1A] text-sm font-medium placeholder:text-[#ccc] focus:outline-none transition-all ${
                              isReturningClient
                                ? 'border-green-200 bg-green-50/40 text-green-900 cursor-not-allowed'
                                : formTouched.identificacion && formErrors.identificacion
                                ? 'border-[#E63946]/40 bg-[#FFF5F5] focus:border-[#E63946]/60 focus:ring-2 focus:ring-[#E63946]/10'
                                : 'border-black/[0.08] bg-white focus:border-[#E63946]/40 focus:ring-2 focus:ring-[#E63946]/10'
                            }`}
                          />
                          {isReturningClient && (
                            <i className="fas fa-lock absolute right-4 top-1/2 -translate-y-1/2 text-green-500 text-sm" />
                          )}
                        </div>
                        {formTouched.identificacion && formErrors.identificacion && !isReturningClient && (
                          <p className="text-[11px] text-[#E63946] mt-1 font-medium flex items-center gap-1">
                            <i className="fas fa-exclamation-circle text-[9px]" />
                            {formErrors.identificacion}
                          </p>
                        )}
                      </div>

                      {/* Teléfono */}
                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-[#666] uppercase tracking-wider mb-1.5">
                          <i className="fab fa-whatsapp text-green-500 text-xs" /> WhatsApp / Teléfono <span className="text-[#E63946]">*</span>
                        </label>
                        <div className="relative">
                          <i className={`fab fa-whatsapp absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isReturningClient ? 'text-green-400' : 'text-[#ccc]'}`} />
                          <input
                            type="tel"
                            placeholder="300 123 4567"
                            value={buyerData.telefono}
                            onChange={(e) => { if (!isReturningClient) setBuyerData({ ...buyerData, telefono: e.target.value }); }}
                            onBlur={() => setFormTouched({ ...formTouched, telefono: true })}
                            readOnly={isReturningClient}
                            className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-[#1A1A1A] text-sm font-medium placeholder:text-[#ccc] focus:outline-none transition-all ${
                              isReturningClient
                                ? 'border-green-200 bg-green-50/40 text-green-900 cursor-not-allowed'
                                : formTouched.telefono && formErrors.telefono
                                ? 'border-[#E63946]/40 bg-[#FFF5F5] focus:border-[#E63946]/60 focus:ring-2 focus:ring-[#E63946]/10'
                                : formTouched.telefono && buyerData.telefono.trim().length >= 7 && !formErrors.telefono
                                ? 'border-green-300 bg-green-50/30 focus:border-green-400 focus:ring-2 focus:ring-green-100'
                                : 'border-black/[0.08] bg-white focus:border-[#E63946]/40 focus:ring-2 focus:ring-[#E63946]/10'
                            }`}
                          />
                          {(isReturningClient || (formTouched.telefono && buyerData.telefono.trim().length >= 7 && !formErrors.telefono)) && (
                            <i className={`fas ${isReturningClient ? 'fa-lock' : 'fa-check-circle'} absolute right-4 top-1/2 -translate-y-1/2 text-green-500 text-sm`} />
                          )}
                        </div>
                        {formTouched.telefono && formErrors.telefono && !isReturningClient && (
                          <p className="text-[11px] text-[#E63946] mt-1 font-medium flex items-center gap-1">
                            <i className="fas fa-exclamation-circle text-[9px]" />
                            {formErrors.telefono}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-[#666] uppercase tracking-wider mb-1.5">
                          Correo Electrónico
                          {!isReturningClient && <span className="text-[10px] font-normal normal-case text-[#bbb] tracking-normal ml-1">(opcional)</span>}
                        </label>
                        <div className="relative">
                          <i className={`fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isReturningClient ? 'text-green-400' : 'text-[#ccc]'}`} />
                          <input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={buyerData.email}
                            onChange={(e) => { if (!isReturningClient) setBuyerData({ ...buyerData, email: e.target.value }); }}
                            onBlur={() => setFormTouched({ ...formTouched, email: true })}
                            readOnly={isReturningClient}
                            className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-[#1A1A1A] text-sm font-medium placeholder:text-[#ccc] focus:outline-none transition-all ${
                              isReturningClient
                                ? 'border-green-200 bg-green-50/40 text-green-900 cursor-not-allowed'
                                : formTouched.email && formErrors.email
                                ? 'border-[#E63946]/40 bg-[#FFF5F5] focus:border-[#E63946]/60 focus:ring-2 focus:ring-[#E63946]/10'
                                : formTouched.email && buyerData.email.trim() && !formErrors.email
                                ? 'border-green-300 bg-green-50/30 focus:border-green-400 focus:ring-2 focus:ring-green-100'
                                : 'border-black/[0.08] bg-white focus:border-[#E63946]/40 focus:ring-2 focus:ring-[#E63946]/10'
                            }`}
                          />
                          {(isReturningClient || (formTouched.email && buyerData.email.trim() && !formErrors.email)) && (
                            <i className={`fas ${isReturningClient ? 'fa-lock' : 'fa-check-circle'} absolute right-4 top-1/2 -translate-y-1/2 text-green-500 text-sm`} />
                          )}
                        </div>
                        {formTouched.email && formErrors.email && !isReturningClient && (
                          <p className="text-[11px] text-[#E63946] mt-1 font-medium flex items-center gap-1">
                            <i className="fas fa-exclamation-circle text-[9px]" />
                            {formErrors.email}
                          </p>
                        )}
                      </div>

                      {/* Dirección */}
                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-[#666] uppercase tracking-wider mb-1.5">
                          Dirección
                          <span className="text-[10px] font-normal normal-case text-[#bbb] tracking-normal ml-1">(opcional)</span>
                        </label>
                        <div className="relative">
                          <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-[#ccc] text-sm" />
                          <input
                            type="text"
                            placeholder="Calle 123 #45-67, Ciudad"
                            value={buyerData.direccion}
                            onChange={(e) => setBuyerData({ ...buyerData, direccion: e.target.value })}
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-black/[0.08] bg-white text-[#1A1A1A] text-sm font-medium placeholder:text-[#ccc] focus:outline-none focus:border-[#E63946]/40 focus:ring-2 focus:ring-[#E63946]/10 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Returning client hint / WhatsApp edit notice */}
                    <div className="px-5 pb-4">
                      {isReturningClient ? (
                        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                          <i className="fas fa-lock text-amber-500 text-xs mt-0.5" />
                          <p className="text-[11px] text-amber-700 leading-relaxed">
                            <strong>Tus datos están protegidos.</strong> Si necesitas modificarlos, comunícate con nosotros:{' '}
                            <a href="https://wa.me/573207120787?text=Hola!%20Necesito%20actualizar%20mis%20datos%20de%20registro%20para%20la%20rifa." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-600 font-bold hover:text-green-700 transition-colors">
                              <i className="fab fa-whatsapp text-xs" /> WhatsApp
                            </a>
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                          <i className="fas fa-info-circle text-blue-400 text-xs mt-0.5" />
                          <p className="text-[11px] text-blue-600/80 leading-relaxed">
                            <strong>¿Ya compraste antes?</strong> Ingresa el mismo teléfono o cédula y tu historial de compras se vinculará automáticamente.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Section: Método de Pago ── */}
                  {mediosPago.length > 0 && (
                    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.04] bg-[#FAFAFA]">
                        <div className="w-8 h-8 rounded-full bg-[#FFB703]/10 flex items-center justify-center">
                          <i className="fas fa-credit-card text-[#FFB703] text-xs" />
                        </div>
                        <div>
                          <h4
                            className="text-base tracking-wider uppercase text-[#1A1A1A]"
                            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                          >
                            MÉTODO DE PAGO
                          </h4>
                          <p className="text-[10px] text-[#999] font-medium">
                            Selecciona cómo vas a pagar
                          </p>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="grid grid-cols-2 gap-2.5">
                          {mediosPago.map((mp) => {
                            const isActive = selectedMedioPago === mp.id;
                            const iconMap: Record<string, { gradient: string; icon: string }> = {
                              Nequi: { gradient: 'from-[#E20074] to-[#B0005C]', icon: 'fas fa-mobile-alt' },
                              PSE: { gradient: 'from-[#003DA5] to-[#002D7A]', icon: 'fas fa-university' },
                              Efectivo: { gradient: 'from-[#34C759] to-[#2AAE4A]', icon: 'fas fa-money-bill-wave' },
                              'Tarjeta Crédito': { gradient: 'from-[#1A1A1A] to-[#333]', icon: 'fas fa-credit-card' },
                              'Tarjeta Débito': { gradient: 'from-[#555] to-[#333]', icon: 'far fa-credit-card' },
                              Bancolombia: { gradient: 'from-[#FDDA24] to-[#E6C420]', icon: 'fas fa-building-columns' },
                              Daviplata: { gradient: 'from-[#ED1C24] to-[#C0161E]', icon: 'fas fa-wallet' },
                            };
                            const config = iconMap[mp.nombre] || { gradient: 'from-[#888] to-[#666]', icon: 'fas fa-wallet' };

                            return (
                              <button
                                key={mp.id}
                                type="button"
                                onClick={() => setSelectedMedioPago(isActive ? '' : mp.id)}
                                className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
                                  isActive
                                    ? 'border-[#E63946]/30 bg-[#E63946]/[0.04] ring-2 ring-[#E63946]/10 shadow-sm'
                                    : 'border-black/[0.06] bg-[#FAFAFA] hover:border-black/15 hover:bg-white'
                                }`}
                              >
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                  <i className={`${config.icon} text-white text-xs`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[12px] font-bold truncate ${isActive ? 'text-[#E63946]' : 'text-[#333]'}`}>
                                    {mp.nombre}
                                  </p>
                                  {mp.descripcion && (
                                    <p className="text-[10px] text-[#999] truncate">{mp.descripcion}</p>
                                  )}
                                </div>
                                {isActive && (
                                  <i className="fas fa-check-circle text-[#E63946] text-sm flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Section: Notas ── */}
                  <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.04] bg-[#FAFAFA]">
                      <div className="w-8 h-8 rounded-full bg-[#6366F1]/10 flex items-center justify-center">
                        <i className="fas fa-sticky-note text-[#6366F1] text-xs" />
                      </div>
                      <div>
                        <h4
                          className="text-base tracking-wider uppercase text-[#1A1A1A]"
                          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                        >
                          NOTAS ADICIONALES
                        </h4>
                        <p className="text-[10px] text-[#999] font-medium">
                          Información extra sobre tu pago (opcional)
                        </p>
                      </div>
                    </div>
                    <div className="p-5">
                      <textarea
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Ej: Pagaré por Nequi mañana a primera hora, envío comprobante por WhatsApp..."
                        maxLength={1000}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-black/[0.08] bg-white text-[#1A1A1A] text-sm font-medium placeholder:text-[#ccc] focus:outline-none focus:border-[#E63946]/40 focus:ring-2 focus:ring-[#E63946]/10 transition-all resize-none"
                      />
                      <p className="text-[10px] text-[#ccc] text-right mt-1">{notas.length}/1000</p>
                    </div>
                  </div>
                </div>

                {/* ══════════════════════════════════════
                   RIGHT COLUMN — Order Summary (2/5)
                ══════════════════════════════════════ */}
                <div className="lg:col-span-2">
                  <div className="lg:sticky lg:top-[72px] space-y-5">
                    {/* Order summary card */}
                    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-br from-[#111113] to-[#1a1a1f] px-5 py-5 relative overflow-hidden">
                        <div className="absolute inset-0 prize-shimmer pointer-events-none" />
                        <div className="relative">
                          <h4
                            className="text-lg tracking-wider uppercase text-white mb-1"
                            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                          >
                            RESUMEN DE COMPRA
                          </h4>
                          <p className="text-white/40 text-[11px] font-semibold">
                            {rifa?.nombre}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Boletas */}
                        <div>
                          <label className="text-[10px] font-bold text-[#999] uppercase tracking-wider block mb-2">
                            Boletas Seleccionadas
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedNums.map((num) => (
                              <span
                                key={num}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#E63946]/[0.07] border border-[#E63946]/15 text-[#E63946] text-[12px] font-black tracking-wider"
                                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                              >
                                #{formatNumero(num, totalBoletas)}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Prize reminder */}
                        {rifa?.premio_principal && (
                          <div className="flex items-center gap-2 bg-gradient-to-r from-[#FFB703]/10 to-[#FFD700]/5 border border-[#FFB703]/15 rounded-xl px-3 py-2.5">
                            <span className="text-lg">🏆</span>
                            <div>
                              <p className="text-[10px] font-bold text-[#B87A00] uppercase tracking-wider">Premio Mayor</p>
                              <p className="text-[12px] font-bold text-[#8B6914]">{rifa.premio_principal}</p>
                            </div>
                          </div>
                        )}

                        {/* Price breakdown */}
                        <div className="space-y-2 pt-2 border-t border-black/[0.04]">
                          <div className="flex justify-between text-[13px]">
                            <span className="text-[#888]">{selectedCount} × Boleta</span>
                            <span className="text-[#555] font-semibold">{formatCOP(precio)}</span>
                          </div>
                          {selectedMedioPago && (
                            <div className="flex justify-between text-[13px]">
                              <span className="text-[#888]">Método</span>
                              <span className="text-[#555] font-semibold">
                                {mediosPago.find(m => m.id === selectedMedioPago)?.nombre || '—'}
                              </span>
                            </div>
                          )}
                          <div className="h-px bg-black/[0.06] my-1" />
                          <div className="flex justify-between items-end">
                            <span className="text-[13px] font-bold text-[#1A1A1A]">Total a Pagar</span>
                            <span
                              className="text-3xl font-black text-[#E63946]"
                              style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}
                            >
                              {formatCOP(totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={handleReservar}
                      disabled={actionLoading || !isFormValid}
                      className="w-full btn-primary text-[14px] py-4 justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#E63946]/20"
                    >
                      {actionLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin text-xs" />
                          PROCESANDO...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-lock text-xs" />
                          CONFIRMAR RESERVA — {formatCOP(totalAmount)}
                        </>
                      )}
                    </button>

                    {/* Validation summary */}
                    {!isFormValid && Object.keys(formTouched).length > 0 && (
                      <div className="bg-[#FFF5F5] border border-[#E63946]/10 rounded-xl px-4 py-3">
                        <p className="text-[11px] text-[#E63946]/80 font-medium flex items-center gap-1.5">
                          <i className="fas fa-info-circle text-[10px]" />
                          Completa nombre y teléfono para continuar
                        </p>
                      </div>
                    )}

                    {/* Cancel button */}
                    <button
                      onClick={handleCancelBloqueo}
                      className="w-full text-center text-[12px] text-[#999] hover:text-[#E63946] font-semibold transition-colors py-2"
                    >
                      <i className="fas fa-arrow-left text-[10px] mr-1" />
                      Cancelar y volver a seleccionar
                    </button>

                    {/* Trust badges */}
                    <div className="flex flex-col items-center gap-2 pt-2">
                      {[
                        { icon: 'fa-shield-halved', text: '72 horas para enviar comprobante' },
                        { icon: 'fa-clock', text: 'Tu reserva queda guardada' },
                        { icon: 'fa-whatsapp fab', text: 'Soporte por WhatsApp' },
                      ].map((badge) => (
                        <div key={badge.text} className="flex items-center gap-2">
                          <i className={`${badge.icon.includes('fab') ? badge.icon : `fas ${badge.icon}`} text-[#ccc] text-[10px]`} />
                          <span className="text-[10px] text-[#bbb] font-medium">{badge.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════
           STEP: CONFIRMED (Reserva creada exitosamente)
        ═══════════════════════════════════════════════════ */}
        {step === 'confirmed' && reservaResult && (
          <section className="max-w-[600px] mx-auto px-4 sm:px-6 py-8 sm:py-16">
            <div className="bg-white rounded-2xl shadow-xl border border-black/[0.06] overflow-hidden shop-fade-in">
              {/* Success header */}
              <div className="bg-gradient-to-br from-[#111113] to-[#1a1a1f] px-6 py-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 prize-shimmer pointer-events-none" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 shop-pop-in">
                    <i className="fas fa-check-circle text-green-400 text-3xl" />
                  </div>
                  <h3
                    className="text-3xl tracking-wider uppercase text-white mb-2"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    ¡RESERVA CREADA!
                  </h3>
                  <p className="text-white/50 text-sm">{reservaResult.mensaje}</p>
                </div>
              </div>

              <div className="px-6 py-6 space-y-5">
                {/* Token card */}
                <div className="bg-gradient-to-r from-[#FFF8E7] to-[#FFF3D4] border border-[#FFB703]/25 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-[#B87A00] uppercase tracking-wider mb-1">
                    Tu Token de Reserva
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] text-[#8B6914] font-mono break-all flex-1 bg-white/60 rounded-lg px-3 py-2">
                      {reservaResult.reserva_token}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(reservaResult.reserva_token);
                      }}
                      className="w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center text-[#B87A00] hover:bg-white transition-all flex-shrink-0"
                      title="Copiar token"
                    >
                      <i className="fas fa-copy text-sm" />
                    </button>
                  </div>
                  <p className="text-[10px] text-[#B87A00]/70 mt-2">
                    <i className="fas fa-info-circle mr-1" />
                    Guarda este token. Lo necesitas para consultar el estado de tu reserva.
                  </p>
                </div>

                {/* Order details */}
                <div className="bg-[#FAFAFA] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888]">Comprador</span>
                    <span className="font-bold text-[#1A1A1A]">
                      {reservaResult.cliente_nombre}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888]">Rifa</span>
                    <span className="font-semibold text-[#555]">{reservaResult.rifa}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888]">Boletas</span>
                    <span className="font-bold text-[#1A1A1A]">
                      {reservaResult.boletas
                        .map((n) => `#${formatNumero(n, totalBoletas)}`)
                        .join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888]">Cantidad</span>
                    <span className="font-semibold text-[#555]">
                      {reservaResult.cantidad_boletas}
                    </span>
                  </div>
                  <div className="h-px bg-black/[0.06]" />
                  <div className="flex justify-between">
                    <span className="text-[13px] font-bold text-[#1A1A1A]">Total</span>
                    <span
                      className="text-2xl font-black text-[#E63946]"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      {formatCOP(reservaResult.monto_total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888]">Vence</span>
                    <span className="font-semibold text-[#B87A00]">
                      {new Date(reservaResult.expires_at).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-[#FFF8E7] border border-[#FFB703]/20 rounded-xl p-4">
                  <p className="text-[12px] font-bold text-[#B87A00] mb-2">
                    <i className="fas fa-info-circle mr-1" /> Próximos pasos:
                  </p>
                  <ol className="text-[12px] text-[#8B6914] space-y-1.5 list-decimal list-inside">
                    {reservaResult.instrucciones.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ol>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {/* WhatsApp buttons — dual numbers */}
                  {[
                    { num: '573207120787', display: '320 712 0787' },
                    { num: '573207120779', display: '320 712 0779' },
                  ].map((wa) => (
                    <a
                      key={wa.num}
                      href={`https://wa.me/${wa.num}?text=${encodeURIComponent(
                        `¡Hola! Acabo de reservar ${reservaResult.cantidad_boletas} boleta(s): ${reservaResult.boletas.map((n) => `#${formatNumero(n, totalBoletas)}`).join(', ')}. Mi nombre es ${reservaResult.cliente_nombre}. Total: ${formatCOP(reservaResult.monto_total)}.${selectedMedioPago ? ` Medio de pago: ${mediosPago.find(m => m.id === selectedMedioPago)?.nombre || 'No seleccionado'}.` : ''}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-[#25D366] text-white text-[14px] font-bold shadow-lg hover:bg-[#20BD5A] transition-all"
                    >
                      <i className="fab fa-whatsapp text-xl" />
                      WHATSAPP {wa.display}
                    </a>
                  ))}

                  <button
                    onClick={() => handleCheckStatus(reservaResult.reserva_token)}
                    disabled={actionLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-black/10 text-[#555] text-[13px] font-bold hover:border-black/20 hover:text-[#333] transition-all"
                  >
                    {actionLoading ? (
                      <i className="fas fa-spinner fa-spin text-sm" />
                    ) : (
                      <i className="fas fa-search text-sm" />
                    )}
                    Consultar Estado
                  </button>

                  {/* Download boletas link */}
                  {buyerData.identificacion && (
                    <a
                      href={`/mis-boletas/${buyerData.identificacion}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-[#E63946]/20 text-[#E63946] text-[13px] font-bold hover:bg-[#E63946]/5 hover:border-[#E63946]/30 transition-all"
                    >
                      <i className="fas fa-download text-sm" />
                      Descargar Mis Boletas
                    </a>
                  )}

                  <button
                    onClick={handleReset}
                    className="text-[13px] text-[#999] hover:text-[#555] font-semibold py-2 transition-colors"
                  >
                    Comprar más boletas
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════
           STEP: STATUS (Consulta de estado de reserva)
        ═══════════════════════════════════════════════════ */}
        {step === 'status' && estadoReserva && (
          <section className="max-w-[600px] mx-auto px-4 sm:px-6 py-8 sm:py-16">
            <div className="bg-white rounded-2xl shadow-xl border border-black/[0.06] overflow-hidden shop-fade-in">
              {/* Status header */}
              <div
                className={`px-6 py-8 text-center relative overflow-hidden ${
                  estadoReserva.estado === 'PAGADA'
                    ? 'bg-gradient-to-br from-green-600 to-green-800'
                    : estadoReserva.estado === 'CANCELADA'
                      ? 'bg-gradient-to-br from-red-600 to-red-800'
                      : estadoReserva.estado === 'ABONADA'
                        ? 'bg-gradient-to-br from-[#FFB703] to-[#E6A800]'
                        : 'bg-gradient-to-br from-[#111113] to-[#1a1a1f]'
                }`}
              >
                <div className="relative">
                  {/* Status icon */}
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      estadoReserva.estado === 'PAGADA'
                        ? 'bg-white/20'
                        : estadoReserva.estado === 'CANCELADA'
                          ? 'bg-white/20'
                          : estadoReserva.estado === 'ABONADA'
                            ? 'bg-white/20'
                            : 'bg-white/10'
                    }`}
                  >
                    <i
                      className={`fas text-3xl ${
                        estadoReserva.estado === 'PAGADA'
                          ? 'fa-check-circle text-white'
                          : estadoReserva.estado === 'CANCELADA'
                            ? 'fa-times-circle text-white'
                            : estadoReserva.estado === 'ABONADA'
                              ? 'fa-clock text-white'
                              : 'fa-hourglass-half text-[#FFB703]'
                      }`}
                    />
                  </div>
                  <h3
                    className="text-3xl tracking-wider uppercase text-white mb-2"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    {estadoReserva.estado === 'PAGADA'
                      ? '¡PAGO CONFIRMADO!'
                      : estadoReserva.estado === 'CANCELADA'
                        ? 'RESERVA CANCELADA'
                        : estadoReserva.estado === 'ABONADA'
                          ? 'ABONO REGISTRADO'
                          : 'PENDIENTE DE PAGO'}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {estadoReserva.estado === 'PAGADA'
                      ? 'Tu compra ha sido confirmada exitosamente'
                      : estadoReserva.estado === 'CANCELADA'
                        ? 'Las boletas han sido liberadas'
                        : estadoReserva.estado === 'ABONADA'
                          ? `Has abonado ${formatCOP(estadoReserva.abono_total)} de ${formatCOP(estadoReserva.monto_total)}`
                          : 'Esperando confirmación de pago'}
                  </p>
                </div>
              </div>

              <div className="px-6 py-6 space-y-5">
                {/* Financial summary */}
                <div className="bg-[#FAFAFA] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888]">Cliente</span>
                    <span className="font-bold text-[#1A1A1A]">{estadoReserva.cliente}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888]">Rifa</span>
                    <span className="font-semibold text-[#555]">{estadoReserva.rifa}</span>
                  </div>
                  {estadoReserva.premio && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888]">Premio</span>
                      <span className="font-semibold text-[#FFB703]">{estadoReserva.premio}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888]">Boletas</span>
                    <span className="font-bold text-[#1A1A1A]">
                      {estadoReserva.boletas
                        .map((b) => `#${formatNumero(b.numero, totalBoletas)}`)
                        .join(', ')}
                    </span>
                  </div>
                  <div className="h-px bg-black/[0.06]" />
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888]">Monto Total</span>
                    <span className="font-bold text-[#1A1A1A]">
                      {formatCOP(estadoReserva.monto_total)}
                    </span>
                  </div>
                  {estadoReserva.abono_total > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888]">Abonado</span>
                      <span className="font-bold text-green-600">
                        {formatCOP(estadoReserva.abono_total)}
                      </span>
                    </div>
                  )}
                  {estadoReserva.saldo_pendiente > 0 &&
                    estadoReserva.estado !== 'CANCELADA' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#888]">Saldo Pendiente</span>
                        <span className="font-bold text-[#E63946]">
                          {formatCOP(estadoReserva.saldo_pendiente)}
                        </span>
                      </div>
                    )}
                  <div className="h-px bg-black/[0.06]" />
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888]">Fecha Sorteo</span>
                    <span className="font-semibold text-[#555]">
                      {new Date(estadoReserva.fecha_sorteo).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {estadoReserva.estado !== 'PAGADA' &&
                    estadoReserva.estado !== 'CANCELADA' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#888]">Vence</span>
                        <span className="font-semibold text-[#B87A00]">
                          {new Date(estadoReserva.expires_at).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                </div>

                {/* Boletas status chips */}
                <div>
                  <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider block mb-2">
                    Estado de tus boletas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {estadoReserva.boletas.map((b) => (
                      <span
                        key={b.numero}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-black tracking-wider border ${
                          b.estado === 'PAGADA' || b.estado === 'VENDIDA'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : b.estado === 'CANCELADA'
                              ? 'bg-red-50 border-red-200 text-red-500 line-through'
                              : 'bg-[#E63946]/[0.07] border-[#E63946]/15 text-[#E63946]'
                        }`}
                        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                      >
                        #{formatNumero(b.numero, totalBoletas)}
                        <span
                          className="text-[9px] font-semibold opacity-70"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {b.estado}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {(estadoReserva.estado === 'PENDIENTE' ||
                    estadoReserva.estado === 'ABONADA') && (
                    <div className="flex flex-col gap-2">
                      {[
                        { num: '573207120787', display: '320 712 0787' },
                        { num: '573207120779', display: '320 712 0779' },
                      ].map((wa) => (
                        <a
                          key={wa.num}
                          href={`https://wa.me/${wa.num}?text=${encodeURIComponent(
                            `¡Hola! Soy ${estadoReserva.cliente}. Quiero enviar mi comprobante de pago para mi reserva de boleta(s).`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-[#25D366] text-white text-[14px] font-bold shadow-lg hover:bg-[#20BD5A] transition-all"
                        >
                          <i className="fab fa-whatsapp text-xl" />
                          WHATSAPP {wa.display}
                        </a>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => handleCheckStatus()}
                    disabled={actionLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-black/10 text-[#555] text-[13px] font-bold hover:border-black/20 hover:text-[#333] transition-all"
                  >
                    {actionLoading ? (
                      <i className="fas fa-spinner fa-spin text-sm" />
                    ) : (
                      <i className="fas fa-sync-alt text-sm" />
                    )}
                    Actualizar Estado
                  </button>
                  <button
                    onClick={handleReset}
                    className="text-[13px] text-[#999] hover:text-[#555] font-semibold py-2 transition-colors"
                  >
                    Comprar más boletas
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══ FLOATING CART BAR ═══ */}
        {selectedCount > 0 && step === 'selecting' && (
          <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
            <div className="bg-[#111113]/95 backdrop-blur-xl border-t border-white/[0.08]">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#E63946]/20 flex items-center justify-center">
                      <i className="fas fa-ticket text-[#E63946] text-sm" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">
                        {selectedCount} boleta{selectedCount > 1 ? 's' : ''}
                      </p>
                      <p className="text-white/40 text-[11px]">
                        {selectedNums
                          .slice(0, 5)
                          .map((n) => `#${formatNumero(n, totalBoletas)}`)
                          .join(', ')}
                        {selectedCount > 5 ? ` +${selectedCount - 5} más` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">
                      Total
                    </p>
                    <p
                      className="text-xl sm:text-2xl text-white font-black leading-none"
                      style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}
                    >
                      {formatCOP(totalAmount)}
                    </p>
                  </div>
                  <button
                    onClick={handleBloquear}
                    disabled={actionLoading}
                    className="btn-primary text-[12px] sm:text-[13px] px-6 sm:px-8 py-3"
                  >
                    {actionLoading ? (
                      <i className="fas fa-spinner fa-spin text-[10px]" />
                    ) : (
                      <i className="fas fa-lock text-[10px]" />
                    )}
                    RESERVAR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TRUST STRIP ═══ */}
        {step === 'selecting' && (
          <section className="bg-[#F5F2EE] border-t border-black/[0.04] py-10 sm:py-14">
            <div className="max-w-[1000px] mx-auto px-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                {[
                  { icon: 'fa-shield-halved', title: '100% Seguro', desc: 'Compra protegida' },
                  {
                    icon: 'fa-ticket',
                    title: 'Boleta Digital',
                    desc: 'Al instante por WhatsApp',
                  },
                  {
                    icon: 'fa-trophy',
                    title: rifa?.premio_principal ? 'Premio Mayor' : '+$300M',
                    desc: rifa?.premio_principal || 'En premios totales',
                  },
                  { icon: 'fa-users', title: '+2,000', desc: 'Participantes activos' },
                ].map((item) => (
                  <div key={item.title}>
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <i className={`fas ${item.icon} text-[#E63946] text-lg`} />
                    </div>
                    <p className="text-[13px] font-bold text-[#1A1A1A]">{item.title}</p>
                    <p className="text-[11px] text-[#999] mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ BOTTOM CTA ═══ */}
        {step === 'selecting' && (
          <section className="bg-[#111113] py-12 sm:py-16">
            <div className="max-w-[700px] mx-auto px-6 text-center">
              <h2
                className="text-[clamp(28px,5vw,48px)] leading-[0.9] uppercase tracking-wider text-white mb-4"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                ¿AÚN NO TE <span className="text-truck-red">DECIDES</span>?
              </h2>
              <p className="text-white/45 text-sm sm:text-base mb-6 max-w-md mx-auto">
                Solo necesitas una boleta para cambiar tu vida. No dejes que otro se lleve tu
                premio.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    pickRandom();
                    gridRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-primary text-[13px] px-8 py-4"
                >
                  <i className="fas fa-dice" />
                  ELEGIR AL AZAR
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <a
                    href="https://wa.me/573207120787?text=Tengo%20una%20pregunta%20sobre%20las%20boletas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/15 text-white/60 text-[13px] font-bold hover:border-white/30 hover:text-white/80 transition-all"
                  >
                    <i className="fab fa-whatsapp text-lg text-green-400" />
                    320 712 0787
                  </a>
                  <a
                    href="https://wa.me/573207120779?text=Tengo%20una%20pregunta%20sobre%20las%20boletas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/15 text-white/60 text-[13px] font-bold hover:border-white/30 hover:text-white/80 transition-all"
                  >
                    <i className="fab fa-whatsapp text-lg text-green-400" />
                    320 712 0779
                  </a>
                </div>
              </div>

              {/* Lookup section — Token + Cédula */}
              <div className="mt-10 pt-8 border-t border-white/10">
                <p className="text-white/30 text-[11px] font-bold uppercase tracking-wider mb-4">
                  ¿Ya compraste? Consulta tu estado
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                  {/* Token lookup */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Token de reserva..."
                      value={lookupToken}
                      onChange={(e) => setLookupToken(e.target.value)}
                      className="flex-1 px-3 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-mono placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-all"
                    />
                    <button
                      onClick={() => handleCheckStatus()}
                      disabled={!lookupToken.trim() || actionLoading}
                      className="px-4 py-3 rounded-xl bg-white/15 text-white text-sm font-bold hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      {actionLoading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-search" />}
                    </button>
                  </div>
                  {/* Cédula lookup */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Nº de cédula..."
                      value={lookupCedula}
                      onChange={(e) => setLookupCedula(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCedulaLookup();
                      }}
                      className="flex-1 px-3 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-mono placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-all"
                    />
                    <button
                      onClick={() => handleCedulaLookup()}
                      disabled={!lookupCedula.trim() || actionLoading}
                      className="px-4 py-3 rounded-xl bg-[#E63946]/80 text-white text-sm font-bold hover:bg-[#E63946] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      {actionLoading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-id-card" />}
                    </button>
                  </div>
                </div>
                <p className="text-white/20 text-[10px] mt-2">
                  Busca por token de reserva o número de cédula
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════
           STEP: MI CUENTA (Cédula lookup)
        ═══════════════════════════════════════════════════ */}
        {step === 'mi-cuenta' && (
          <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="shop-fade-in">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E63946]/10 mb-4">
                  <i className="fas fa-user-circle text-[#E63946] text-2xl" />
                </div>
                <h2
                  className="text-3xl sm:text-4xl tracking-wider uppercase text-[#1A1A1A]"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  MI <span className="text-truck-red">CUENTA</span>
                </h2>
                <p className="text-[#999] text-sm mt-2">
                  Consulta el estado de tus compras y boletas
                </p>
              </div>

              {/* Search box */}
              {!cedulaResult && (
                <div className="max-w-md mx-auto mb-8">
                  <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-6 space-y-4">
                    <label className="text-[11px] font-bold text-[#666] uppercase tracking-wider block">
                      Ingresa tu número de cédula
                    </label>
                    <div className="relative">
                      <i className="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-[#ccc] text-sm" />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="1.234.567.890"
                        value={lookupCedula}
                        onChange={(e) => setLookupCedula(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCedulaLookup();
                        }}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-black/[0.08] bg-white text-[#1A1A1A] text-lg font-mono font-semibold placeholder:text-[#ccc] focus:outline-none focus:border-[#E63946]/40 focus:ring-2 focus:ring-[#E63946]/10 transition-all tracking-wider"
                      />
                    </div>
                    <button
                      onClick={() => handleCedulaLookup()}
                      disabled={!lookupCedula.trim() || actionLoading}
                      className="w-full btn-primary text-[13px] py-3.5 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin text-xs" />
                          BUSCANDO...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-search text-xs" />
                          CONSULTAR MIS COMPRAS
                        </>
                      )}
                    </button>

                    {/* Also support token lookup */}
                    <div className="pt-3 border-t border-black/[0.04]">
                      <p className="text-[10px] text-[#bbb] font-bold uppercase tracking-wider mb-2 text-center">
                        O busca por token de reserva
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Token de reserva..."
                          value={lookupToken}
                          onChange={(e) => setLookupToken(e.target.value)}
                          className="flex-1 px-3 py-2.5 rounded-lg border border-black/[0.06] bg-[#FAFAFA] text-[#1A1A1A] text-xs font-mono placeholder:text-[#ccc] focus:outline-none focus:border-[#E63946]/40 transition-all"
                        />
                        <button
                          onClick={() => handleCheckStatus()}
                          disabled={!lookupToken.trim() || actionLoading}
                          className="px-4 py-2.5 rounded-lg bg-[#111] text-white text-xs font-bold hover:bg-[#333] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <i className="fas fa-search" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {actionError && (
                    <div className="mt-4 bg-[#FFF5F5] border border-[#E63946]/10 rounded-xl px-4 py-3 flex items-center gap-2">
                      <i className="fas fa-exclamation-circle text-[#E63946] text-sm" />
                      <p className="text-[#E63946] text-sm font-medium flex-1">{actionError}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── Cédula Results ─── */}
              {cedulaResult && !selectedBoletaView && (
                <div className="space-y-6">
                  {/* Client info card */}
                  <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-[#111113] to-[#1a1a1f] px-6 py-5 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-user text-white/60 text-xl" />
                      </div>
                      <div>
                        <h3
                          className="text-xl tracking-wider uppercase text-white"
                          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                        >
                          {cedulaResult.cliente?.nombre || 'Cliente'}
                        </h3>
                        <div className="flex items-center gap-3 text-[11px] text-white/40 font-semibold mt-1">
                          <span><i className="fas fa-id-card mr-1" /> CC {cedulaResult.cliente?.identificacion || lookupCedula}</span>
                          {cedulaResult.cliente?.telefono && <span><i className="fas fa-phone mr-1" /> {cedulaResult.cliente.telefono}</span>}
                          {cedulaResult.cliente?.email && (
                            <span className="hidden sm:inline"><i className="fas fa-envelope mr-1" /> {cedulaResult.cliente.email}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-3 bg-[#FAFAFA] flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#999] uppercase tracking-wider">
                        {cedulaResult.total_ventas ?? cedulaResult.ventas?.length ?? 0} compra{(cedulaResult.total_ventas ?? cedulaResult.ventas?.length ?? 0) !== 1 ? 's' : ''} encontrada{(cedulaResult.total_ventas ?? cedulaResult.ventas?.length ?? 0) !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => {
                          setCedulaResult(null);
                          setLookupCedula('');
                        }}
                        className="text-[11px] font-bold text-[#E63946] hover:text-red-700 transition-colors"
                      >
                        <i className="fas fa-search mr-1" /> Nueva búsqueda
                      </button>
                    </div>
                  </div>

                  {/* Ventas list */}
                  {(cedulaResult.ventas || []).map((venta) => {
                    const estadoConfig: Record<string, { bg: string; text: string; icon: string }> = {
                      PENDIENTE: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: 'fa-clock' },
                      ABONADA: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: 'fa-coins' },
                      PAGADA: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: 'fa-check-circle' },
                      CANCELADA: { bg: 'bg-red-50 border-red-200', text: 'text-red-600', icon: 'fa-times-circle' },
                    };
                    const cfg = estadoConfig[venta.estado_venta] || estadoConfig.PENDIENTE;
                    const sorteoStr = new Date(venta.fecha_sorteo).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
                    const createdStr = new Date(venta.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={venta.venta_id} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden shop-pop-in">
                        {/* Venta header */}
                        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/[0.04]">
                          <div>
                            <h4
                              className="text-lg tracking-wider uppercase text-[#1A1A1A]"
                              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                            >
                              {venta.rifa_nombre}
                            </h4>
                            <div className="flex items-center gap-3 text-[11px] text-[#999] font-medium mt-1">
                              <span><i className="fas fa-calendar-alt text-[#E63946] text-[9px] mr-1" />Sorteo: {sorteoStr}</span>
                              <span><i className="fas fa-clock text-[#999] text-[9px] mr-1" />{createdStr}</span>
                            </div>
                          </div>
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
                            <i className={`fas ${cfg.icon} text-[10px]`} />
                            {venta.estado_venta}
                          </div>
                        </div>

                        {/* Financial info */}
                        <div className="px-5 py-3 bg-[#FAFAFA] border-b border-black/[0.04]">
                          <div className="flex flex-wrap gap-4 sm:gap-6">
                            <div>
                              <p className="text-[10px] font-bold text-[#bbb] uppercase tracking-wider">Total</p>
                              <p className="text-sm font-black text-[#1A1A1A]" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}>
                                {formatCOP(venta.monto_total)}
                              </p>
                            </div>
                            {venta.abono_total > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-[#bbb] uppercase tracking-wider">Abonado</p>
                                <p className="text-sm font-black text-green-600" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}>
                                  {formatCOP(venta.abono_total)}
                                </p>
                              </div>
                            )}
                            {venta.saldo_pendiente > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-[#bbb] uppercase tracking-wider">Saldo</p>
                                <p className="text-sm font-black text-[#E63946]" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}>
                                  {formatCOP(venta.saldo_pendiente)}
                                </p>
                              </div>
                            )}
                            {venta.premio_principal && (
                              <div className="ml-auto">
                                <p className="text-[10px] font-bold text-[#bbb] uppercase tracking-wider">Premio</p>
                                <p className="text-[12px] font-bold text-[#B87A00]">🏆 {venta.premio_principal}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Boletas grid */}
                        <div className="p-5">
                          <p className="text-[10px] font-bold text-[#999] uppercase tracking-wider mb-3">
                            {venta.boletas.length} Boleta{venta.boletas.length !== 1 ? 's' : ''}
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {venta.boletas.map((boleta) => {
                              const pct = boleta.porcentaje_pagado ?? 0;
                              const isPagada = pct >= 100 || boleta.estado === 'VENDIDA' || boleta.estado === 'PAGADA';
                              const isAbonada = boleta.estado === 'ABONADA' && !isPagada;
                              const isDisponible = boleta.estado === 'DISPONIBLE';

                              return (
                                <button
                                  key={boleta.numero}
                                  onClick={() => setSelectedBoletaView({ venta, boleta })}
                                  className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border transition-all cursor-pointer ${
                                    isPagada
                                      ? 'border-green-200 bg-green-50 hover:border-green-300 hover:shadow-sm'
                                      : isAbonada
                                      ? 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:shadow-sm'
                                      : isDisponible
                                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-default'
                                      : 'border-amber-200 bg-amber-50 hover:border-amber-300 hover:shadow-sm'
                                  }`}
                                >
                                  <span
                                    className={`text-lg font-black tracking-wider ${isPagada ? 'text-green-700' : isAbonada ? 'text-blue-700' : isDisponible ? 'text-gray-400' : 'text-amber-700'}`}
                                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                                  >
                                    #{String(boleta.numero).padStart(4, '0')}
                                  </span>
                                  {/* Per-boleta progress mini-bar */}
                                  {!isDisponible && pct > 0 && pct < 100 && (
                                    <div className="w-full h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${isAbonada ? 'bg-blue-500' : 'bg-amber-500'}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  )}
                                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isPagada ? 'text-green-600' : isAbonada ? 'text-blue-600' : isDisponible ? 'text-gray-400' : 'text-amber-600'}`}>
                                    {isPagada ? '100%' : pct > 0 ? `${pct}%` : boleta.estado}
                                  </span>
                                  {(boleta.qr_hash || boleta.qr_url) && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#E63946] flex items-center justify-center shadow-sm">
                                      <i className="fas fa-qrcode text-white text-[8px]" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {venta.boletas.some(b => b.qr_hash || b.qr_url) && (
                            <p className="text-[10px] text-[#bbb] mt-3 flex items-center gap-1">
                              <i className="fas fa-info-circle text-[8px]" />
                              Toca una boleta con <i className="fas fa-qrcode text-[8px] mx-0.5" /> para ver su detalle como si escanearas el QR
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Download + Shop CTAs */}
                  <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-[#E63946]/10 flex items-center justify-center">
                        <i className="fas fa-download text-[#E63946] text-sm" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#1A1A1A]">Descarga tus boletas</p>
                        <p className="text-[10px] text-[#999]">Descarga como imagen con estado actualizado</p>
                      </div>
                    </div>
                    <a
                      href={`/mis-boletas/${cedulaResult.cliente?.identificacion || lookupCedula}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#E63946] to-[#C62B38] text-white text-[13px] font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                      <i className="fas fa-download text-xs" />
                      DESCARGAR MIS BOLETAS
                    </a>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      onClick={handleReset}
                      className="btn-primary text-[13px] px-8 py-3.5"
                    >
                      <i className="fas fa-shopping-cart text-xs" />
                      COMPRAR MÁS BOLETAS
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Boleta Detail View (QR scan style) ─── */}
              {cedulaResult && selectedBoletaView && (() => {
                const b = selectedBoletaView.boleta;
                const v = selectedBoletaView.venta;
                const precioBoleta = b.precio_boleta ?? 0;
                const totalPagado = b.total_pagado_boleta ?? 0;
                const saldoBoleta = b.saldo_pendiente_boleta ?? (precioBoleta - totalPagado);
                const pctPagado = b.porcentaje_pagado ?? (precioBoleta > 0 ? Math.round((totalPagado / precioBoleta) * 100) : 0);
                const isPagada = pctPagado >= 100 || b.estado === 'VENDIDA' || b.estado === 'PAGADA';
                const isCancelada = v.estado_venta === 'CANCELADA';
                const isAbonada = b.estado === 'ABONADA' && !isPagada;

                const headerBg = isPagada
                  ? 'from-green-600 to-green-800'
                  : isCancelada
                  ? 'from-red-600 to-red-800'
                  : isAbonada
                  ? 'from-blue-600 to-blue-800'
                  : 'from-[#FFB703] to-[#E6A800]';
                const statusText = isPagada
                  ? '✅ BOLETA PAGADA'
                  : isCancelada
                  ? '❌ CANCELADA'
                  : isAbonada
                  ? '💳 ABONADA — PARCIALMENTE PAGADA'
                  : '⏳ PENDIENTE DE PAGO';
                const statusBadge = isPagada
                  ? { bg: 'bg-green-50 border-green-200', text: 'text-green-700' }
                  : isCancelada
                  ? { bg: 'bg-red-50 border-red-200', text: 'text-red-600' }
                  : isAbonada
                  ? { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' }
                  : { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' };

                return (
                <div className="space-y-4">
                  {/* Back button */}
                  <button
                    onClick={() => setSelectedBoletaView(null)}
                    className="text-[12px] font-bold text-[#888] hover:text-[#E63946] transition-colors flex items-center gap-1.5"
                  >
                    <i className="fas fa-arrow-left text-[10px]" />
                    Volver a mis compras
                  </button>

                  {/* QR-style boleta card */}
                  <div className="max-w-[540px] mx-auto bg-white rounded-2xl border border-black/[0.06] shadow-xl overflow-hidden shop-pop-in">
                    {/* Status header */}
                    <div className={`bg-gradient-to-br ${headerBg} px-6 py-8 text-center relative overflow-hidden`}>
                      <div className="absolute inset-0 prize-shimmer pointer-events-none" />
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                          <span
                            className="text-3xl font-black text-white"
                            style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '2px' }}
                          >
                            #{String(b.numero).padStart(4, '0')}
                          </span>
                        </div>
                        <p className="text-white text-lg font-black tracking-wider uppercase" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                          {statusText}
                        </p>
                        <p className="text-white/60 text-[12px] font-semibold mt-1">
                          {v.rifa_nombre}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-6 space-y-4">
                      {/* Info grid — boleta-specific */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { icon: 'fa-user', label: 'Propietario', value: cedulaResult.cliente?.nombre || 'N/A' },
                          { icon: 'fa-id-card', label: 'Cédula', value: cedulaResult.cliente?.identificacion || lookupCedula },
                          { icon: 'fa-trophy', label: 'Premio', value: v.premio_principal || 'N/A' },
                          { icon: 'fa-calendar', label: 'Sorteo', value: new Date(v.fecha_sorteo).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) },
                        ].map((item) => (
                          <div key={item.label} className="bg-[#FAFAFA] rounded-xl p-3 border border-black/[0.04]">
                            <div className="flex items-center gap-1.5 mb-1">
                              <i className={`fas ${item.icon} text-[#E63946] text-[9px]`} />
                              <span className="text-[9px] font-bold text-[#bbb] uppercase tracking-wider">{item.label}</span>
                            </div>
                            <p className="text-[13px] font-bold text-[#1A1A1A] truncate">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* ── Boleta-specific financial summary ── */}
                      <div className="bg-gradient-to-br from-[#FAFAFA] to-white rounded-xl border border-black/[0.06] overflow-hidden">
                        <div className="px-4 py-3 border-b border-black/[0.04] flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider">
                            <i className="fas fa-receipt text-[#E63946] text-[8px] mr-1" />
                            Estado Financiero — Boleta #{String(b.numero).padStart(4, '0')}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${statusBadge.bg} ${statusBadge.text}`}>
                            {b.estado}
                          </span>
                        </div>
                        <div className="p-4 space-y-3">
                          {/* Amount cards */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-3 rounded-lg bg-white border border-black/[0.04]">
                              <p className="text-[9px] font-bold text-[#bbb] uppercase tracking-wider mb-1">Precio</p>
                              <p className="text-[15px] font-black text-[#1A1A1A]" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}>
                                {formatCOP(precioBoleta)}
                              </p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-green-50 border border-green-100">
                              <p className="text-[9px] font-bold text-green-500 uppercase tracking-wider mb-1">Pagado</p>
                              <p className="text-[15px] font-black text-green-700" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}>
                                {formatCOP(totalPagado)}
                              </p>
                            </div>
                            <div className={`text-center p-3 rounded-lg ${saldoBoleta > 0 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
                              <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${saldoBoleta > 0 ? 'text-red-400' : 'text-green-500'}`}>Saldo</p>
                              <p className={`text-[15px] font-black ${saldoBoleta > 0 ? 'text-[#E63946]' : 'text-green-700'}`} style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}>
                                {saldoBoleta > 0 ? formatCOP(saldoBoleta) : '✓ $0'}
                              </p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                              <span className="text-[#999]">Progreso</span>
                              <span className={pctPagado >= 100 ? 'text-green-600' : 'text-[#E63946]'}>
                                {pctPagado}%
                              </span>
                            </div>
                            <div className="h-3 rounded-full bg-black/[0.06] overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  pctPagado >= 100
                                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                                    : pctPagado > 0
                                    ? 'bg-gradient-to-r from-[#E63946] to-[#FF6B6B]'
                                    : 'bg-gray-300'
                                }`}
                                style={{ width: `${Math.min(100, pctPagado)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Abonos History ── */}
                      {(b.abonos?.length ?? 0) > 0 && (
                        <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
                          <div className="px-4 py-3 border-b border-black/[0.04] bg-[#FAFAFA]">
                            <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider">
                              <i className="fas fa-history text-[#E63946] text-[8px] mr-1" />
                              Historial de Pagos ({b.abonos.length})
                            </span>
                          </div>
                          <div className="divide-y divide-black/[0.04]">
                            {b.abonos.map((abono, idx) => {
                              const abonoDate = new Date(abono.fecha);
                              const dateStr = abonoDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
                              const timeStr = abonoDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                              const isConfirmado = abono.estado === 'CONFIRMADO';

                              return (
                                <div key={idx} className="px-4 py-3 flex items-center gap-3 hover:bg-[#FAFAFA]/60 transition-colors">
                                  {/* Icon */}
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    isConfirmado ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                  }`}>
                                    <i className={`fas ${isConfirmado ? 'fa-check-circle' : 'fa-clock'} text-sm`} />
                                  </div>
                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[13px] font-black text-[#1A1A1A]" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}>
                                        {formatCOP(abono.monto)}
                                      </span>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isConfirmado ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                                        {abono.estado}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-[#999] mt-0.5">
                                      <span className="font-semibold">{abono.metodo_pago}</span>
                                      <span>•</span>
                                      <span>{dateStr} — {timeStr}</span>
                                    </div>
                                    {abono.notas && (
                                      <p className="text-[10px] text-[#bbb] italic mt-0.5 truncate">"{abono.notas}"</p>
                                    )}
                                    {abono.referencia && (
                                      <p className="text-[10px] text-[#ccc] font-mono mt-0.5">Ref: {abono.referencia}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* No abonos message */}
                      {(!b.abonos || b.abonos.length === 0) && !isPagada && (
                        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-center">
                          <i className="fas fa-info-circle text-amber-500 text-sm mb-1" />
                          <p className="text-[12px] text-amber-700 font-semibold">Aún no se han registrado pagos para esta boleta</p>
                        </div>
                      )}

                      {/* QR link */}
                      {b.qr_url && (
                        <Link
                          href={b.qr_url.replace('https://elgrancamion.com', '')}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#E63946]/20 bg-[#E63946]/[0.04] text-[#E63946] text-[12px] font-bold hover:bg-[#E63946]/[0.08] transition-all"
                        >
                          <i className="fas fa-qrcode text-sm" />
                          VER VERIFICACIÓN COMPLETA
                        </Link>
                      )}
                      {b.qr_hash && !b.qr_url && (
                        <Link
                          href={`/verificar/${b.qr_hash}`}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#E63946]/20 bg-[#E63946]/[0.04] text-[#E63946] text-[12px] font-bold hover:bg-[#E63946]/[0.08] transition-all"
                        >
                          <i className="fas fa-qrcode text-sm" />
                          VER VERIFICACIÓN COMPLETA
                        </Link>
                      )}

                      {/* WhatsApp CTA — dual numbers */}
                      {saldoBoleta > 0 && !isCancelada && (
                        <div className="flex flex-col gap-2">
                          {[
                            { num: '573207120787', display: '320 712 0787' },
                            { num: '573207120779', display: '320 712 0779' },
                          ].map((wa) => (
                            <a
                              key={wa.num}
                              href={`https://wa.me/${wa.num}?text=${encodeURIComponent(
                                `Hola! Soy ${cedulaResult.cliente?.nombre || 'Cliente'}, CC ${cedulaResult.cliente?.identificacion || lookupCedula}. Quiero enviar comprobante de pago para mi boleta #${String(b.numero).padStart(4, '0')} de la rifa "${v.rifa_nombre}". Precio boleta: ${formatCOP(precioBoleta)}, Pagado: ${formatCOP(totalPagado)}, Saldo: ${formatCOP(saldoBoleta)}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl bg-green-600 text-white text-[13px] font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                            >
                              <i className="fab fa-whatsapp text-lg" />
                              WHATSAPP {wa.display}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Security footer */}
                    <div className="px-6 pb-5">
                      <div className="flex items-center justify-center gap-2 text-[10px] text-[#bbb]">
                        <i className="fas fa-shield-halved text-[9px]" />
                        <span>Verificado por Gran Rifa Camionera</span>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })()}
            </div>
          </section>
        )}

      </main>
      )}
    </>
  );
}
