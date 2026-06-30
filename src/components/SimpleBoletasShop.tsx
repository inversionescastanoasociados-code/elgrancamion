'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  WHATSAPP_LINES,
  buildWhatsAppUrl,
  formatBoletaWhatsAppMessage,
  pickRandomWhatsAppLine,
} from '@/lib/whatsappLines';

const API_BASE = 'https://rifas-backend-production.up.railway.app';
const API_KEY = 'pk_4f9a8c7e2d1b6a9f3c0d5e7f8a2b4c6d';
const PAGE_SIZE = 120;

interface RifaPublica {
  id: string;
  nombre: string;
  precio_boleta: string;
  total_boletas: number;
}

function formatNumero(n: number, total: number) {
  return String(n).padStart(String(total - 1).length, '0');
}

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);
}

export default function SimpleBoletasShop() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rifa, setRifa] = useState<RifaPublica | null>(null);
  const [available, setAvailable] = useState<number[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [assignedLine, setAssignedLine] = useState<(typeof WHATSAPP_LINES)[number] | null>(null);

  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<number | null>(null);
  const [rouletteNumbers, setRouletteNumbers] = useState<number[]>([]);
  const [rouletteCurrentIdx, setRouletteCurrentIdx] = useState(0);
  const [rouletteJustAdded, setRouletteJustAdded] = useState<number | null>(null);
  const rouletteInterval = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roulettePool = useMemo(
    () => available.filter((n) => !selected.has(n)),
    [available, selected],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const headers = { 'Content-Type': 'application/json', 'x-api-key': API_KEY };

        const rifaRes = await fetch(`${API_BASE}/api/ventas-online/rifas`, { headers });
        const rifaJson = await rifaRes.json();
        if (!rifaRes.ok || !rifaJson.success) throw new Error(rifaJson.message || 'No se pudieron cargar las rifas');
        const rifas: RifaPublica[] = rifaJson.data;
        if (!rifas.length) throw new Error('No hay rifas activas');
        const active = rifas[0];

        const bolRes = await fetch(`${API_BASE}/api/ventas-online/rifas/${active.id}/boletas`, { headers });
        const bolJson = await bolRes.json();
        if (!bolRes.ok || !bolJson.success) throw new Error(bolJson.message || 'No se pudieron cargar los números');

        if (cancelled) return;

        const nums = (bolJson.data.boletas as { numero: number; estado: string }[])
          .filter((b) => b.estado === 'DISPONIBLE')
          .map((b) => b.numero)
          .sort((a, b) => a - b);

        setRifa(active);
        setAvailable(nums);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error inesperado');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalBoletas = rifa?.total_boletas ?? 10000;
  const precio = rifa ? parseFloat(rifa.precio_boleta) : 130000;

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return available;
    return available.filter((n) => formatNumero(n, totalBoletas).includes(q));
  }, [available, search, totalBoletas]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageNumbers = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    if (page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const toggle = useCallback((num: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  }, []);

  const closeRoulette = useCallback(() => {
    if (rouletteInterval.current) clearTimeout(rouletteInterval.current);
    setShowRoulette(false);
    setRouletteSpinning(false);
    setRouletteResult(null);
    setRouletteJustAdded(null);
  }, []);

  const runRouletteSpin = useCallback((pool: number[]) => {
    if (!pool.length) return;

    if (rouletteInterval.current) clearTimeout(rouletteInterval.current);

    setRouletteResult(null);
    setRouletteJustAdded(null);
    setRouletteSpinning(true);

    const sequence: number[] = [];
    for (let i = 0; i < 30; i++) {
      sequence.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    const finalPick = pool[Math.floor(Math.random() * pool.length)];
    sequence.push(finalPick);
    setRouletteNumbers(sequence);
    setRouletteCurrentIdx(0);

    let idx = 0;
    let speed = 50;
    const tick = () => {
      idx++;
      setRouletteCurrentIdx(idx);
      if (idx >= sequence.length - 1) {
        setRouletteSpinning(false);
        setRouletteResult(finalPick);
        return;
      }
      if (idx > sequence.length * 0.6) speed = 180;
      else if (idx > sequence.length * 0.3) speed = 120;
      rouletteInterval.current = setTimeout(tick, speed);
    };
    rouletteInterval.current = setTimeout(tick, speed);
  }, []);

  const startRoulette = useCallback(() => {
    if (!roulettePool.length) return;
    setShowRoulette(true);
    runRouletteSpin(roulettePool);
  }, [roulettePool, runRouletteSpin]);

  const acceptRoulette = useCallback(() => {
    if (rouletteResult === null) return;
    const picked = rouletteResult;
    setSelected((prev) => {
      const next = new Set(prev);
      next.add(picked);
      return next;
    });
    setRouletteJustAdded(picked);
    setRouletteResult(null);
    setRouletteSpinning(false);
  }, [rouletteResult]);

  useEffect(() => () => {
    if (rouletteInterval.current) clearTimeout(rouletteInterval.current);
  }, []);

  const clearSelection = () => setSelected(new Set());

  const removeSelected = useCallback((num: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(num);
      return next;
    });
  }, []);

  const selectedList = useMemo(
    () => Array.from(selected).sort((a, b) => a - b),
    [selected],
  );

  const selectedFormatted = selectedList.map((n) => formatNumero(n, totalBoletas));
  const totalPrice = selectedList.length * precio;

  const openConfirm = () => {
    if (!selectedList.length) return;
    setAssignedLine(pickRandomWhatsAppLine());
    setShowConfirm(true);
  };

  const confirmAndWhatsApp = () => {
    const line = assignedLine ?? pickRandomWhatsAppLine();
    const msg = formatBoletaWhatsAppMessage(selectedFormatted);
    window.open(buildWhatsAppUrl(line.num, msg), '_blank', 'noopener,noreferrer');
    setShowConfirm(false);
    setSelected(new Set());
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-black/[0.06] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="relative w-9 h-9">
              <Image src="/uploads/logos/logo-principal.png" alt="El Gran Camión" fill className="object-contain" sizes="36px" />
            </div>
            <span className="text-sm font-bold text-[#1A1A1A] hidden sm:block" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              EL GRAN CAMIÓN
            </span>
          </Link>
          <div className="text-center flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[#999]">Boleta</p>
            <p className="text-lg font-bold text-truck-red leading-none" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              {formatCOP(precio)}
            </p>
          </div>
          <Link href="/" className="text-[12px] text-[#666] hover:text-[#1A1A1A] shrink-0">
            <i className="fas fa-home mr-1" /> Inicio
          </Link>
        </div>
      </header>

      {/* Barra carrito — números seleccionados visibles */}
      {!loading && !error && selected.size > 0 && (
        <div className="sticky top-[57px] z-30 bg-gradient-to-r from-truck-red/[0.06] to-[#FFB703]/[0.06] backdrop-blur-xl border-b border-truck-red/20 shadow-sm shop-fade-in">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-truck-red flex items-center justify-center shadow-md shadow-truck-red/30">
                  <i className="fas fa-shopping-cart text-white text-[11px]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-truck-red">
                    Tu carrito
                  </p>
                  <p className="text-xs font-semibold text-[#555]">
                    {selected.size} {selected.size === 1 ? 'número' : 'números'} · {formatCOP(totalPrice)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="text-[11px] font-bold text-[#999] hover:text-truck-red transition-colors shrink-0"
              >
                Limpiar todo
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {selectedList.map((num) => (
                <div
                  key={num}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl bg-truck-red text-white shadow-md shadow-truck-red/25 cart-bounce"
                >
                  <span
                    className="text-sm font-black tabular-nums"
                    style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}
                  >
                    {formatNumero(num, totalBoletas)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSelected(num)}
                    aria-label={`Quitar ${formatNumero(num, totalBoletas)}`}
                    className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <i className="fas fa-times text-[9px]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 pb-44">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl uppercase text-[#1A1A1A]" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
            Elige tu número
          </h1>
          <p className="text-[#777] text-sm mt-1">
            Toca varios números o usa la ruleta — todo se acumula en tu carrito
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Buscar número…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-truck-red/30"
          />
          <button
            type="button"
            onClick={startRoulette}
            disabled={!roulettePool.length}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#F57F17] text-white text-[12px] font-bold uppercase tracking-wide hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            <i className="fas fa-dice mr-1.5" /> Al azar
          </button>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="px-4 py-2.5 rounded-xl border border-black/10 text-[12px] font-semibold text-[#999] hover:text-[#555]"
            >
              Limpiar
            </button>
          )}
        </div>

        {!loading && !error && (
          <p className="text-[12px] text-[#999] mb-3">
            {filtered.length.toLocaleString('es-CO')} números disponibles
            {selected.size > 0 && (
              <span className="text-truck-red font-bold ml-2">· {selected.size} seleccionado{selected.size > 1 ? 's' : ''}</span>
            )}
          </p>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="w-10 h-10 border-2 border-black/10 border-t-truck-red rounded-full animate-spin" />
            <p className="text-sm text-[#999]">Cargando números…</p>
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-[#888] mb-4">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="btn-primary text-sm px-6 py-3">
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-[#888]">No hay números disponibles con ese filtro.</div>
        ) : (
          <>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 sm:gap-2">
              {pageNumbers.map((num) => {
                const label = formatNumero(num, totalBoletas);
                const isOn = selected.has(num);
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => toggle(num)}
                    className={`aspect-square rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                      isOn
                        ? 'bg-truck-red text-white scale-110 shadow-lg shadow-truck-red/40 ring-2 ring-truck-red ring-offset-2 ring-offset-[#FAFAFA]'
                        : 'bg-white border border-black/[0.08] text-[#333] hover:border-truck-red/40 hover:shadow-sm'
                    }`}
                    style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.5px' }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between gap-4">
                <p className="text-xs text-[#999]">
                  Página {page + 1} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 rounded-lg border border-black/10 text-sm font-medium disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 rounded-lg border border-black/10 text-sm font-medium disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Barra fija comprar */}
      {!loading && !error && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-truck-red/20 shadow-[0_-12px_40px_rgba(230,57,70,0.12)] safe-area-bottom">
          <div className="max-w-[1200px] mx-auto px-4 py-3 sm:py-4">
            {selected.size > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-2.5 overflow-x-auto scrollbar-hide">
                  <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-truck-red">
                    <i className="fas fa-ticket mr-1" />
                    En carrito:
                  </span>
                  {selectedList.map((num) => (
                    <span
                      key={num}
                      className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-truck-red text-white text-xs font-black shadow-sm"
                      style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.5px' }}
                    >
                      {formatNumero(num, totalBoletas)}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#999] uppercase tracking-wider">Total a pagar</p>
                    <p className="text-xl sm:text-2xl font-bold text-truck-red leading-none" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                      {formatCOP(totalPrice)}
                    </p>
                    <p className="text-[11px] text-[#888] mt-0.5">
                      {selected.size} boleta{selected.size > 1 ? 's' : ''} seleccionada{selected.size > 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openConfirm}
                    className="btn-primary text-[14px] px-8 py-4 shrink-0 shadow-lg shadow-truck-red/25"
                  >
                    <i className="fab fa-whatsapp" />
                    Comprar
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-4 py-1">
                <div>
                  <p className="text-sm font-semibold text-[#888]">Aún no has elegido números</p>
                  <p className="text-[11px] text-[#bbb]">Toca un número o usa la ruleta</p>
                </div>
                <button
                  type="button"
                  disabled
                  className="btn-primary text-[14px] px-8 py-4 opacity-40 cursor-not-allowed shrink-0"
                >
                  <i className="fab fa-whatsapp" />
                  Comprar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 modal-overlay">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden modal-up">
            <div className="p-6">
              <h2 className="text-2xl uppercase text-[#1A1A1A] mb-1" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                Confirmar números
              </h2>
              <p className="text-sm text-[#777] mb-4">Revisa antes de enviar por WhatsApp</p>

              <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
                {selectedFormatted.map((n) => (
                  <span
                    key={n}
                    className="px-3 py-1.5 rounded-lg bg-truck-red/10 text-truck-red font-bold text-sm"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    {n}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center py-3 border-t border-b border-black/[0.06] mb-4">
                <span className="text-sm text-[#666]">{selectedList.length} boleta{selectedList.length > 1 ? 's' : ''}</span>
                <span className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                  {formatCOP(totalPrice)}
                </span>
              </div>

              {assignedLine && (
                <p className="text-[12px] text-[#888] mb-4 flex items-center gap-2">
                  <i className="fab fa-whatsapp text-[#25D366]" />
                  Te atenderá la línea <strong className="text-[#333]">{assignedLine.display}</strong>
                </p>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={confirmAndWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#25D366] hover:bg-[#22c55e] text-white font-bold text-[14px] transition-colors"
                >
                  <i className="fab fa-whatsapp text-lg" />
                  Confirmar y abrir WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="w-full py-3 text-sm font-semibold text-[#999] hover:text-[#555]"
                >
                  Cancelar
                </button>
              </div>

              <p className="text-[10px] text-[#bbb] text-center mt-4 leading-relaxed">
                También puedes escribir a cualquier línea:{' '}
                {WHATSAPP_LINES.map((l) => l.display).join(' · ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal ruleta */}
      {showRoulette && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center modal-overlay p-4" onClick={closeRoulette}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-md modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-[#1A1A1E] to-[#111113] rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl">
              <div className="relative bg-gradient-to-r from-[#FFB703]/20 to-[#F57F17]/10 px-6 py-5 border-b border-white/[0.06]">
                <button
                  type="button"
                  onClick={closeRoulette}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
                >
                  <i className="fas fa-times text-sm" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFB703]/20 flex items-center justify-center">
                    <i className={`fas fa-dice text-[#FFB703] text-xl ${rouletteSpinning ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <h3
                      className="text-2xl tracking-wider uppercase text-white"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      Ruleta de la suerte
                    </h3>
                    <p className="text-[11px] text-white/40">
                      {selected.size > 0
                        ? `${selected.size} en carrito · puedes seguir agregando`
                        : 'Gira y agrega varios números al carrito'}
                    </p>
                  </div>
                </div>
                {selected.size > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                    {selectedList.map((num) => (
                      <span
                        key={num}
                        className="px-2 py-0.5 rounded-md bg-truck-red/20 border border-truck-red/30 text-[11px] font-bold text-[#FFB703]"
                        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                      >
                        {formatNumero(num, totalBoletas)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-10 flex flex-col items-center">
                <div className="relative mb-8">
                  <div
                    className={`w-40 h-40 rounded-full flex items-center justify-center border-4 ${
                      rouletteSpinning
                        ? 'border-[#FFB703] shadow-[0_0_40px_rgba(255,183,3,0.3)]'
                        : rouletteResult !== null
                          ? 'border-[#25D366] shadow-[0_0_40px_rgba(37,211,102,0.3)]'
                          : 'border-white/20'
                    } transition-all duration-300`}
                    style={{
                      background: rouletteSpinning
                        ? 'radial-gradient(circle, #2A2A30, #1A1A1E)'
                        : rouletteResult !== null
                          ? 'radial-gradient(circle, #1A2E1A, #1A1A1E)'
                          : 'radial-gradient(circle, #222228, #1A1A1E)',
                    }}
                  >
                    {rouletteSpinning && (
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FFB703] animate-spin" />
                    )}
                    <span
                      className={`text-5xl sm:text-6xl font-black tabular-nums transition-all duration-100 ${
                        rouletteSpinning
                          ? 'text-[#FFB703] roulette-number'
                          : rouletteResult !== null
                            ? 'text-[#25D366] scale-110'
                            : 'text-white/30'
                      }`}
                      style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '3px' }}
                    >
                      {rouletteNumbers.length > 0
                        ? formatNumero(
                            rouletteNumbers[Math.min(rouletteCurrentIdx, rouletteNumbers.length - 1)],
                            totalBoletas,
                          )
                        : '----'}
                    </span>
                  </div>
                  {rouletteSpinning && (
                    <div
                      className="absolute inset-0 rounded-full bg-[#FFB703]/10 animate-ping pointer-events-none"
                      style={{ animationDuration: '1.5s' }}
                    />
                  )}
                  {rouletteResult !== null && !rouletteSpinning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className="absolute w-48 h-48 rounded-full border-2 border-[#25D366]/20 animate-ping"
                        style={{ animationDuration: '2s' }}
                      />
                    </div>
                  )}
                </div>

                <div className="text-center mb-6">
                  {rouletteSpinning && (
                    <p className="text-[#FFB703] text-sm font-bold animate-pulse tracking-wider uppercase">
                      Girando la ruleta...
                    </p>
                  )}
                  {rouletteResult !== null && !rouletteSpinning && (
                    <div className="shop-pop-in">
                      <p className="text-[#25D366] text-sm font-bold tracking-wider uppercase mb-1">
                        ¡Tu número de la suerte!
                      </p>
                      <p className="text-white/40 text-xs">
                        Agrega el{' '}
                        <strong className="text-white/70">
                          #{formatNumero(rouletteResult, totalBoletas)}
                        </strong>{' '}
                        al carrito y sigue girando si quieres más
                      </p>
                    </div>
                  )}
                  {rouletteJustAdded !== null && rouletteResult === null && !rouletteSpinning && (
                    <div className="shop-pop-in">
                      <p className="text-[#25D366] text-sm font-bold tracking-wider uppercase mb-1">
                        <i className="fas fa-check-circle mr-1" />
                        #{formatNumero(rouletteJustAdded, totalBoletas)} agregado
                      </p>
                      <p className="text-white/40 text-xs">
                        {roulettePool.length > 0
                          ? 'Gira de nuevo para agregar otro número'
                          : 'No quedan más números disponibles'}
                      </p>
                    </div>
                  )}
                  {!rouletteSpinning && rouletteResult === null && rouletteJustAdded === null && (
                    <p className="text-white/30 text-sm">Presiona girar para comenzar</p>
                  )}
                </div>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                  {rouletteResult !== null && !rouletteSpinning ? (
                    <>
                      <button
                        type="button"
                        onClick={acceptRoulette}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-[14px] font-bold tracking-wider uppercase shadow-lg shadow-green-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      >
                        <i className="fas fa-check-circle text-sm" />
                        Seleccionar #{formatNumero(rouletteResult, totalBoletas)}
                      </button>
                      <button
                        type="button"
                        onClick={() => runRouletteSpin(roulettePool)}
                        disabled={!roulettePool.length}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[#FFB703]/30 bg-[#FFB703]/10 text-[#FFB703] text-[13px] font-bold tracking-wider uppercase hover:bg-[#FFB703]/20 transition-all disabled:opacity-40"
                      >
                        <i className="fas fa-redo text-xs" />
                        Girar de nuevo
                      </button>
                    </>
                  ) : !rouletteSpinning ? (
                    <button
                      type="button"
                      onClick={() => runRouletteSpin(roulettePool)}
                      disabled={!roulettePool.length}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#F57F17] text-white text-[14px] font-bold tracking-wider uppercase shadow-lg shadow-[#FFB703]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                    >
                      <i className="fas fa-dice text-sm" />
                      Girar de nuevo
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
