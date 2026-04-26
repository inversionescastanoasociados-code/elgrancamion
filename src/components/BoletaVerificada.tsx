'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════
   BOLETA VERIFICADA — Resultado de verificación por QR
   Endpoint: GET /api/verificar/{hash}
   Público, sin auth, rate limit 30/5min
═══════════════════════════════════════════════════ */

const API_BASE = 'https://rifas-backend-production.up.railway.app';

/* ═══ TYPES ═══ */
interface BoletaInfo {
  numero: number;
  estado: string;
  barcode: string;
  fecha_compra: string;
}

interface RifaInfo {
  nombre: string;
  descripcion: string;
  precio_boleta: number;
  fecha_sorteo: string;
  premio_principal: string;
  total_boletas: number;
  imagen_url: string | null;
  estado: string;
  terminos_condiciones: string | null;
}

interface ClienteInfo {
  nombre: string;
  identificacion: string;
}

interface FinancieroInfo {
  monto_total: number;
  abono_total: number;
  saldo_pendiente: number;
  estado: string;
  metodo_pago: string;
  porcentaje_pagado: number;
}

interface AbonoInfo {
  monto: number;
  moneda: string;
  estado: string;
  referencia: string | null;
  metodo_pago: string;
  fecha: string;
  observaciones: string | null;
}

interface VerificacionData {
  boleta: BoletaInfo;
  rifa: RifaInfo;
  cliente: ClienteInfo;
  financiero: FinancieroInfo;
  abonos: AbonoInfo[];
  verificado_en: string;
}

type ViewState = 'loading' | 'success' | 'not-found' | 'error' | 'invalid';

/* ═══ HELPERS ═══ */
function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function padBoleta(n: number) {
  return `#${String(n).padStart(4, '0')}`;
}

function getEstadoConfig(estado: string) {
  const s = estado.toUpperCase();
  switch (s) {
    case 'PAGADA':
      return {
        color: 'emerald',
        bg: 'bg-emerald-500',
        bgSoft: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        textDark: 'text-emerald-800',
        icon: 'fa-circle-check',
        label: 'Pagada',
        description: 'Pago completo — Participas en el sorteo',
        glow: 'shadow-[0_0_40px_rgba(16,185,129,0.15)]',
      };
    case 'ABONADA':
      return {
        color: 'amber',
        bg: 'bg-amber-500',
        bgSoft: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        textDark: 'text-amber-800',
        icon: 'fa-clock',
        label: 'Abonada',
        description: 'Pago parcial — Completa tu pago para participar',
        glow: 'shadow-[0_0_40px_rgba(245,158,11,0.15)]',
      };
    case 'RESERVADA':
      return {
        color: 'blue',
        bg: 'bg-blue-500',
        bgSoft: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        textDark: 'text-blue-800',
        icon: 'fa-bookmark',
        label: 'Reservada',
        description: 'Boleta reservada — Completa tu compra',
        glow: 'shadow-[0_0_40px_rgba(59,130,246,0.15)]',
      };
    case 'DISPONIBLE':
      return {
        color: 'gray',
        bg: 'bg-truck-red',
        bgSoft: 'bg-truck-red/5',
        border: 'border-truck-red/20',
        text: 'text-truck-red',
        textDark: 'text-truck-red',
        icon: 'fa-cart-shopping',
        label: 'Disponible',
        description: '¡Esta boleta está disponible! Cómprala ahora y participa en el sorteo',
        glow: 'shadow-[0_0_40px_rgba(230,57,70,0.15)]',
      };
    case 'ANULADA':
      return {
        color: 'red',
        bg: 'bg-red-500',
        bgSoft: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        textDark: 'text-red-800',
        icon: 'fa-ban',
        label: 'Anulada',
        description: 'Esta boleta ha sido anulada',
        glow: 'shadow-[0_0_40px_rgba(239,68,68,0.15)]',
      };
    case 'TRANSFERIDA':
      return {
        color: 'purple',
        bg: 'bg-purple-500',
        bgSoft: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        textDark: 'text-purple-800',
        icon: 'fa-arrow-right-arrow-left',
        label: 'Transferida',
        description: 'Esta boleta fue transferida a otro titular',
        glow: 'shadow-[0_0_40px_rgba(168,85,247,0.15)]',
      };
    default:
      return {
        color: 'gray',
        bg: 'bg-gray-500',
        bgSoft: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-600',
        textDark: 'text-gray-700',
        icon: 'fa-question',
        label: estado,
        description: '',
        glow: '',
      };
  }
}

