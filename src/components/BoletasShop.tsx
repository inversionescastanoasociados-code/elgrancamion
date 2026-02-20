'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════
   BOLETAS MOCK DATA — Replace with API later
═══════════════════════════════════════════════════ */
type BoletaStatus = 'available' | 'sold' | 'reserved';

interface Boleta {
  number: string;
  status: BoletaStatus;
}

function generateMockBoletas(): Boleta[] {
  const boletas: Boleta[] = [];
  for (let i = 0; i < 10000; i++) {
    const num = String(i).padStart(4, '0');
    const rand = Math.random();
    let status: BoletaStatus = 'available';
    if (rand < 0.35) status = 'sold';
    else if (rand < 0.40) status = 'reserved';
    boletas.push({ number: num, status });
  }
  return boletas;
}

const ALL_BOLETAS = generateMockBoletas();
const PRICE = 50000;
const BOLETAS_PER_PAGE = 60;

/* ═══ Helper: format COP ═══ */
function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

/* ═══ Countdown hook ═══ */
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
  }, []);
  return time;
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function BoletasShop() {
  /* ─── State ─── */
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [buyerData, setBuyerData] = useState({ name: '', phone: '', email: '', cedula: '' });
  const [filterStatus, setFilterStatus] = useState<'all' | 'available'>('available');
  const gridRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const countdown = useCountdown(new Date('2026-05-10T00:00:00'));
  const pad = (n: number) => String(n).padStart(2, '0');

  /* ─── Filtered boletas ─── */
  const filtered = ALL_BOLETAS.filter((b) => {
    if (search && !b.number.includes(search)) return false;
    if (filterStatus === 'available' && b.status !== 'available') return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / BOLETAS_PER_PAGE);
  const paginated = filtered.slice(page * BOLETAS_PER_PAGE, (page + 1) * BOLETAS_PER_PAGE);

  /* ─── Toggle selection ─── */
  const toggle = useCallback((num: string) => {
    const boleta = ALL_BOLETAS.find((b) => b.number === num);
    if (!boleta || boleta.status !== 'available') return;
    setSelected((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  }, []);

  /* ─── Random pick ─── */
  const pickRandom = useCallback(() => {
    const available = ALL_BOLETAS.filter(
      (b) => b.status === 'available' && !selected.includes(b.number)
    );
    if (available.length === 0) return;
    const pick = available[Math.floor(Math.random() * available.length)];
    setSelected((prev) => [...prev, pick.number]);
  }, [selected]);

  /* ─── Search jump ─── */
  const jumpToNumber = useCallback(
    (num: string) => {
      const idx = filtered.findIndex((b) => b.number === num);
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

  /* ─── Stats ─── */
  const totalAvailable = ALL_BOLETAS.filter((b) => b.status === 'available').length;
  const totalSold = ALL_BOLETAS.filter((b) => b.status === 'sold').length;
  const soldPercent = Math.round((totalSold / ALL_BOLETAS.length) * 100);

  return (
    <>
      {/* ═══ SHOP NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-3 bg-white/95 backdrop-blur-xl border-b border-black/[0.06] shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
              <Image
                src="/uploads/logos/logo-negro.png"
                alt="Gran Rifa Camionera"
                fill
                className="object-contain"
                sizes="40px"
                priority
              />
            </div>
            <span
              className="text-base sm:text-lg tracking-wider text-[#1A1A1A] hidden sm:block"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              GRAN RIFA <span className="text-truck-red">CAMIONERA</span>
            </span>
          </Link>

          {/* Cart badge */}
          <div className="flex items-center gap-3">
            {selected.length > 0 && (
              <button
                onClick={() => setShowCheckout(true)}
                className="btn-primary text-[11px] sm:text-[12px] px-4 sm:px-6 py-2.5 relative"
              >
                <i className="fas fa-shopping-cart text-[10px]" />
                <span className="hidden sm:inline">Finalizar Compra</span>
                <span className="sm:hidden">Comprar</span>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-warning-yellow text-black text-[11px] font-black flex items-center justify-center shadow-lg">
                  {selected.length}
                </span>
              </button>
            )}
            <Link
              href="/"
              className="text-[13px] text-[#888] hover:text-[#333] transition-colors font-semibold hidden sm:block"
            >
              ← Volver
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16 min-h-screen bg-[#FAFAFA]">
        {/* ═══ HERO BANNER — Aggressive marketing ═══ */}
        <section className="relative bg-[#111113] overflow-hidden">
          {/* BG Image */}
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
                  {totalAvailable.toLocaleString()} boletas disponibles
                </span>
              </div>

              <h1
                className="text-[clamp(32px,6vw,64px)] leading-[0.9] uppercase tracking-wider text-white mb-4"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                ESCOGE TU <span className="text-truck-red">NÚMERO</span>{' '}
                <span className="bg-gradient-to-r from-[#FFB703] via-[#FFD700] to-[#FFB703] bg-clip-text text-transparent">DE LA SUERTE</span>
              </h1>

              <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto mb-6">
                Cada boleta es una oportunidad real de ganar.{' '}
                <strong className="text-white/70">Solo {formatCOP(PRICE)}</strong> separa tu sueño.
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
                    <div className="text-[9px] font-bold tracking-[2px] uppercase text-white/35">{item.l}</div>
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
                  { icon: '🚛', label: 'Tractomula', sub: '+$200M' },
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
                  placeholder="Buscar número... (ej: 0777)"
                  value={search}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setSearch(v);
                    setPage(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && search.length === 4) {
                      jumpToNumber(search.padStart(4, '0'));
                    }
                  }}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/[0.08] bg-[#FAFAFA] text-[#1A1A1A] text-sm font-semibold placeholder:text-[#bbb] focus:outline-none focus:border-[#E63946]/40 focus:ring-2 focus:ring-[#E63946]/10 transition-all"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(''); setPage(0); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#333] text-xs"
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Filter */}
                <div className="flex rounded-lg border border-black/[0.08] overflow-hidden text-[11px] font-bold">
                  <button
                    onClick={() => { setFilterStatus('available'); setPage(0); }}
                    className={`px-3 py-2 transition-colors ${filterStatus === 'available' ? 'bg-[#E63946] text-white' : 'bg-white text-[#888] hover:bg-gray-50'}`}
                  >
                    Disponibles
                  </button>
                  <button
                    onClick={() => { setFilterStatus('all'); setPage(0); }}
                    className={`px-3 py-2 transition-colors ${filterStatus === 'all' ? 'bg-[#E63946] text-white' : 'bg-white text-[#888] hover:bg-gray-50'}`}
                  >
                    Todas
                  </button>
                </div>

                {/* Random */}
                <button
                  onClick={pickRandom}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#F57F17] text-white text-[11px] font-bold tracking-wider uppercase shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <i className="fas fa-dice text-xs" />
                  <span className="hidden sm:inline">Suerte</span>
                </button>

                {/* Selected count */}
                {selected.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#E63946]/[0.06] border border-[#E63946]/20">
                    <i className="fas fa-ticket text-[#E63946] text-[10px]" />
                    <span className="text-[12px] font-bold text-[#E63946]">{selected.length}</span>
                    <button
                      onClick={() => setSelected([])}
                      className="text-[10px] text-[#E63946]/60 hover:text-[#E63946] ml-1"
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ BOLETAS GRID ═══ */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12" ref={gridRef}>
          {/* Legend */}
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
                Vendida
              </span>
            </div>
            <p className="text-[11px] text-[#bbb]">
              Mostrando {paginated.length} de {filtered.length.toLocaleString()} boletas
            </p>
          </div>

          {/* Grid */}
          {paginated.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 sm:gap-2.5">
              {paginated.map((b) => {
                const isSelected = selected.includes(b.number);
                const isSold = b.status === 'sold';
                const isReserved = b.status === 'reserved';
                const isAvailable = b.status === 'available';

                return (
                  <button
                    key={b.number}
                    id={`boleta-${b.number}`}
                    disabled={!isAvailable}
                    onClick={() => toggle(b.number)}
                    className={`
                      boleta-cell relative aspect-square rounded-xl font-black text-sm sm:text-base
                      transition-all duration-200 select-none
                      ${isSelected
                        ? 'bg-gradient-to-br from-[#E63946] to-[#B71C1C] text-white shadow-lg shadow-[#E63946]/25 scale-105 ring-2 ring-[#E63946]/30 ring-offset-1 ring-offset-white z-10'
                        : isAvailable
                          ? 'bg-gradient-to-br from-white to-[#f5f5f5] text-[#555] border border-black/[0.06] hover:border-[#E63946]/30 hover:shadow-md hover:shadow-[#E63946]/10 hover:-translate-y-0.5 hover:text-[#E63946] cursor-pointer'
                          : isSold
                            ? 'bg-[#eee] text-[#ccc] cursor-not-allowed line-through'
                            : 'bg-[#FFF8E7] text-[#cca] border border-[#FFB703]/20 cursor-not-allowed'
                      }
                    `}
                    style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}
                  >
                    {b.number}
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-[#E63946] flex items-center justify-center shadow-sm">
                        <i className="fas fa-check text-[8px]" />
                      </span>
                    )}
                    {isReserved && (
                      <span className="absolute top-0.5 right-0.5 text-[7px] text-[#FFB703]">
                        <i className="fas fa-clock" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-[#999] text-lg font-semibold">No se encontraron boletas</p>
              <p className="text-[#ccc] text-sm mt-1">Intenta con otro número o cambia el filtro</p>
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

              {/* Page numbers */}
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

        {/* ═══ FLOATING CART BAR ═══ */}
        {selected.length > 0 && (
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
                        {selected.length} boleta{selected.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-white/40 text-[11px]">
                        {selected.slice(0, 5).join(', ')}{selected.length > 5 ? ` +${selected.length - 5} más` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Total</p>
                    <p
                      className="text-xl sm:text-2xl text-white font-black leading-none"
                      style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}
                    >
                      {formatCOP(selected.length * PRICE)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="btn-primary text-[12px] sm:text-[13px] px-6 sm:px-8 py-3"
                  >
                    <i className="fas fa-lock text-[10px]" />
                    COMPRAR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TRUST STRIP — Below grid ═══ */}
        <section className="bg-[#F5F2EE] border-t border-black/[0.04] py-10 sm:py-14">
          <div className="max-w-[1000px] mx-auto px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { icon: 'fa-shield-halved', title: '100% Seguro', desc: 'Compra protegida' },
                { icon: 'fa-ticket', title: 'Boleta Digital', desc: 'Al instante por WhatsApp' },
                { icon: 'fa-trophy', title: '+$300M', desc: 'En premios totales' },
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

        {/* ═══ BOTTOM CTA ═══ */}
        <section className="bg-[#111113] py-12 sm:py-16">
          <div className="max-w-[700px] mx-auto px-6 text-center">
            <h2
              className="text-[clamp(28px,5vw,48px)] leading-[0.9] uppercase tracking-wider text-white mb-4"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              ¿AÚN NO TE <span className="text-truck-red">DECIDES</span>?
            </h2>
            <p className="text-white/45 text-sm sm:text-base mb-6 max-w-md mx-auto">
              Solo necesitas una boleta para cambiar tu vida. No dejes que otro se lleve tu premio.
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
              <a
                href="https://wa.me/573000000000?text=Tengo%20una%20pregunta%20sobre%20las%20boletas"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/15 text-white/60 text-[13px] font-bold hover:border-white/30 hover:text-white/80 transition-all"
              >
                <i className="fab fa-whatsapp text-lg text-green-400" />
                Preguntar por WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════════
         CHECKOUT MODAL
      ═══════════════════════════════════════════════════ */}
      {showCheckout && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowCheckout(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-black/[0.06] px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3
                  className="text-2xl tracking-wider uppercase text-[#1A1A1A]"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  FINALIZAR COMPRA
                </h3>
                <p className="text-[11px] text-[#999] font-semibold">{selected.length} boleta{selected.length > 1 ? 's' : ''} seleccionada{selected.length > 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="w-9 h-9 rounded-full bg-black/[0.04] flex items-center justify-center text-[#999] hover:text-[#333] hover:bg-black/[0.08] transition-all"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Selected boletas */}
              <div>
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider block mb-3">
                  Tus Boletas
                </label>
                <div className="flex flex-wrap gap-2">
                  {selected.map((num) => (
                    <span
                      key={num}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E63946]/[0.07] border border-[#E63946]/15 text-[#E63946] text-sm font-black tracking-wider"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      #{num}
                      <button
                        onClick={() => setSelected((prev) => prev.filter((n) => n !== num))}
                        className="text-[#E63946]/40 hover:text-[#E63946] text-[10px] ml-1"
                      >
                        <i className="fas fa-times" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Price summary */}
              <div className="bg-[#FAFAFA] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">{selected.length} × Boleta</span>
                  <span className="text-[#555] font-semibold">{formatCOP(PRICE)}</span>
                </div>
                <div className="h-px bg-black/[0.06]" />
                <div className="flex justify-between">
                  <span className="text-[13px] font-bold text-[#1A1A1A]">Total a Pagar</span>
                  <span
                    className="text-2xl font-black text-[#E63946]"
                    style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}
                  >
                    {formatCOP(selected.length * PRICE)}
                  </span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider block">
                  Tus Datos
                </label>
                {[
                  { key: 'name', label: 'Nombre completo', icon: 'fa-user', type: 'text', placeholder: 'Juan Pérez' },
                  { key: 'cedula', label: 'Cédula', icon: 'fa-id-card', type: 'text', placeholder: '1.234.567.890' },
                  { key: 'phone', label: 'WhatsApp', icon: 'fa-whatsapp fab', type: 'tel', placeholder: '300 123 4567' },
                  { key: 'email', label: 'Correo (opcional)', icon: 'fa-envelope', type: 'email', placeholder: 'correo@ejemplo.com' },
                ].map((field) => (
                  <div key={field.key} className="relative">
                    <i className={`${field.icon.includes('fab') ? field.icon : `fas ${field.icon}`} absolute left-4 top-1/2 -translate-y-1/2 text-[#ccc] text-sm`} />
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={buyerData[field.key as keyof typeof buyerData]}
                      onChange={(e) => setBuyerData({ ...buyerData, [field.key]: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-black/[0.08] bg-white text-[#1A1A1A] text-sm font-medium placeholder:text-[#ccc] focus:outline-none focus:border-[#E63946]/40 focus:ring-2 focus:ring-[#E63946]/10 transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Payment methods */}
              <div>
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider block mb-3">
                  Métodos de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Nequi', color: 'from-[#E20074] to-[#B0005C]' },
                    { name: 'Bancolombia', color: 'from-[#FDDA24] to-[#E6C420]' },
                    { name: 'Daviplata', color: 'from-[#ED1C24] to-[#C0161E]' },
                    { name: 'Tarjeta', color: 'from-[#1A1A1A] to-[#333]' },
                  ].map((m) => (
                    <div
                      key={m.name}
                      className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-black/[0.06] bg-[#FAFAFA] text-[12px] font-bold text-[#555]"
                    >
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${m.color}`} />
                      {m.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => {
                  if (!buyerData.name || !buyerData.phone || !buyerData.cedula) {
                    alert('Por favor completa nombre, cédula y WhatsApp');
                    return;
                  }
                  setShowCheckout(false);
                  setShowConfirm(true);
                }}
                className="w-full btn-primary text-[14px] py-4 justify-center"
              >
                <i className="fas fa-lock text-xs" />
                CONFIRMAR COMPRA — {formatCOP(selected.length * PRICE)}
              </button>

              <p className="text-center text-[11px] text-[#bbb]">
                <i className="fas fa-shield-halved text-[9px] mr-1" />
                Compra 100% segura. Recibirás tu boleta por WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
         CONFIRMATION MODAL
      ═══════════════════════════════════════════════════ */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success header */}
            <div className="bg-gradient-to-br from-[#111113] to-[#1a1a1f] px-6 py-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 prize-shimmer pointer-events-none" />
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check-circle text-green-400 text-3xl" />
                </div>
                <h3
                  className="text-3xl tracking-wider uppercase text-white mb-2"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  ¡COMPRA REGISTRADA!
                </h3>
                <p className="text-white/50 text-sm">Tu solicitud ha sido procesada con éxito</p>
              </div>
            </div>

            <div className="px-6 py-6 space-y-5">
              {/* Order details */}
              <div className="bg-[#FAFAFA] rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Comprador</span>
                  <span className="font-bold text-[#1A1A1A]">{buyerData.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Cédula</span>
                  <span className="font-semibold text-[#555]">{buyerData.cedula}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">WhatsApp</span>
                  <span className="font-semibold text-[#555]">{buyerData.phone}</span>
                </div>
                <div className="h-px bg-black/[0.06]" />
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Boletas</span>
                  <span className="font-bold text-[#1A1A1A]">
                    {selected.map((n) => `#${n}`).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Cantidad</span>
                  <span className="font-semibold text-[#555]">{selected.length}</span>
                </div>
                <div className="h-px bg-black/[0.06]" />
                <div className="flex justify-between">
                  <span className="text-[13px] font-bold text-[#1A1A1A]">Total</span>
                  <span
                    className="text-2xl font-black text-[#E63946]"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    {formatCOP(selected.length * PRICE)}
                  </span>
                </div>
              </div>

              {/* Next steps */}
              <div className="bg-[#FFF8E7] border border-[#FFB703]/20 rounded-xl p-4">
                <p className="text-[12px] font-bold text-[#B87A00] mb-2">
                  <i className="fas fa-info-circle mr-1" /> Próximos pasos:
                </p>
                <ol className="text-[12px] text-[#8B6914] space-y-1 list-decimal list-inside">
                  <li>Recibirás un mensaje de WhatsApp con los datos de pago</li>
                  <li>Realiza la transferencia a la cuenta indicada</li>
                  <li>Envía el comprobante y recibe tu boleta digital</li>
                </ol>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <a
                  href={`https://wa.me/573000000000?text=${encodeURIComponent(
                    `¡Hola! Acabo de reservar ${selected.length} boleta(s): ${selected.map((n) => `#${n}`).join(', ')}. Mi nombre es ${buyerData.name}, cédula ${buyerData.cedula}. Total: ${formatCOP(selected.length * PRICE)}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-[#25D366] text-white text-[14px] font-bold shadow-lg hover:bg-[#20BD5A] transition-all"
                >
                  <i className="fab fa-whatsapp text-xl" />
                  CONFIRMAR POR WHATSAPP
                </a>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setSelected([]);
                    setBuyerData({ name: '', phone: '', email: '', cedula: '' });
                  }}
                  className="text-[13px] text-[#999] hover:text-[#555] font-semibold py-2 transition-colors"
                >
                  Cerrar y seguir comprando
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
