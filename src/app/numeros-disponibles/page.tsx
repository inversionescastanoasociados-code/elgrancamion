'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ═══ API ═══ */
const API_BASE = 'https://rifas-backend-production.up.railway.app';
const API_KEY = 'pk_4f9a8c7e2d1b6a9f3c0d5e7f8a2b4c6d';
const apiHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

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

interface BoletaInfo {
  id: string;
  numero: number;
  estado: string;
}

function formatNumero(n: number, total: number): string {
  const digits = String(total - 1).length;
  return String(n).padStart(digits, '0');
}

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);
}

const MAX_VISIBLE_NUMBERS = 1500;
const PAGE_COLUMNS = 11;
const PAGE_ROWS = 15;
const PAGE_SIZE = PAGE_COLUMNS * PAGE_ROWS;

export default function NumerosDisponiblesPage() {
  /* ═══ State ═══ */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rifa, setRifa] = useState<RifaPublica | null>(null);
  const [allAvailable, setAllAvailable] = useState<number[]>([]);
  const [totalBoletas, setTotalBoletas] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  /* ═══ Load data ═══ */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        // Get rifas
        const rifaRes = await fetch(`${API_BASE}/api/ventas-online/rifas`, { headers: apiHeaders });
        const rifaJson = await rifaRes.json();
        if (!rifaRes.ok || !rifaJson.success) throw new Error(rifaJson.message || 'Error cargando rifas');
        const rifas: RifaPublica[] = rifaJson.data;
        if (!rifas.length) throw new Error('No hay rifas activas');
        if (cancelled) return;

        const selectedRifa = rifas[0];
        setRifa(selectedRifa);

        // Get boletas
        const bolRes = await fetch(`${API_BASE}/api/ventas-online/rifas/${selectedRifa.id}/boletas`, { headers: apiHeaders });
        const bolJson = await bolRes.json();
        if (!bolRes.ok || !bolJson.success) throw new Error(bolJson.message || 'Error cargando boletas');
        if (cancelled) return;

        const boletas: BoletaInfo[] = bolJson.data.boletas;
        const total = bolJson.data.rifa.total_boletas;
        setTotalBoletas(total);

        const available = boletas
          .filter((b) => b.estado === 'DISPONIBLE')
          .map((b) => b.numero)
          .sort((a, b) => a - b);

        setAllAvailable(available);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Error inesperado');
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const orderedAvailable = useMemo(() => {
    if (allAvailable.length === 0 || totalBoletas === 0) return [];

    const grouped = new Map<string, number[]>();
    allAvailable.forEach((num) => {
      const serie = formatNumero(num, totalBoletas).charAt(0);
      if (!grouped.has(serie)) grouped.set(serie, []);
      grouped.get(serie)!.push(num);
    });

    const shuffle = (items: number[]) => {
      const array = [...items];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const ordered: number[] = [];
    const series = Array.from(grouped.keys()).sort();
    const perSeries = Math.max(1, Math.floor(MAX_VISIBLE_NUMBERS / series.length));
    series.forEach((serie) => {
      const picked = shuffle(grouped.get(serie)!).slice(0, perSeries);
      ordered.push(...picked);
    });

    return ordered.sort((a, b) => a - b);
  }, [allAvailable, totalBoletas]);

  /* ═══ Filtered numbers ═══ */
  const filteredNumbers = orderedAvailable;
  const totalPages = Math.max(1, Math.ceil(filteredNumbers.length / PAGE_SIZE));
  const currentNumbers = filteredNumbers.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);

  useEffect(() => {
    if (pageIndex >= totalPages) {
      setPageIndex(totalPages - 1);
    }
  }, [pageIndex, totalPages]);

  const visibleNumbers = currentNumbers;

  /* ═══ Stats ═══ */
  const availableCount = allAvailable.length;
  const precio = rifa ? parseFloat(rifa.precio_boleta) : 0;

  /* ═══ RENDER ═══ */
  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] overflow-x-hidden">
      {/* ═══ HEADER / HERO ═══ */}
      <section className="relative overflow-hidden">
        {/* Background — dark top band */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#111113] via-[#111113] to-white" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#E63946_0%,transparent_50%)] opacity-[0.08]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#FFB703_0%,transparent_50%)] opacity-[0.04]" />

        {/* Flyer background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/uploads/boleta/diseno-flyer.jpg"
            alt=""
            fill
            className="object-cover opacity-[0.06]"
            priority
          />
        </div>

        {/* Nav bar */}
        <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4 max-w-[1400px] mx-auto">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/uploads/logos/logo-principal.png"
                alt="Logo"
                fill
                className="object-contain"
                sizes="40px"
              />
            </div>
            <span
              className="text-base tracking-wider text-white/80 hidden sm:block"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              EL GRAN <span className="text-truck-red">CAMIÓN</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/boletas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E63946] text-white text-[12px] font-bold hover:bg-[#d32f3c] transition-all shadow-lg shadow-[#E63946]/20"
            >
              <i className="fas fa-shopping-cart text-[10px]" />
              COMPRAR
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 text-white/50 text-[12px] font-bold hover:border-white/20 transition-all"
            >
              <i className="fas fa-home text-[10px]" />
              INICIO
            </Link>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 sm:px-6 pt-2 pb-2">
          <div className="inline-flex items-center gap-2 bg-[#E63946]/15 border border-[#E63946]/25 rounded-full px-4 py-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-[11px] font-bold tracking-[3px] uppercase text-green-400/80">
              Números disponibles
            </span>
          </div>

          <h1
            className="text-[clamp(32px,7vw,72px)] leading-[0.9] uppercase tracking-wider mb-1 text-white"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            NÚMEROS{' '}
            <span className="bg-gradient-to-r from-[#E63946] to-[#FF6B6B] bg-clip-text text-transparent">
              DISPONIBLES
            </span>
          </h1>
          <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto mb-1">
            Anticipados cada sábado — <span className="text-[#FFD700] font-bold">Premio Mayor vuelve a jugarse el 27 de junio</span>
          </p>
          {rifa && (
            <>
              <p className="text-[clamp(20px,5vw,48px)] font-black tracking-wider mt-1 text-transparent bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] bg-clip-text animate-pulse" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                SORTEO: {new Date(rifa.fecha_sorteo).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
              </p>
              <div className="relative w-24 h-24 mx-auto mt-1">
                <Image
                  src="/uploads/logos/logo-principal.png"
                  alt="Logo El Gran Camión"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="mt-1 bg-black/80 border border-white/10 rounded-lg p-2 max-w-xs mx-auto">
                <p className="text-white/60 text-[9px] font-bold tracking-[1px] uppercase mb-1">Ahorros Bancolombia Inversiones Castaño</p>
                <p className="text-white text-[10px] font-mono">70800002342</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══ NUMBERS GRID ═══ */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-6 py-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="w-12 h-12 border-3 border-black/10 border-t-[#E63946] rounded-full animate-spin" />
            <p className="text-[#999] text-sm font-semibold animate-pulse">Cargando números disponibles…</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <i className="fas fa-exclamation-triangle text-4xl text-[#E63946]/40 mb-4" />
            <p className="text-[#888] text-sm">{error}</p>
            <Link
              href="/boletas"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full bg-[#E63946] text-white text-[12px] font-bold hover:bg-[#d32f3c] transition-all"
            >
              <i className="fas fa-shopping-cart text-[10px]" />
              IR A COMPRAR
            </Link>
          </div>
        ) : filteredNumbers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-40">🚫</div>
            <p className="text-[#555] text-base font-semibold mb-2">
              No hay boletas disponibles en este momento.
            </p>
            <p className="text-[#999] text-sm">
              Revisa la página más tarde o vuelve al inicio para ver otras opciones.
            </p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div
              className="grid grid-cols-[repeat(11,minmax(0,1fr))] auto-rows-fr gap-1 sm:gap-1.5"
              style={{ minHeight: 'calc(100vh - 22rem)', maxHeight: 'calc(100vh - 22rem)' }}
            >
              {visibleNumbers.map((num) => {
                const numStr = formatNumero(num, totalBoletas);
                const isSelected = selectedNumbers.includes(num);

                return (
                  <button
                    key={num}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
                      } else {
                        setSelectedNumbers([...selectedNumbers, num]);
                      }
                    }}
                    className={
                      `relative flex h-full w-full items-center justify-center rounded-xl transition-all duration-200 cursor-pointer select-none
                      ${isSelected
                        ? 'bg-gradient-to-br from-[#E63946] to-[#B71C1C] border-2 border-[#E63946] text-white shadow-xl shadow-[#E63946]/35 scale-[1.08] ring-2 ring-[#E63946]/30 ring-offset-1 ring-offset-white z-10'
                        : 'bg-white border-2 border-black text-black shadow-sm hover:border-black/60 hover:shadow-lg hover:shadow-black/15 hover:-translate-y-0.5 hover:scale-105'
                      }
                    `}
                    style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px', fontSize: 'clamp(10px, 1vw, 14px)' }}
                  >
                    {numStr}
                    {isSelected ? (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border-2 border-[#E63946] flex items-center justify-center shadow-md">
                        <i className="fas fa-check text-[8px] text-[#E63946]" />
                      </span>
                    ) : (
                      <span className="absolute top-1 right-1 w-0.5 h-0.5 rounded-full bg-green-500" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#555]">
                Página {pageIndex + 1} de {totalPages} — Mostrando {currentNumbers.length.toLocaleString()} de {filteredNumbers.length.toLocaleString()} números
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={pageIndex === 0}
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 transition"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))}
                  disabled={pageIndex >= totalPages - 1}
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 transition"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      {!loading && !error && (
        <section className="border-t border-black/[0.06] bg-[#111113]">
          <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
            <p className="text-[11px] font-bold tracking-[4px] uppercase text-[#E63946]/60 mb-3">¿Ya elegiste tu número?</p>
            <h2
              className="text-3xl sm:text-4xl uppercase tracking-wider mb-4 text-white"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              ¡COMPRA TU BOLETA{' '}
              <span className="bg-gradient-to-r from-[#FFB703] to-[#FFD700] bg-clip-text text-transparent">AHORA!</span>
            </h2>
            <p className="text-white/35 text-sm mb-6 max-w-md mx-auto">
              No dejes pasar la oportunidad. Elige tu número de la suerte y participa por el Gran Camión.
            </p>
            <Link
              href="/boletas"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#E63946] text-white text-[14px] font-bold uppercase tracking-wider hover:bg-[#d32f3c] shadow-xl shadow-[#E63946]/25 hover:shadow-[#E63946]/40 hover:scale-[1.02] transition-all"
            >
              <i className="fas fa-ticket text-[12px]" />
              COMPRAR BOLETA — {formatCOP(precio)}
            </Link>

            {/* Social strip */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <a href="https://www.facebook.com/share/176zWG3VLA/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#1877F2]/10 border border-[#1877F2]/20 flex items-center justify-center hover:bg-[#1877F2]/20 hover:border-[#1877F2]/40 transition-all">
                <i className="fab fa-facebook-f text-[#1877F2] text-sm" />
              </a>
              <a href="https://www.instagram.com/proyectoelgrancamion?igsh=bTZmdDZraXU1ODZq" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#E1306C]/10 border border-[#E1306C]/20 flex items-center justify-center hover:bg-[#E1306C]/20 hover:border-[#E1306C]/40 transition-all">
                <i className="fab fa-instagram text-[#E1306C] text-sm" />
              </a>
              <a href="https://www.tiktok.com/@elgrancamion.oficial?_r=1&_t=ZS-94LHsPFrtbR" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-black/[0.06] border border-black/[0.12] flex items-center justify-center hover:bg-black/10 hover:border-black/20 transition-all">
                <i className="fab fa-tiktok text-[#1A1A1A] text-sm" />
              </a>
            </div>
          </div>
        </section>
      )}




      {/* ═══ KEYFRAME STYLES ═══ */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slotSpin {
          0% { transform: translateY(-8px); opacity: 0.3; }
          50% { transform: translateY(4px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.7; }
        }
        @keyframes resultBounce {
          0% { opacity: 0; transform: scale(0.5); }
          60% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-10px) rotate(0deg) scale(1); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: translateY(500px) rotate(720deg) scale(0.3); opacity: 0; }
        }
        @keyframes sparkle {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          25% { transform: scale(1.2) rotate(90deg); opacity: 1; }
          50% { transform: scale(0.8) rotate(180deg); opacity: 0.8; }
          75% { transform: scale(1.1) rotate(270deg); opacity: 0.6; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        .confetti-piece {
          position: absolute;
          animation: confettiFall ease-out forwards;
        }
        .sparkle-star {
          position: absolute;
          animation: sparkle 1.5s ease-in-out forwards;
          pointer-events: none;
        }
        @keyframes slideUpBar {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .selection-bar-enter {
          animation: slideUpBar 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