function getDaysUntilSorteo(fechaSorteo: string) {
  const now = new Date().getTime();
  const sorteo = new Date(fechaSorteo).getTime();
  const diff = sorteo - now;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ═══ COMPONENT ═══ */
export default function BoletaVerificada({ hash }: { hash: string }) {
  const [state, setState] = useState<ViewState>('loading');
  const [data, setData] = useState<VerificacionData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'pagos' | 'rifa'>('info');
  const progressRef = useRef<HTMLDivElement>(null);
  const [progressAnimated, setProgressAnimated] = useState(false);

  /* ═══ Validate hash format ═══ */
  const isValidHash = /^[a-fA-F0-9]{32}$/.test(hash);

  useEffect(() => {
    setMounted(true);
    if (!isValidHash) {
      setState('invalid');
      return;
    }
    verifyBoleta();
  }, [hash]);

  /* ═══ Animate progress bar after data loads ═══ */
  useEffect(() => {
    if (state === 'success' && data) {
      const timer = setTimeout(() => setProgressAnimated(true), 500);
      return () => clearTimeout(timer);
    }
  }, [state, data]);

  async function verifyBoleta() {
    setState('loading');
    try {
      const res = await fetch(`${API_BASE}/api/verificar/${hash}`);

      if (res.status === 404) {
        setState('not-found');
        return;
      }
      if (res.status === 429) {
        setErrorMsg('Has realizado demasiadas consultas. Espera unos minutos e intenta de nuevo.');
        setState('error');
        return;
      }
      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }

      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
        setState('success');
      } else {
        setState('not-found');
      }
    } catch (err: any) {
      setErrorMsg('No pudimos conectar con el servidor. Verifica tu conexión e intenta de nuevo.');
      setState('error');
    }
  }

  /* ═══ RENDER ═══ */
  return (
    <div className="min-h-screen bg-[#FAFAFA] relative">
      {/* ══════ FLYER BACKGROUND ══════ */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/uploads/boleta/diseño-flyr.png"
          alt=""
          fill
          className="object-cover opacity-[0.06]"
          sizes="100vw"
          priority
        />
      </div>

      {/* ══════ NAVBAR ══════ */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/[0.06] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-11 h-11 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/uploads/logos/logo-principal.png"
                alt="Gran Rifa Camionera"
                fill
                className="object-contain drop-shadow-sm"
                sizes="44px"
              />
            </div>
            <div className="relative w-8 h-8 flex-shrink-0 -ml-1 opacity-60 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/uploads/logos/logo-negro.png"
                alt=""
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
            <span className="text-lg tracking-wider text-[#1A1A1A] hidden sm:block" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              GRAN RIFA <span className="text-truck-red">CAMIONERA</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/verificar" className="text-[12px] font-bold text-truck-red hover:text-red-700 tracking-wide transition-colors hidden sm:block">
              <i className="fas fa-qrcode text-[10px] mr-1" />
              Verificar Otra
            </Link>
            <Link href="/" className="btn-secondary text-[11px] px-4 py-2 !border-black/10">
              <i className="fas fa-home text-[10px]" />
              Inicio
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════ LOADING STATE ══════ */}
      {state === 'loading' && (
        <div className="relative z-[1] flex flex-col items-center justify-center min-h-[80vh] px-6">
          <div className="relative">
            {/* Outer ring */}
            <div className="w-24 h-24 rounded-full border-[3px] border-black/[0.04] flex items-center justify-center">
              {/* Spinning arc */}
              <div className="absolute inset-0 w-24 h-24 rounded-full border-[3px] border-transparent border-t-truck-red animate-spin" />
              {/* Inner icon */}
              <div className="w-12 h-12 rounded-full bg-truck-red/8 flex items-center justify-center">
                <i className="fas fa-shield-halved text-truck-red text-xl verificar-pulse" />
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <h2 className="text-[20px] font-bold text-[#1A1A1A] tracking-tight">Verificando boleta...</h2>
            <p className="text-[13px] text-[#999] mt-2">Consultando autenticidad en la base de datos</p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <div className="verificar-dot w-2 h-2 rounded-full bg-truck-red" style={{ animationDelay: '0ms' }} />
              <div className="verificar-dot w-2 h-2 rounded-full bg-truck-red" style={{ animationDelay: '200ms' }} />
              <div className="verificar-dot w-2 h-2 rounded-full bg-truck-red" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* ══════ INVALID HASH ══════ */}
      {state === 'invalid' && (
        <div className="relative z-[1] flex flex-col items-center justify-center min-h-[80vh] px-6">
          <div className="verificar-bounce-in max-w-[440px] w-full text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-link-slash text-red-400 text-2xl" />
            </div>
            <h2 className="text-[24px] font-bold text-[#1A1A1A]">Código inválido</h2>
            <p className="text-[14px] text-[#888] mt-3 leading-relaxed">
              El código de verificación no tiene el formato correcto.
              Debe ser un código hexadecimal de 32 caracteres.
            </p>
            <div className="mt-4 bg-[#F5F5F5] rounded-xl p-4 text-left">
              <p className="text-[11px] font-bold text-[#AAA] tracking-wider uppercase mb-2">Código recibido</p>
              <p className="text-[12px] font-mono text-red-400 break-all">{hash}</p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/verificar" className="btn-primary text-[13px] px-8 py-3.5">
                <i className="fas fa-qrcode" /> Verificar con QR
              </Link>
              <Link href="/" className="btn-secondary text-[13px] px-8 py-3.5">
                <i className="fas fa-home" /> Ir al Inicio
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ══════ NOT FOUND ══════ */}
      {state === 'not-found' && (
        <div className="relative z-[1] flex flex-col items-center justify-center min-h-[80vh] px-6">
          <div className="verificar-bounce-in max-w-[440px] w-full text-center">
            <div className="w-20 h-20 rounded-full bg-warning-yellow/10 border-2 border-warning-yellow/20 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-magnifying-glass text-warning-yellow text-2xl" />
            </div>
            <h2 className="text-[24px] font-bold text-[#1A1A1A]">Boleta no encontrada</h2>
            <p className="text-[14px] text-[#888] mt-3 leading-relaxed max-w-[38ch] mx-auto">
              No encontramos ninguna boleta con este código de verificación. Asegúrate de escanear correctamente el QR.
            </p>
            <div className="mt-4 bg-[#F5F5F5] rounded-xl p-4">
              <p className="text-[11px] font-bold text-[#AAA] tracking-wider uppercase mb-2">Hash consultado</p>
              <p className="text-[12px] font-mono text-[#666] break-all">{hash}</p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/verificar" className="btn-primary text-[13px] px-8 py-3.5">
                <i className="fas fa-redo" /> Intentar de Nuevo
              </Link>
              <a
                href="https://wa.me/573000000000?text=Hola%2C%20necesito%20ayuda%20verificando%20mi%20boleta.%20Hash%3A%20" 
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-[13px] px-8 py-3.5"
              >
                <i className="fab fa-whatsapp" /> Contactar Soporte
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ══════ ERROR ══════ */}
      {state === 'error' && (
        <div className="relative z-[1] flex flex-col items-center justify-center min-h-[80vh] px-6">
          <div className="verificar-bounce-in max-w-[440px] w-full text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-wifi text-red-400 text-2xl" />
            </div>
            <h2 className="text-[24px] font-bold text-[#1A1A1A]">Error de conexión</h2>
            <p className="text-[14px] text-[#888] mt-3 leading-relaxed max-w-[40ch] mx-auto">{errorMsg}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={verifyBoleta} className="btn-primary text-[13px] px-8 py-3.5">
                <i className="fas fa-redo" /> Reintentar
              </button>
              <Link href="/" className="btn-secondary text-[13px] px-8 py-3.5">
                <i className="fas fa-home" /> Ir al Inicio
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ══════ SUCCESS — FULL RESULT ══════ */}
      {state === 'success' && data && (
        <>
          {/* ── HERO BANNER ── */}
          <section className="dark-section relative overflow-hidden">
            <Image
              src="/uploads/boleta/diseño-flyr.png"
              alt="Verificación"
              fill
              className="object-cover opacity-25"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#111113]/70 via-[#111113]/85 to-[#111113]" />

            {/* Decorative particles */}
            {mounted && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-truck-red/30 verificar-float"
                    style={{
                      left: `${15 + i * 14}%`,
                      top: `${20 + (i % 3) * 25}%`,
                      animationDelay: `${i * 0.8}s`,
                      animationDuration: `${3 + i * 0.5}s`,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="relative z-10 max-w-[800px] mx-auto px-6 pt-12 pb-20 text-center">
              {/* Status Icon — animated entrance */}
              <div className="verificar-bounce-in mb-6 inline-flex items-center justify-center">
                <div className={`relative w-24 h-24 rounded-full ${getEstadoConfig(data.boleta.estado).bg} flex items-center justify-center verificar-glow-pulse`}>
                  <i className={`fas ${getEstadoConfig(data.boleta.estado).icon} text-white text-4xl`} />
                  {/* Ripple rings */}
                  <div className={`absolute inset-0 rounded-full ${getEstadoConfig(data.boleta.estado).bg} opacity-30 verificar-ripple`} />
                  <div className={`absolute inset-0 rounded-full ${getEstadoConfig(data.boleta.estado).bg} opacity-20 verificar-ripple`} style={{ animationDelay: '0.5s' }} />
                </div>
              </div>

              {/* Estado Badge */}
              <div className="verificar-slide-up mb-4" style={{ animationDelay: '0.2s' }}>
                <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-bold tracking-wider uppercase ${getEstadoConfig(data.boleta.estado).bgSoft} ${getEstadoConfig(data.boleta.estado).border} border ${getEstadoConfig(data.boleta.estado).text}`}>
                  <i className={`fas ${getEstadoConfig(data.boleta.estado).icon} text-[11px]`} />
                  Boleta {getEstadoConfig(data.boleta.estado).label}
                </span>
              </div>

              {/* Boleta Number — BIG */}
              <div className="verificar-slide-up" style={{ animationDelay: '0.35s' }}>
                <p className="text-[11px] font-bold tracking-[4px] uppercase text-white/40 mb-2">Boleta</p>
                <div
                  className="text-[clamp(56px,12vw,96px)] font-black text-white leading-none tracking-[10px]"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  {padBoleta(data.boleta.numero)}
                </div>
              </div>

              {/* Barcode */}
              <div className="verificar-slide-up mt-3" style={{ animationDelay: '0.45s' }}>
                <span className="inline-flex items-center gap-2 text-[13px] font-mono text-white/40">
                  <i className="fas fa-barcode text-[11px]" /> {data.boleta.barcode}
                </span>
              </div>

              {/* Status description */}
              <p className="verificar-slide-up mt-5 text-[15px] text-white/60 max-w-[45ch] mx-auto" style={{ animationDelay: '0.55s' }}>
                {getEstadoConfig(data.boleta.estado).description}
              </p>

              {/* Verification badge */}
              <div className="verificar-slide-up mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08]" style={{ animationDelay: '0.65s' }}>
                <i className="fas fa-shield-halved text-truck-red text-[11px]" />
                <span className="text-[11px] font-semibold text-white/50">
                  Verificada el {formatDateTime(data.verificado_en)}
                </span>
              </div>
            </div>
          </section>

          {/* ── MAIN CONTENT ── */}
          <section className="relative z-10 -mt-6 pb-20">
            <div className="max-w-[760px] mx-auto px-4 sm:px-6">

              {/* ═══════════════════════════════════════════
                  DISPONIBLE — Clean CTA-focused layout
              ═══════════════════════════════════════════ */}
              {data.boleta.estado.toUpperCase() === 'DISPONIBLE' ? (
                <>
                  {/* Big CTA Card */}
                  <div className="verificar-slide-up bg-white rounded-2xl border border-black/[0.04] shadow-[0_12px_50px_rgba(0,0,0,0.08)] overflow-hidden mb-6" style={{ animationDelay: '0.3s' }}>
                    {/* Top accent */}
                    <div className="h-1.5 bg-gradient-to-r from-truck-red via-red-500 to-truck-red" />

                    <div className="p-6 sm:p-10 text-center">
                      {/* Icon */}
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-truck-red/8 mb-6 verificar-glow-pulse">
                        <i className="fas fa-ticket text-truck-red text-3xl" />
                      </div>

                      <h2 className="text-[clamp(22px,4vw,30px)] font-black text-[#1A1A1A] leading-tight" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '2px' }}>
                        ¡ESTA BOLETA PUEDE SER TUYA!
                      </h2>
                      <p className="text-[15px] text-[#777] mt-3 max-w-[42ch] mx-auto leading-relaxed">
                        La boleta <span className="font-bold text-[#1A1A1A]">{padBoleta(data.boleta.numero)}</span> está disponible.
                        Cómprala ahora y participa por increíbles premios.
                      </p>

                      {/* Price tag */}
                      <div className="mt-7 inline-flex items-center gap-3 bg-[#FAFAFA] rounded-2xl border border-black/[0.05] px-6 py-4">
                        <div className="text-left">
                          <p className="text-[10px] font-bold tracking-[3px] uppercase text-[#BBB]">Precio</p>
                          <p className="text-[28px] font-black text-truck-red leading-none mt-0.5" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}>
                            {formatCOP(data.rifa.precio_boleta)}
                          </p>
                        </div>
                        <div className="w-px h-10 bg-black/[0.06]" />
                        <div className="text-left">
                          <p className="text-[10px] font-bold tracking-[3px] uppercase text-[#BBB]">Sorteo</p>
                          <p className="text-[14px] font-bold text-[#1A1A1A] leading-tight mt-0.5">{formatDate(data.rifa.fecha_sorteo)}</p>
                          <p className="text-[11px] text-[#999]">En {getDaysUntilSorteo(data.rifa.fecha_sorteo)} días</p>
                        </div>
                      </div>

                      {/* BIG CTA BUTTON */}
                      <div className="mt-8">
                        <Link
                          href="/boletas"
                          className="btn-primary text-[16px] px-12 py-5 w-full sm:w-auto justify-center shadow-[0_8px_30px_rgba(230,57,70,0.35)] hover:shadow-[0_14px_40px_rgba(230,57,70,0.5)] transition-all"
                        >
                          <i className="fas fa-cart-shopping" />
                          COMPRAR ESTA BOLETA
                        </Link>
                      </div>

                      {/* Trust line */}
                      <p className="mt-4 text-[11px] text-[#BBB]">
                        <i className="fas fa-lock text-[9px] mr-1" /> Compra segura · Boleta digital · WhatsApp
                      </p>
                    </div>
                  </div>

                  {/* Rifa Info — compact */}
                  <div className="verificar-slide-up grid grid-cols-2 sm:grid-cols-2 gap-3 mb-6" style={{ animationDelay: '0.5s' }}>
                    {[
                      { icon: 'fa-trophy', label: 'Premio Principal', value: data.rifa.premio_principal },
                      { icon: 'fa-calendar-days', label: 'Fecha del Sorteo', value: formatDate(data.rifa.fecha_sorteo) },
                    ].map((item, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-black/[0.04] p-4 shadow-sm text-center hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                        <div className="w-10 h-10 rounded-xl bg-truck-red/8 flex items-center justify-center mx-auto mb-3">
                          <i className={`fas ${item.icon} text-truck-red text-[14px]`} />
                        </div>
                        <p className="text-[10px] font-bold tracking-[2px] uppercase text-[#BBB] mb-1">{item.label}</p>
                        <p className="text-[14px] font-bold text-[#1A1A1A] leading-tight">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Countdown to sorteo */}
                  <div className="verificar-slide-up bg-[#111113] rounded-2xl p-6 sm:p-8 text-center mb-6" style={{ animationDelay: '0.65s' }}>
                    <p className="text-[10px] font-bold tracking-[4px] uppercase text-white/40 mb-4">El sorteo es en</p>
                    <SorteoCountdown fechaSorteo={data.rifa.fecha_sorteo} />
                    <p className="text-[12px] text-white/30 mt-5">¡No te quedes sin participar!</p>
                  </div>

                  {/* Hash display — compact */}
                  <div className="verificar-slide-up bg-white rounded-2xl border border-black/[0.04] p-5 shadow-sm mb-6" style={{ animationDelay: '0.8s' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#111113] flex items-center justify-center">
                        <i className="fas fa-fingerprint text-white text-[11px]" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-[#1A1A1A]">Código de Verificación</h3>
                        <p className="text-[10px] text-[#999]">HMAC-SHA256</p>
                      </div>
                    </div>
                    <div className="bg-[#F5F5F5] rounded-xl p-3 flex items-center gap-3">
                      <p className="flex-1 text-[12px] font-mono text-[#666] break-all select-all">{hash}</p>
                      <button
                        onClick={() => navigator.clipboard?.writeText(hash)}
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-black/[0.08] flex items-center justify-center hover:bg-truck-red/5 hover:border-truck-red/20 transition-all"
                        title="Copiar"
                      >
                        <i className="fas fa-copy text-[11px] text-[#AAA]" />
                      </button>
                    </div>
                  </div>

                  {/* ═══ Cláusulas ═══ */}
                  <div className="verificar-slide-up bg-white rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden mb-6" style={{ animationDelay: '0.85s' }}>
                    <details className="group">
                      <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-[#FAFAFA] transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-truck-red/8 flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-file-contract text-truck-red text-[13px]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[14px] font-bold text-[#1A1A1A]">Cláusulas y Condiciones</h3>
                          <p className="text-[10px] text-[#999]">Términos de participación en la rifa</p>
                        </div>
                        <i className="fas fa-chevron-down text-[10px] text-[#CCC] transition-transform duration-300 group-open:rotate-180" />
                      </summary>
                      <div className="px-5 pb-5 border-t border-black/[0.04]">
                        <div className="mt-4 space-y-2.5">
                          {[
                            'La empresa no se responsabiliza por negocios que hagan los vendedores con terceros. Por su seguridad, verifique los abonos a la rifa mayor conforme al reglamento elaborado para esta clase de pagos y cancelación a nuestros números telefónicos.',
                            'Caducidad de la boleta: 30 días calendario.',
                            'El premio mayor se le pagará al comprador original que figure en nuestros libros y que posea el bono de cancelación.',
                            'El vendedor que no haga efectivo sus cuotas en nuestras oficinas se hace responsable del pago de los premios.',
                            'La empresa no devuelve dineros abonados ya que estos han causado gastos de administración.',
                            'El comprador de esta boleta manifiesta haber leído y comprendido cada una de las cláusulas, aceptando en todas sus partes y condiciones, declarando que la compra es voluntaria.',
                            'Los gastos de traspaso van por cuenta del ganador.',
                          ].map((clause, i) => (
                            <div key={i} className="flex gap-2.5 items-start">
                              <div className="w-5 h-5 rounded-md bg-truck-red/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[9px] font-black text-truck-red">{i + 1}</span>
                              </div>
                              <p className="text-[11px] text-[#666] leading-relaxed">{clause}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  </div>

                  {/* Secondary CTAs */}
                  <div className="verificar-slide-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: '0.9s' }}>
                    <Link href="/verificar" className="btn-secondary flex-1 justify-center text-[13px] py-3.5">
                      <i className="fas fa-qrcode" /> Verificar Otra
                    </Link>
                    <Link href="/" className="btn-secondary flex-1 justify-center text-[13px] py-3.5">
                      <i className="fas fa-home" /> Ir al Inicio
                    </Link>
                  </div>
                </>
              ) : (
                /* ═══════════════════════════════════════════
                   ASSIGNED STATE — Full details view
                   (PAGADA, ABONADA, RESERVADA, ANULADA, etc.)
                ═══════════════════════════════════════════ */
                <>
                  {/* ═══ INFO CARDS GRID ═══ */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                      {
                        icon: 'fa-user',
                        label: 'Titular',
                        value: data.cliente.nombre,
                        sub: data.cliente.identificacion,
                      },
                      {
                        icon: 'fa-trophy',
                        label: 'Premio',
                        value: data.rifa.premio_principal,
                        sub: data.rifa.nombre,
                      },
                      {
                        icon: 'fa-calendar-check',
                        label: 'Sorteo',
                        value: formatDate(data.rifa.fecha_sorteo),
                        sub: `En ${getDaysUntilSorteo(data.rifa.fecha_sorteo)} días`,
                      },
                      {
                        icon: 'fa-money-bill-wave',
                        label: 'Valor Boleta',
                        value: formatCOP(data.rifa.precio_boleta),
                        sub: data.financiero.saldo_pendiente === 0 ? 'Pago completo' : `Pendiente: ${formatCOP(data.financiero.saldo_pendiente)}`,
                      },
                    ].map((card, i) => (
                      <div
                        key={i}
                        className="verificar-slide-up bg-white rounded-2xl border border-black/[0.04] p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                        style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                      >
                        <div className="w-9 h-9 rounded-xl bg-truck-red/8 flex items-center justify-center mb-3">
                          <i className={`fas ${card.icon} text-truck-red text-[13px]`} />
                        </div>
                        <p className="text-[10px] font-bold tracking-[2px] uppercase text-[#BBB] mb-1">{card.label}</p>
                        <p className="text-[14px] font-bold text-[#1A1A1A] leading-tight line-clamp-2">{card.value}</p>
                        <p className="text-[11px] text-[#999] mt-1 truncate">{card.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* ═══ PROGRESS BAR — PAYMENT ═══ */}
                  <div className="verificar-slide-up bg-white rounded-2xl border border-black/[0.04] p-5 sm:p-6 shadow-sm mb-6" style={{ animationDelay: '0.7s' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-truck-red/8 flex items-center justify-center">
                          <i className="fas fa-chart-pie text-truck-red text-[13px]" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-bold text-[#1A1A1A]">Estado del Pago</h3>
                          <p className="text-[11px] text-[#999]">
                            {data.financiero.porcentaje_pagado === 100 ? '¡Pago completo!' : `${data.financiero.porcentaje_pagado}% pagado`}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[24px] font-black ${data.financiero.porcentaje_pagado === 100 ? 'text-emerald-500' : 'text-amber-500'}`} style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}>
                        {data.financiero.porcentaje_pagado}%
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="relative h-4 bg-[#F0F0F0] rounded-full overflow-hidden">
                      <div
                        ref={progressRef}
                        className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                          data.financiero.porcentaje_pagado === 100
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                            : 'bg-gradient-to-r from-amber-500 to-amber-400'
                        }`}
                        style={{ width: progressAnimated ? `${data.financiero.porcentaje_pagado}%` : '0%' }}
                      >
                        {/* Shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent verificar-shimmer" />
                      </div>
                    </div>

                    {/* Financial details */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-[#FAFAFA] rounded-xl">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-[#BBB]">Total</p>
                        <p className="text-[15px] font-bold text-[#1A1A1A] mt-0.5">{formatCOP(data.financiero.monto_total)}</p>
                      </div>
                      <div className="text-center p-3 bg-[#FAFAFA] rounded-xl">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-[#BBB]">Abonado</p>
                        <p className="text-[15px] font-bold text-emerald-600 mt-0.5">{formatCOP(data.financiero.abono_total)}</p>
                      </div>
                      <div className="text-center p-3 bg-[#FAFAFA] rounded-xl">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-[#BBB]">Pendiente</p>
                        <p className={`text-[15px] font-bold mt-0.5 ${data.financiero.saldo_pendiente === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {data.financiero.saldo_pendiente === 0 ? '✓ Completo' : formatCOP(data.financiero.saldo_pendiente)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ═══ TABS ═══ */}
                  <div className="verificar-slide-up bg-white rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden mb-6" style={{ animationDelay: '0.85s' }}>
                    {/* Tab headers */}
                    <div className="flex border-b border-black/[0.04]">
                      {[
                        { key: 'info' as const, icon: 'fa-id-card', label: 'Detalles' },
                        { key: 'pagos' as const, icon: 'fa-money-bill-transfer', label: 'Historial de Pagos' },
                        { key: 'rifa' as const, icon: 'fa-trophy', label: 'Sobre la Rifa' },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex-1 flex items-center justify-center gap-2 py-4 text-[12px] sm:text-[13px] font-bold tracking-wide transition-all duration-300 relative ${
                            activeTab === tab.key
                              ? 'text-truck-red'
                              : 'text-[#AAA] hover:text-[#666]'
                          }`}
                        >
                          <i className={`fas ${tab.icon} text-[11px]`} />
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                          {activeTab === tab.key && (
                            <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-truck-red rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="p-5 sm:p-6">
                      {/* ── TAB: Info ── */}
                      {activeTab === 'info' && (
                        <div className="space-y-4 verificar-tab-enter">
                          {[
                            { icon: 'fa-user', label: 'Titular', value: data.cliente.nombre },
                            { icon: 'fa-id-card', label: 'Identificación', value: data.cliente.identificacion },
                            { icon: 'fa-hashtag', label: 'Número de Boleta', value: padBoleta(data.boleta.numero) },
                            { icon: 'fa-barcode', label: 'Código de Barras', value: data.boleta.barcode },
                            { icon: 'fa-tag', label: 'Estado', value: getEstadoConfig(data.boleta.estado).label, badge: true, badgeConfig: getEstadoConfig(data.boleta.estado) },
                            { icon: 'fa-credit-card', label: 'Método de Pago', value: data.financiero.metodo_pago },
                            { icon: 'fa-calendar', label: 'Fecha de Compra', value: data.boleta.fecha_compra ? formatDateTime(data.boleta.fecha_compra) : '—' },
                            { icon: 'fa-shield-halved', label: 'Verificado en', value: formatDateTime(data.verificado_en) },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 py-3 border-b border-black/[0.03] last:border-0">
                              <div className="w-9 h-9 rounded-xl bg-truck-red/6 flex items-center justify-center flex-shrink-0">
                                <i className={`fas ${item.icon} text-truck-red/70 text-[12px]`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold tracking-[2px] uppercase text-[#BBB]">{item.label}</p>
                                {item.badge && item.badgeConfig ? (
                                  <span className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-[12px] font-bold ${item.badgeConfig.bgSoft} ${item.badgeConfig.border} border ${item.badgeConfig.text}`}>
                                    <i className={`fas ${item.badgeConfig.icon} text-[9px]`} />
                                    {item.value}
                                  </span>
                                ) : (
                                  <p className="text-[14px] font-semibold text-[#333] mt-0.5 truncate">{item.value}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ── TAB: Pagos (Timeline) ── */}
                      {activeTab === 'pagos' && (
                        <div className="verificar-tab-enter">
                          {data.abonos.length === 0 ? (
                            <div className="py-10 text-center">
                              <div className="w-14 h-14 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-receipt text-[#CCC] text-xl" />
                              </div>
                              <p className="text-[14px] font-semibold text-[#AAA]">Sin pagos registrados</p>
                              <p className="text-[12px] text-[#CCC] mt-1">Aún no hay abonos para esta boleta</p>
                            </div>
                          ) : (
                            <div className="relative">
                              {/* Timeline line */}
                              <div className="absolute left-[18px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-truck-red/20 via-truck-red/10 to-transparent" />

                              <div className="space-y-6">
                                {data.abonos.map((abono, i) => (
                                  <div key={i} className="relative pl-12">
                                    {/* Timeline dot */}
                                    <div className={`absolute left-[10px] top-1 w-[18px] h-[18px] rounded-full border-[3px] border-white flex items-center justify-center ${
                                      abono.estado === 'CONFIRMADO' ? 'bg-emerald-500' : abono.estado === 'PENDIENTE' ? 'bg-amber-500' : 'bg-gray-400'
                                    }`}>
                                      <i className={`fas ${abono.estado === 'CONFIRMADO' ? 'fa-check' : 'fa-clock'} text-white text-[7px]`} />
                                    </div>

                                    {/* Card */}
                                    <div className="bg-[#FAFAFA] rounded-xl border border-black/[0.04] p-4 hover:shadow-sm transition-shadow">
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <p className="text-[16px] font-bold text-[#1A1A1A]">{formatCOP(abono.monto)}</p>
                                          <p className="text-[11px] text-[#999] mt-0.5">{abono.moneda}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                                          abono.estado === 'CONFIRMADO'
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                                        }`}>
                                          {abono.estado}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                          <p className="text-[10px] font-bold tracking-wider uppercase text-[#CCC]">Método</p>
                                          <p className="text-[13px] font-semibold text-[#555] mt-0.5">
                                            <i className={`fas ${
                                              abono.metodo_pago.toLowerCase().includes('nequi') ? 'fa-mobile-screen' :
                                              abono.metodo_pago.toLowerCase().includes('efectivo') ? 'fa-money-bill' :
                                              abono.metodo_pago.toLowerCase().includes('transfer') ? 'fa-building-columns' :
                                              'fa-credit-card'
                                            } text-[10px] mr-1 text-truck-red/50`} />
                                            {abono.metodo_pago}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold tracking-wider uppercase text-[#CCC]">Fecha</p>
                                          <p className="text-[13px] font-semibold text-[#555] mt-0.5">{formatDateTime(abono.fecha)}</p>
                                        </div>
                                      </div>

                                      {abono.referencia && (
                                        <div className="mt-3 pt-3 border-t border-black/[0.04]">
                                          <p className="text-[10px] font-bold tracking-wider uppercase text-[#CCC]">Referencia</p>
                                          <p className="text-[12px] font-mono text-[#777] mt-0.5">{abono.referencia}</p>
                                        </div>
                                      )}

                                      {abono.observaciones && (
                                        <div className="mt-2">
                                          <p className="text-[11px] text-[#AAA] italic">
                                            <i className="fas fa-quote-left text-[8px] mr-1 text-[#DDD]" /> {abono.observaciones}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── TAB: Rifa Info ── */}
                      {activeTab === 'rifa' && (
                        <div className="verificar-tab-enter space-y-5">
                          {/* Rifa name */}
                          <div className="text-center pb-5 border-b border-black/[0.04]">
                            <div className="w-14 h-14 rounded-2xl bg-truck-red/8 flex items-center justify-center mx-auto mb-3">
                              <i className="fas fa-trophy text-truck-red text-xl" />
                            </div>
                            <h3 className="text-[18px] font-bold text-[#1A1A1A]">{data.rifa.nombre}</h3>
                            {data.rifa.descripcion && (
                              <p className="text-[13px] text-[#888] mt-2 max-w-[50ch] mx-auto leading-relaxed">{data.rifa.descripcion}</p>
                            )}
                          </div>

                          {/* Rifa details grid */}
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { icon: 'fa-gift', label: 'Premio Principal', value: data.rifa.premio_principal },
                              { icon: 'fa-calendar-days', label: 'Fecha del Sorteo', value: formatDate(data.rifa.fecha_sorteo) },
                              { icon: 'fa-tags', label: 'Precio por Boleta', value: formatCOP(data.rifa.precio_boleta) },
                              { icon: 'fa-signal', label: 'Estado de la Rifa', value: data.rifa.estado },
                              { icon: 'fa-hourglass-half', label: 'Días para el Sorteo', value: `${getDaysUntilSorteo(data.rifa.fecha_sorteo)} días` },
                            ].map((item, i) => (
                              <div key={i} className="bg-[#FAFAFA] rounded-xl p-4 border border-black/[0.03]">
                                <i className={`fas ${item.icon} text-truck-red/50 text-[12px] mb-2 block`} />
                                <p className="text-[10px] font-bold tracking-[2px] uppercase text-[#CCC]">{item.label}</p>
                                <p className="text-[14px] font-bold text-[#1A1A1A] mt-1 leading-tight">{item.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Countdown to sorteo */}
                          <div className="bg-[#111113] rounded-2xl p-6 text-center">
                            <p className="text-[10px] font-bold tracking-[4px] uppercase text-white/40 mb-4">Faltan para el sorteo</p>
                            <SorteoCountdown fechaSorteo={data.rifa.fecha_sorteo} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ═══ HASH DISPLAY ═══ */}
                  <div className="verificar-slide-up bg-white rounded-2xl border border-black/[0.04] p-5 sm:p-6 shadow-sm mb-6" style={{ animationDelay: '1s' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-[#111113] flex items-center justify-center">
                        <i className="fas fa-fingerprint text-white text-[13px]" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-[#1A1A1A]">Hash de Verificación</h3>
                        <p className="text-[11px] text-[#999]">Código único HMAC-SHA256</p>
                      </div>
                    </div>
                    <div className="bg-[#F5F5F5] rounded-xl p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-mono text-[#555] break-all leading-relaxed select-all">{hash}</p>
                      </div>
                      <button
                        onClick={() => navigator.clipboard?.writeText(hash)}
                        className="flex-shrink-0 w-9 h-9 rounded-lg bg-white border border-black/[0.08] flex items-center justify-center hover:bg-truck-red/5 hover:border-truck-red/20 transition-all"
                        title="Copiar hash"
                      >
                        <i className="fas fa-copy text-[12px] text-[#AAA]" />
                      </button>
                    </div>
                  </div>

                  {/* ═══ SECURITY BADGE ═══ */}
                  <div className="verificar-slide-up bg-[#111113] rounded-2xl p-6 sm:p-8 text-center mb-6" style={{ animationDelay: '1.1s' }}>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <i className="fas fa-shield-halved text-truck-red text-lg" />
                      <h3 className="text-[16px] font-bold text-white tracking-wide" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '2px' }}>
                        VERIFICACIÓN AUTÉNTICA
                      </h3>
                    </div>
                    <p className="text-[13px] text-white/50 leading-relaxed max-w-[50ch] mx-auto">
                      Esta boleta fue verificada exitosamente contra nuestra base de datos.
                      El hash <span className="text-white/70 font-semibold">HMAC-SHA256</span> es único e irrepetible, 
                      garantizando la autenticidad de tu boleta.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-5 text-[11px] text-white/40">
                      <span><i className="fas fa-check-double text-emerald-500/60 mr-1" /> Autenticidad confirmada</span>
                      <span><i className="fas fa-database text-truck-red/60 mr-1" /> Datos en tiempo real</span>
                      <span><i className="fas fa-lock text-truck-red/60 mr-1" /> Conexión cifrada</span>
                    </div>
                  </div>

                  {/* ═══ CLAUSULAS ═══ */}
                  <div className="verificar-slide-up bg-white rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden mb-6" style={{ animationDelay: '1.15s' }}>
                    <details className="group">
                      <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-[#FAFAFA] transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-truck-red/8 flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-file-contract text-truck-red text-[13px]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[14px] font-bold text-[#1A1A1A]">Cláusulas y Condiciones</h3>
                          <p className="text-[10px] text-[#999]">Términos de participación en la rifa</p>
                        </div>
                        <i className="fas fa-chevron-down text-[10px] text-[#CCC] transition-transform duration-300 group-open:rotate-180" />
                      </summary>
                      <div className="px-5 pb-5 border-t border-black/[0.04]">
                        <div className="mt-4 space-y-2.5">
                          {[
                            'La empresa no se responsabiliza por negocios que hagan los vendedores con terceros. Por su seguridad, verifique los abonos a la rifa mayor conforme al reglamento elaborado para esta clase de pagos y cancelación a nuestros números telefónicos.',
                            'Caducidad de la boleta: 30 días calendario.',
                            'El premio mayor se le pagará al comprador original que figure en nuestros libros y que posea el bono de cancelación.',
                            'El vendedor que no haga efectivo sus cuotas en nuestras oficinas se hace responsable del pago de los premios.',
                            'La empresa no devuelve dineros abonados ya que estos han causado gastos de administración.',
                            'El comprador de esta boleta manifiesta haber leído y comprendido cada una de las cláusulas, aceptando en todas sus partes y condiciones, declarando que la compra es voluntaria.',
                            'Los gastos de traspaso van por cuenta del ganador.',
                          ].map((clause, i) => (
                            <div key={i} className="flex gap-2.5 items-start">
                              <div className="w-5 h-5 rounded-md bg-truck-red/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[9px] font-black text-truck-red">{i + 1}</span>
                              </div>
                              <p className="text-[11px] text-[#666] leading-relaxed">{clause}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  </div>

                  {/* ═══ CTAs ═══ */}
                  <div className="verificar-slide-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: '1.2s' }}>
                    <Link href="/verificar" className="btn-primary flex-1 justify-center text-[13px] py-4">
                      <i className="fas fa-qrcode" /> Verificar Otra Boleta
                    </Link>
                    <Link href="/boletas" className="btn-secondary flex-1 justify-center text-[13px] py-4">
                      <i className="fas fa-ticket" /> Comprar Boletas
                    </Link>
                    <Link href="/" className="btn-secondary flex-1 justify-center text-[13px] py-4">
                      <i className="fas fa-home" /> Ir al Inicio
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>
        </>
      )}

      {/* ══════ FOOTER ══════ */}
      <footer className="relative z-[1] bg-[#111113] border-t border-white/[0.04] py-8">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <div className="relative w-10 h-10">
              <Image src="/uploads/logos/logo-principal.png" alt="Logo" fill className="object-contain drop-shadow-sm" sizes="40px" />
            </div>
            <div className="relative w-7 h-7 opacity-40">
              <Image src="/uploads/logos/logo-blanco.png" alt="" fill className="object-contain" sizes="28px" />
            </div>
          </div>
          <p className="text-[12px] text-white/30">
            © 2026 Gran Rifa Camionera · Todos los derechos reservados
          </p>
          <div className="mt-3 flex justify-center gap-4">
            <Link href="/" className="text-[11px] text-white/40 hover:text-white/60 transition-colors">Inicio</Link>
            <Link href="/boletas" className="text-[11px] text-white/40 hover:text-white/60 transition-colors">Comprar</Link>
            <Link href="/verificar" className="text-[11px] text-truck-red/60 hover:text-truck-red transition-colors">Verificar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══ SORTEO COUNTDOWN SUB-COMPONENT ═══ */
function SorteoCountdown({ fechaSorteo }: { fechaSorteo: string }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calc() {
      const now = new Date().getTime();
      const target = new Date(fechaSorteo).getTime();
      const diff = target - now;
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    }
    setTime(calc());
    const interval = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(interval);
  }, [fechaSorteo]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex justify-center gap-4 sm:gap-6">
      {[
        { value: pad(time.days), label: 'Días' },
        { value: pad(time.hours), label: 'Horas' },
        { value: pad(time.minutes), label: 'Min' },
        { value: pad(time.seconds), label: 'Seg' },
      ].map((item) => (
        <div key={item.label} className="text-center">
          <div
            className="text-[clamp(28px,5vw,40px)] font-black text-white tracking-[2px]"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            {item.value}
          </div>
          <div className="text-[9px] font-bold tracking-[2px] uppercase text-white/40 mt-1">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
