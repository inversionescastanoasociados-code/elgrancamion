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

const BATCH_SIZE = 200;

export default function NumerosDisponiblesPage() {
  /* ═══ State ═══ */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rifa, setRifa] = useState<RifaPublica | null>(null);
  const [allAvailable, setAllAvailable] = useState<number[]>([]);
  const [totalBoletas, setTotalBoletas] = useState(0);

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Search
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Random animation modal
  const [showRandom, setShowRandom] = useState(false);
  const [randomResult, setRandomResult] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinNumbers, setSpinNumbers] = useState<number[]>([]);
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Selected numbers for WhatsApp
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectionBarOpen, setSelectionBarOpen] = useState(false);

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

  /* ═══ Infinite scroll observer ═══ */
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredNumbers.length));
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAvailable, search]);

  /* ═══ Filtered numbers ═══ */
  const filteredNumbers = useMemo(() => {
    if (!search.trim()) return allAvailable;
    const q = search.trim();
    return allAvailable.filter((n) => {
      const numStr = formatNumero(n, totalBoletas);
      return numStr.includes(q) || String(n).includes(q);
    });
  }, [allAvailable, search, totalBoletas]);

  // Reset visible count on search change
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [search]);

  /* ═══ Suggested similar numbers when no exact match ═══ */
  const suggestedNumbers = useMemo(() => {
    if (!search.trim() || filteredNumbers.length > 0) return [];
    const q = search.trim();
    const qNum = parseInt(q, 10);
    const suggestions: number[] = [];

    // 1. Numbers that START with the search query
    const startsWith = allAvailable.filter((n) => {
      const numStr = formatNumero(n, totalBoletas);
      return numStr.startsWith(q);
    });
    suggestions.push(...startsWith.slice(0, 6));

    // 2. Numbers that END with the search query
    if (suggestions.length < 12) {
      const endsWith = allAvailable.filter((n) => {
        const numStr = formatNumero(n, totalBoletas);
        return numStr.endsWith(q) && !suggestions.includes(n);
      });
      suggestions.push(...endsWith.slice(0, 6));
    }

    // 3. Closest numbers numerically (nearby range)
    if (!isNaN(qNum) && suggestions.length < 12) {
      const nearby = allAvailable
        .map((n) => ({ n, dist: Math.abs(n - qNum) }))
        .sort((a, b) => a.dist - b.dist)
        .filter(({ n }) => !suggestions.includes(n))
        .slice(0, 12 - suggestions.length)
        .map(({ n }) => n);
      suggestions.push(...nearby);
    }

    // 4. Numbers containing similar digits
    if (suggestions.length < 8) {
      const containsDigits = allAvailable.filter((n) => {
        const numStr = formatNumero(n, totalBoletas);
        // At least half the digits match
        const matchCount = q.split('').filter((d) => numStr.includes(d)).length;
        return matchCount >= Math.ceil(q.length / 2) && !suggestions.includes(n);
      });
      suggestions.push(...containsDigits.slice(0, 8 - suggestions.length));
    }

    return suggestions.sort((a, b) => a - b).slice(0, 12);
  }, [search, filteredNumbers, allAvailable, totalBoletas]);

  const visibleNumbers = filteredNumbers.slice(0, visibleCount);

  /* ═══ Random animation ═══ */
  const startRandom = useCallback(() => {
    if (allAvailable.length === 0) return;
    setShowRandom(true);
    setIsSpinning(true);
    setRandomResult(null);

    // Generate initial display numbers
    const initial: number[] = [];
    for (let i = 0; i < 12; i++) {
      initial.push(allAvailable[Math.floor(Math.random() * allAvailable.length)]);
    }
    setSpinNumbers(initial);

    // Spin animation — change numbers rapidly
    let counter = 0;
    const maxIterations = 15 + Math.floor(Math.random() * 8); // 15-23 iterations (faster)
    let speed = 40;

    const runSpin = () => {
      counter++;
      const newNums: number[] = [];
      for (let i = 0; i < 12; i++) {
        newNums.push(allAvailable[Math.floor(Math.random() * allAvailable.length)]);
      }
      setSpinNumbers(newNums);

      if (counter >= maxIterations) {
        // Final result
        const winner = allAvailable[Math.floor(Math.random() * allAvailable.length)];
        setRandomResult(winner);
        setIsSpinning(false);
        // Set winner in center
        const finalNums = [...newNums];
        finalNums[5] = winner; // center position
        setSpinNumbers(finalNums);
        return;
      }

      // Slow down gradually (faster curve)
      speed = 40 + (counter / maxIterations) * 200;
      spinIntervalRef.current = setTimeout(runSpin, speed);
    };

    spinIntervalRef.current = setTimeout(runSpin, speed);
  }, [allAvailable]);

  const closeRandom = useCallback(() => {
    setShowRandom(false);
    setIsSpinning(false);
    setRandomResult(null);
    if (spinIntervalRef.current) {
      clearTimeout(spinIntervalRef.current);
      spinIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearTimeout(spinIntervalRef.current);
    };
  }, []);

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
        <div className="relative z-10 text-center px-4 sm:px-6 pt-4 pb-10 sm:pb-14">
          <div className="inline-flex items-center gap-2 bg-[#E63946]/15 border border-[#E63946]/25 rounded-full px-4 py-2 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-[11px] font-bold tracking-[3px] uppercase text-green-400/80">
              Números disponibles
            </span>
          </div>

          <h1
            className="text-[clamp(32px,7vw,72px)] leading-[0.9] uppercase tracking-wider mb-4"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            NÚMEROS{' '}
            <span className="bg-gradient-to-r from-[#E63946] to-[#FF6B6B] bg-clip-text text-transparent">
              DISPONIBLES
            </span>
          </h1>
          <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto mb-2">
            {rifa ? rifa.nombre : 'Cargando...'} — Consulta todos los números disponibles, busca tu favorito o prueba tu suerte al azar.
          </p>
          {rifa && (
            <p className="text-[#FFB703] text-[13px] font-bold tracking-wider">
              Boleta: {formatCOP(precio)} · Sorteo: {new Date(rifa.fecha_sorteo).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      </section>

      {/* ═══ CONTROLS BAR ═══ */}
      <section className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#999] text-sm" />
              <input
                ref={searchRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={search}
                onChange={(e) => setSearch(e.target.value.replace(/\D/g, ''))}
                placeholder={`Buscar número... (ej: ${totalBoletas > 0 ? formatNumero(777, totalBoletas) : '0777'})`}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#F7F7F7] border border-black/[0.08] text-[#1A1A1A] text-sm font-mono placeholder:text-[#bbb] focus:outline-none focus:border-[#E63946]/50 focus:bg-white focus:ring-2 focus:ring-[#E63946]/10 transition-all"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#555] text-xs"
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3">
              {/* Count badge */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFF8E7] border border-[#FFB703]/30">
                <i className="fas fa-ticket-alt text-[#FFB703] text-[10px]" />
                <span className="text-[12px] font-bold text-[#B87A00]">
                  {search ? `${filteredNumbers.length.toLocaleString()} encontrados` : 'Disponibles'}
                </span>
              </div>

              {/* Random button */}
              <button
                onClick={startRandom}
                disabled={allAvailable.length === 0}
                className="group relative inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#E8A000] text-black text-[13px] font-black uppercase tracking-wider hover:shadow-lg hover:shadow-[#FFB703]/20 hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <i className="fas fa-dice text-sm group-hover:animate-bounce" />
                <span className="hidden sm:inline">Al Azar</span>
                <span className="sm:hidden">🎲</span>
              </button>
            </div>
          </div>

          {/* Mobile count */}
          <div className="sm:hidden mt-2 flex items-center justify-center gap-2 text-[11px] text-[#999]">
            <i className="fas fa-ticket-alt text-[#FFB703] text-[10px]" />
            {search ? `${filteredNumbers.length.toLocaleString()} encontrados` : 'Números disponibles'}
          </div>
        </div>
      </section>

      {/* ═══ NUMBERS GRID ═══ */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-6 py-6 sm:py-8">
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
          <div className="text-center py-12">
            <div className="text-5xl mb-4 opacity-40">🔍</div>
            <p className="text-[#555] text-base font-semibold mb-2">
              El número &quot;{search}&quot; no está disponible
            </p>
            <p className="text-[#999] text-sm mb-5">
              Puede que ya esté reservado o no exista
            </p>
            <button
              onClick={() => setSearch('')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/[0.06] text-[#555] text-[12px] font-bold hover:bg-black/[0.10] transition-all mb-8"
            >
              <i className="fas fa-times text-[10px]" />
              Limpiar búsqueda
            </button>

            {/* Suggested numbers */}
            {suggestedNumbers.length > 0 && (
              <div className="max-w-lg mx-auto">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#FFB703]/30" />
                  <span className="text-[11px] font-bold tracking-[3px] uppercase text-[#B87A00] flex items-center gap-2">
                    <i className="fas fa-lightbulb text-[#FFB703] text-sm" />
                    Números parecidos disponibles
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#FFB703]/30" />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {suggestedNumbers.map((num) => {
                    const numStr = formatNumero(num, totalBoletas);
                    return (
                      <button
                        key={num}
                        onClick={() => setSearch(String(num))}
                        className="group relative flex items-center justify-center py-3 sm:py-3.5 rounded-xl bg-white border-2 border-[#FFB703]/40 text-[#B87A00] hover:border-[#FFB703] hover:bg-[#FFF8E7] hover:text-[#8A5C00] hover:scale-105 hover:shadow-lg hover:shadow-[#FFB703]/20 transition-all duration-200"
                        style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1.5px', fontSize: '14px' }}
                      >
                        {numStr}
                        <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#FFB703]/0 group-hover:text-[#B87A00]/70 transition-all">DISPONIBLE</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[#bbb] text-[11px] mt-4">
                  <i className="fas fa-info-circle mr-1" />
                  Toca un número para buscarlo
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-2 sm:gap-2.5">
              {visibleNumbers.map((num) => {
                const numStr = formatNumero(num, totalBoletas);
                const isSearchMatch = search && numStr.includes(search);
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
                    className={`
                      relative flex items-center justify-center py-3 sm:py-3.5 rounded-xl transition-all duration-200 cursor-pointer select-none
                      ${isSelected
                        ? 'bg-gradient-to-br from-[#E63946] to-[#B71C1C] border-2 border-[#E63946] text-white shadow-xl shadow-[#E63946]/35 scale-[1.08] ring-2 ring-[#E63946]/30 ring-offset-1 ring-offset-white z-10'
                        : isSearchMatch
                          ? 'bg-gradient-to-br from-[#FFB703] to-[#E8A000] border-2 border-[#FFB703] text-black shadow-lg shadow-[#FFB703]/30 scale-105'
                          : 'bg-white border-2 border-[#E63946]/15 text-[#E63946] shadow-sm hover:border-[#E63946]/60 hover:shadow-lg hover:shadow-[#E63946]/15 hover:-translate-y-0.5 hover:scale-105'
                      }
                    `}
                    style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1.5px', fontSize: 'clamp(13px, 1.5vw, 16px)' }}
                  >
                    {numStr}
                    {isSelected ? (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border-2 border-[#E63946] flex items-center justify-center shadow-md">
                        <i className="fas fa-check text-[8px] text-[#E63946]" />
                      </span>
                    ) : (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Infinite scroll sentinel */}
            {visibleCount < filteredNumbers.length && (
              <div ref={sentinelRef} className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-black/10 border-t-[#E63946] rounded-full animate-spin" />
                  <span className="text-[#aaa] text-[12px] font-semibold">
                    Mostrando {visibleCount.toLocaleString()} de {filteredNumbers.length.toLocaleString()}...
                  </span>
                </div>
              </div>
            )}

            {/* End message */}
            {visibleCount >= filteredNumbers.length && filteredNumbers.length > BATCH_SIZE && (
              <div className="text-center py-6">
                <p className="text-[#ccc] text-[12px]">
                  ✅ Todos los números cargados
                </p>
              </div>
            )}
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
              <a href="https://wa.me/573207120787" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center hover:bg-[#25D366]/20 hover:border-[#25D366]/40 transition-all">
                <i className="fab fa-whatsapp text-[#25D366] text-sm" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ═══ RANDOM MODAL ═══ */}
      {showRandom && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={closeRandom}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" style={{ animation: 'fadeIn 0.3s ease' }} />

          {/* Modal */}
          <div
            className="relative z-10 w-[90%] max-w-md bg-gradient-to-br from-[#1A1A20] to-[#12121A] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'modalPop 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            {/* Close */}
            <button
              onClick={closeRandom}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 transition-all"
            >
              <i className="fas fa-times text-sm" />
            </button>

            {/* Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-[#FFB703]/15 border border-[#FFB703]/25 rounded-full px-4 py-1.5 mb-3">
                <i className="fas fa-dice text-[#FFB703] text-sm" />
                <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#FFB703]">Suerte al Azar</span>
              </div>
              <h3
                className="text-2xl sm:text-3xl uppercase tracking-wider"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                TU NÚMERO DE LA{' '}
                <span className="bg-gradient-to-r from-[#FFB703] to-[#FFD700] bg-clip-text text-transparent">SUERTE</span>
              </h3>
            </div>

            {/* Slot machine */}
            <div className="relative bg-black/40 rounded-2xl border border-white/[0.08] p-4 mb-6 overflow-hidden">
              {/* Spinning numbers grid */}
              <div className={`grid grid-cols-4 gap-2 transition-all ${isSpinning ? 'opacity-70' : 'opacity-40'}`}>
                {spinNumbers.map((num, i) => {
                  const isCenter = i === 5;
                  return (
                    <div
                      key={`${i}-${num}`}
                      className={`
                        flex items-center justify-center py-3 rounded-xl font-mono font-bold text-sm tracking-wider
                        ${isCenter && !isSpinning
                          ? 'bg-[#FFB703]/20 border-2 border-[#FFB703] text-[#FFD700] scale-110 shadow-lg shadow-[#FFB703]/20'
                          : 'bg-white/[0.04] border border-white/[0.06] text-white/30'
                        }
                        transition-all duration-200
                      `}
                      style={{
                        animation: isSpinning ? `slotSpin 0.15s ease-in-out` : undefined,
                      }}
                    >
                      {formatNumero(num, totalBoletas)}
                    </div>
                  );
                })}
              </div>

              {/* Glow overlay when spinning */}
              {isSpinning && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFB703]/5 to-transparent pointer-events-none animate-pulse" />
              )}
            </div>

            {/* Confetti / sparkles on result */}
            {randomResult !== null && !isSpinning && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="confetti-piece"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: '-5%',
                      animationDelay: `${Math.random() * 0.5}s`,
                      animationDuration: `${1.5 + Math.random() * 2}s`,
                      backgroundColor: ['#FFB703', '#E63946', '#FFD700', '#25D366', '#FF6B6B', '#fff', '#1877F2'][i % 7],
                      width: `${6 + Math.random() * 8}px`,
                      height: `${6 + Math.random() * 8}px`,
                      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                      transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                  />
                ))}
                {/* Sparkle stars */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={`star-${i}`}
                    className="sparkle-star"
                    style={{
                      left: `${10 + Math.random() * 80}%`,
                      top: `${10 + Math.random() * 80}%`,
                      animationDelay: `${Math.random() * 1}s`,
                      fontSize: `${14 + Math.random() * 16}px`,
                    }}
                  >
                    ✨
                  </div>
                ))}
              </div>
            )}

            {/* Result */}
            {randomResult !== null && !isSpinning && (
              <div className="text-center relative z-30" style={{ animation: 'resultBounce 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <p className="text-[10px] font-bold tracking-[3px] uppercase text-white/30 mb-2">Tu número al azar es</p>
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#FFB703]/20 to-[#FFD700]/10 border-2 border-[#FFB703]/50 rounded-2xl px-8 py-4 mb-4 shadow-xl shadow-[#FFB703]/10">
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-wider text-[#FFD700]">
                    {formatNumero(randomResult, totalBoletas)}
                  </span>
                  <span className="text-2xl">🎉</span>
                </div>
                <p className="text-white/30 text-[12px] mb-4">¡Este número está disponible para ti!</p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      if (!selectedNumbers.includes(randomResult as number)) {
                        setSelectedNumbers([...selectedNumbers, randomResult as number]);
                      }
                      setRandomResult(null);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#E63946] to-[#FF6B6B] text-white text-[13px] font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-[#E63946]/30 hover:scale-[1.02] transition-all"
                  >
                    <i className="fas fa-check text-sm" />
                    SELECCIONAR NÚMERO
                  </button>
                  <button
                    onClick={() => {
                      setRandomResult(null);
                      startRandom();
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/10 text-white/60 text-[13px] font-bold hover:border-[#FFB703]/30 hover:text-[#FFB703] transition-all"
                  >
                    <i className="fas fa-redo text-[10px]" />
                    VOLVER A GIRAR
                  </button>
                </div>
              </div>
            )}

            {/* After selecting — show selected count + girar de nuevo + comprar */}
            {randomResult === null && !isSpinning && selectedNumbers.length > 0 && (
              <div className="text-center" style={{ animation: 'fadeIn 0.3s ease' }}>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 mb-4">
                  <p className="text-[11px] font-bold text-white/40 mb-2 flex items-center justify-center gap-1">
                    <i className="fas fa-list-ol text-[10px]" />
                    Números seleccionados ({selectedNumbers.length}):
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {selectedNumbers.map((num) => (
                      <span
                        key={num}
                        className="px-2.5 py-1 rounded-lg bg-[#E63946]/15 border border-[#E63946]/25 text-white/70 text-[11px] font-bold font-mono"
                      >
                        {formatNumero(num, totalBoletas)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => startRandom()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#FFB703] to-[#E8A000] text-black text-[13px] font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-[#FFB703]/30 hover:scale-[1.02] transition-all"
                  >
                    <i className="fas fa-dice text-sm" />
                    GIRAR DE NUEVO
                  </button>
                  <button
                    onClick={() => {
                      setShowRandom(false);
                      setRandomResult(null);
                      setSelectionBarOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-white text-[13px] font-bold uppercase tracking-wider hover:bg-[#1da851] shadow-lg shadow-[#25D366]/25 transition-all hover:scale-[1.02]"
                  >
                    <i className="fas fa-shopping-cart text-sm" />
                    COMPRAR NÚMEROS SELECCIONADOS
                  </button>
                </div>
              </div>
            )}

            {/* Spinning state */}
            {isSpinning && (
              <div className="text-center">
                <p className="text-white/40 text-sm font-semibold animate-pulse flex items-center justify-center gap-2">
                  <i className="fas fa-dice text-[#FFB703] animate-bounce" />
                  Buscando tu número de la suerte...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ SELECTED NUMBERS FLOATING BAR (Collapsible) ═══ */}
      {selectedNumbers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[10000] selection-bar-enter">
          {/* Collapsed bar — always visible */}
          <button
            onClick={() => setSelectionBarOpen(!selectionBarOpen)}
            className="w-full bg-[#E63946] border-t border-[#E63946] text-white py-2.5 px-4 flex items-center justify-between hover:bg-[#d32f3c] transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-[11px] font-black">{selectedNumbers.length}</span>
              </div>
              <span className="text-[13px] font-bold">
                {selectedNumbers.length === 1 ? '1 número seleccionado' : `${selectedNumbers.length} números seleccionados`}
              </span>
              <span className="text-[11px] font-semibold text-white/60">— {formatCOP(precio * selectedNumbers.length)}</span>
            </div>
            <i className={`fas fa-chevron-up text-sm transition-transform duration-300 ${selectionBarOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Expanded panel */}
          <div className={`bg-[#111115] border-t border-white/[0.06] overflow-hidden transition-all duration-300 ease-in-out ${selectionBarOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="max-w-[900px] mx-auto px-4 py-4">
              {/* Chips + clear */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-white/40">Tus números:</p>
                <button
                  onClick={() => { setSelectedNumbers([]); setSelectionBarOpen(false); }}
                  className="text-[11px] font-bold text-white/30 hover:text-[#E63946] transition-all flex items-center gap-1"
                >
                  <i className="fas fa-trash-alt text-[10px]" />
                  Limpiar todo
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4 max-h-[70px] overflow-y-auto custom-scrollbar">
                {selectedNumbers.map((num) => (
                  <div
                    key={num}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E63946]/15 border border-[#E63946]/30 text-white text-[11px] font-bold font-mono tracking-wider"
                  >
                    {formatNumero(num, totalBoletas)}
                    <button
                      onClick={() => {
                        const updated = selectedNumbers.filter((n) => n !== num);
                        setSelectedNumbers(updated);
                        if (updated.length === 0) setSelectionBarOpen(false);
                      }}
                      className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:bg-[#E63946] hover:text-white transition-all"
                    >
                      <i className="fas fa-times text-[7px]" />
                    </button>
                  </div>
                ))}
              </div>

              {/* WhatsApp CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={`https://wa.me/573207120787?text=${encodeURIComponent(`¡Hola! Quiero comprar estos números de la rifa El Gran Camión 🚛:\n\n${selectedNumbers.map(n => `• Boleta #${formatNumero(n, totalBoletas)}`).join('\n')}\n\nTotal: ${selectedNumbers.length} boleta(s) — ${formatCOP(precio * selectedNumbers.length)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#1da851] shadow-lg shadow-[#25D366]/25 transition-all"
                >
                  <i className="fab fa-whatsapp text-base" />
                  COMPRAR — 320 712 0787
                </a>
                <a
                  href={`https://wa.me/573207120779?text=${encodeURIComponent(`¡Hola! Quiero comprar estos números de la rifa El Gran Camión 🚛:\n\n${selectedNumbers.map(n => `• Boleta #${formatNumero(n, totalBoletas)}`).join('\n')}\n\nTotal: ${selectedNumbers.length} boleta(s) — ${formatCOP(precio * selectedNumbers.length)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#1da851] shadow-lg shadow-[#25D366]/25 transition-all"
                >
                  <i className="fab fa-whatsapp text-base" />
                  COMPRAR — 320 712 0779
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FLOATING WHATSAPP BUTTON ═══ */}
      <div className={`fixed right-6 z-50 flex flex-col items-end gap-2 transition-all duration-300 ${selectedNumbers.length > 0 ? 'bottom-[56px]' : 'bottom-6'}`}>
        <div className="whatsapp-float-menu flex flex-col items-end gap-1.5 mb-1">
          <a
            href="https://wa.me/573207120787?text=%C2%A1Hola!%20Quiero%20informaci%C3%B3n%20sobre%20la%20rifa%20El%20Gran%20Cami%C3%B3n%20%F0%9F%9A%9B"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] text-white text-[12px] font-bold shadow-lg shadow-[#25D366]/30 hover:bg-[#1da851] hover:scale-105 transition-all"
          >
            <i className="fab fa-whatsapp text-base" />
            320 712 0787
          </a>
          <a
            href="https://wa.me/573207120779?text=%C2%A1Hola!%20Quiero%20informaci%C3%B3n%20sobre%20la%20rifa%20El%20Gran%20Cami%C3%B3n%20%F0%9F%9A%9B"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] text-white text-[12px] font-bold shadow-lg shadow-[#25D366]/30 hover:bg-[#1da851] hover:scale-105 transition-all"
          >
            <i className="fab fa-whatsapp text-base" />
            320 712 0779
          </a>
        </div>
        <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-xl shadow-[#25D366]/40 animate-bounce cursor-pointer group" onClick={(e) => {
          const menu = (e.currentTarget.parentElement as HTMLElement)?.querySelector('.whatsapp-float-menu') as HTMLElement;
          if (menu) menu.classList.toggle('whatsapp-menu-open');
        }}>
          <i className="fab fa-whatsapp text-white text-2xl group-hover:scale-110 transition-transform" />
        </div>
      </div>

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
        .whatsapp-float-menu {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.3s ease, opacity 0.3s ease;
        }
        .whatsapp-menu-open {
          max-height: 200px;
          opacity: 1;
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
