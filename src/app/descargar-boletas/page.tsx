'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { descargarBoletaPDF, descargarTodasPDF } from '../../lib/boletaPDF';
import type { BoletaPDFData } from '../../lib/boletaPDF';

/* ═══════════════════════════════════════════════════
   DESCARGAR BOLETAS — Consulta por cédula + PDF
   Liviano, rápido, perfecto en móviles
═══════════════════════════════════════════════════ */

interface BoletaData {
  id: string;
  numero: number;
  estado: string;
  qr_url: string;
  barcode: string;
  imagen_url?: string | null;
  bloqueo_hasta?: string | null;
  venta_id?: string | null;
  estado_venta?: string | null;
  precio_boleta: number;
  total_pagado: number;
  saldo_pendiente: number;
}

interface RifaGroup {
  rifa_id: string;
  rifa_nombre: string;
  precio_boleta: number;
  fecha_sorteo: string;
  premio_principal: string;
  boletas: BoletaData[];
}

interface ClienteData {
  nombre: string;
  telefono: string;
  identificacion: string;
  email?: string | null;
}

interface ApiResponse {
  success: boolean;
  data: {
    cliente: ClienteData | null;
    rifas: RifaGroup[];
    total_boletas: number;
  };
  message?: string;
}

const API_BASE = 'https://rifas-backend-production.up.railway.app/api';
const PUBLIC_API_KEY = 'pk_4f9a8c7e2d1b6a9f3c0d5e7f8a2b4c6d';

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function padNum(n: number) {
  return n.toString().padStart(4, '0');
}

function getEstadoStyle(estado: string) {
  const e = estado.toUpperCase().trim();
  if (e === 'PAGADA' || e === 'VENDIDA')
    return { label: 'PAGADA', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', icon: 'fa-check-circle' };
  if (e === 'ABONADA')
    return { label: 'ABONADA', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: 'fa-coins' };
  if (e === 'RESERVADA')
    return { label: 'RESERVADA', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', icon: 'fa-clock' };
  if (e === 'CANCELADA')
    return { label: 'CANCELADA', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: 'fa-times-circle' };
  return { label: 'DISPONIBLE', bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', icon: 'fa-ticket-alt' };
}

export default function DescargarBoletasPage() {
  const [identificacion, setIdentificacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [rifas, setRifas] = useState<RifaGroup[]>([]);
  const [totalBoletas, setTotalBoletas] = useState(0);
  const [consultado, setConsultado] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const consultarBoletas = async () => {
    const cedula = identificacion.trim().replace(/\D/g, '');
    if (!cedula) { setError('Ingresa un número de cédula válido'); return; }
    try {
      setLoading(true);
      setError(null);
      setConsultado(false);
      const res = await fetch(`${API_BASE}/public/cliente/${encodeURIComponent(cedula)}/boletas`, {
        headers: { 'Content-Type': 'application/json', 'x-api-key': PUBLIC_API_KEY },
      });
      const data: ApiResponse = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se encontraron boletas para esta cédula');
      setCliente(data.data.cliente);
      setRifas(data.data.rifas);
      setTotalBoletas(data.data.total_boletas);
      setConsultado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setCliente(null);
      setRifas([]);
      setTotalBoletas(0);
      setConsultado(true);
    } finally {
      setLoading(false);
    }
  };

  const toPDFData = useCallback((boleta: BoletaData, rifa: RifaGroup): BoletaPDFData => ({
    numero: boleta.numero,
    estado: boleta.estado,
    qr_url: boleta.qr_url,
    barcode: boleta.barcode,
    precio_boleta: boleta.precio_boleta,
    total_pagado: boleta.total_pagado,
    saldo_pendiente: boleta.saldo_pendiente,
    rifaNombre: rifa.rifa_nombre,
    fechaSorteo: rifa.fecha_sorteo,
    premio: rifa.premio_principal,
    clienteNombre: cliente?.nombre ?? 'N/A',
    clienteIdentificacion: cliente?.identificacion ?? '',
    imagenUrl: boleta.imagen_url || null,
  }), [cliente]);

  const handleDownloadOne = useCallback(async (boleta: BoletaData, rifa: RifaGroup) => {
    setDownloadingId(boleta.id);
    try { await descargarBoletaPDF(toPDFData(boleta, rifa)); }
    catch (err) { console.error('Error PDF:', err); alert('Error al generar el PDF.'); }
    finally { setDownloadingId(null); }
  }, [toPDFData]);

  const handleDownloadAll = useCallback(async () => {
    if (!cliente) return;
    setDownloadingAll(true);
    try {
      const all: BoletaPDFData[] = [];
      for (const rifa of rifas) for (const b of rifa.boletas) all.push(toPDFData(b, rifa));
      await descargarTodasPDF(all, cliente.nombre, cliente.identificacion);
    } catch (err) { console.error('Error PDF:', err); alert('Error al generar el PDF.'); }
    finally { setDownloadingAll(false); }
  }, [rifas, cliente, toPDFData]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0A0A0C] to-[#111113]">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#111113]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/uploads/logos/Logo-principal.png" alt="El Gran Camión" width={32} height={32} className="rounded-lg" />
            <span className="text-lg tracking-wider text-white uppercase" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>EL GRAN CAMIÓN</span>
          </Link>
          <Link href="/boletas" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E63946] text-white text-[11px] font-bold hover:bg-[#d32f3c] transition-all">
            <i className="fas fa-shopping-cart text-[9px]" /> COMPRAR
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* HEADER */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946] text-[10px] font-bold uppercase tracking-widest mb-3">
            <i className="fas fa-file-pdf text-[8px]" /> MIS BOLETAS
          </div>
          <h1 className="text-3xl sm:text-4xl tracking-wider uppercase text-white mb-2" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
            DESCARGA TUS BOLETAS
          </h1>
          <p className="text-white/40 text-xs max-w-sm mx-auto">Ingresa tu cédula para descargar tus boletas en PDF</p>
        </div>

        {/* SEARCH */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-[#1A1A1E] rounded-2xl border border-white/[0.08] p-4 sm:p-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <i className="fas fa-id-card absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs" />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Número de cédula..."
                  value={identificacion}
                  onChange={(e) => setIdentificacion(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') consultarBoletas(); }}
                  className="w-full pl-9 pr-3 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white text-base font-mono font-semibold placeholder:text-white/15 focus:outline-none focus:border-[#E63946]/40 focus:ring-2 focus:ring-[#E63946]/10 transition-all tracking-wider"
                  autoFocus
                />
              </div>
              <button
                onClick={consultarBoletas}
                disabled={loading || !identificacion.trim()}
                className="px-4 py-3 rounded-xl bg-[#E63946] text-white text-sm font-bold hover:bg-[#d32f3c] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-search text-xs" />}
              </button>
            </div>
            {error && (
              <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-red-400 text-xs" />
                <p className="text-red-300 text-xs font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* NO RESULTS */}
        {consultado && totalBoletas === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <h2 className="text-xl tracking-wider uppercase text-white mb-2" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>SIN BOLETAS</h2>
            <p className="text-white/40 text-xs mb-4">No se encontraron boletas para la cédula <strong className="text-white/60">{identificacion}</strong></p>
            <Link href="/boletas" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#E63946] text-white text-[12px] font-bold hover:bg-[#d32f3c] transition-all">
              <i className="fas fa-shopping-cart text-[10px]" /> COMPRAR BOLETAS
            </Link>
          </div>
        )}

        {/* RESULTS */}
        {consultado && totalBoletas > 0 && (
          <>
            {/* Client info + Download All */}
            <div className="bg-[#1A1A1E] rounded-2xl border border-white/[0.08] p-4 sm:p-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-user-check text-green-400" />
                  </div>
                  <div>
                    {cliente && <h2 className="text-base font-bold text-white">{cliente.nombre}</h2>}
                    {cliente && <p className="text-white/40 text-[11px]">CC. {cliente.identificacion}</p>}
                    <p className="text-white/30 text-[10px]">{totalBoletas} boleta{totalBoletas > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadAll}
                  disabled={downloadingAll}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#E63946] text-white rounded-xl text-[12px] font-bold hover:bg-[#d32f3c] disabled:opacity-50 transition-all shadow-lg shadow-[#E63946]/20 whitespace-nowrap"
                >
                  {downloadingAll
                    ? <><i className="fas fa-spinner fa-spin text-xs" /> Generando PDF...</>
                    : <><i className="fas fa-file-pdf text-xs" /> DESCARGAR TODAS ({totalBoletas})</>}
                </button>
              </div>
            </div>

            {/* Rifas + Boletas */}
            {rifas.map((rifa) => (
              <div key={rifa.rifa_id} className="mb-6">
                <div className="bg-[#1A1A1E] rounded-t-xl border border-white/[0.08] border-b-0 px-4 py-3">
                  <h2 className="text-base tracking-wider uppercase text-white" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                    <i className="fas fa-ticket-alt text-[#FFB703] text-xs mr-1.5" />{rifa.rifa_nombre}
                  </h2>
                  <div className="flex flex-wrap gap-3 text-[10px] text-white/40 mt-1">
                    {rifa.premio_principal && <span><i className="fas fa-trophy text-[#FFB703] text-[8px] mr-1" />{rifa.premio_principal}</span>}
                    <span><i className="fas fa-calendar text-[8px] mr-1" />{new Date(rifa.fecha_sorteo).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <span><i className="fas fa-tag text-[8px] mr-1" />{formatCOP(rifa.precio_boleta)}</span>
                  </div>
                </div>

                <div className="bg-[#111113] rounded-b-xl border border-white/[0.08] border-t-0 p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rifa.boletas.map((boleta) => {
                      const est = getEstadoStyle(boleta.estado);
                      return (
                        <div key={boleta.id} className={`flex items-center gap-3 p-3 rounded-xl border ${est.border} bg-white/[0.02] hover:bg-white/[0.04] transition-all`}>
                          <div className="flex-shrink-0 text-center min-w-[60px]">
                            <div className="text-xl font-black text-white tracking-wider" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                              #{padNum(boleta.numero)}
                            </div>
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold ${est.bg} ${est.text}`}>
                              <i className={`fas ${est.icon} text-[6px]`} />{est.label}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 text-[10px] text-white/30">
                            {boleta.saldo_pendiente > 0
                              ? <span className="text-amber-400">Saldo: {formatCOP(boleta.saldo_pendiente)}</span>
                              : <span className="text-green-400">✓ Pago completo</span>}
                          </div>
                          <button
                            onClick={() => handleDownloadOne(boleta, rifa)}
                            disabled={downloadingId === boleta.id}
                            className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/[0.08] border border-white/10 flex items-center justify-center text-white hover:bg-white/[0.15] hover:border-white/20 disabled:opacity-40 transition-all"
                            title="Descargar PDF"
                          >
                            {downloadingId === boleta.id
                              ? <i className="fas fa-spinner fa-spin text-[10px]" />
                              : <i className="fas fa-file-pdf text-xs text-[#E63946]" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            <div className="text-center py-4">
              <p className="text-white/20 text-[11px]">🍀 ¡Buena suerte! · <Link href="/boletas" className="text-[#E63946] hover:underline">Comprar más boletas</Link></p>
            </div>
          </>
        )}

        {/* INITIAL STATE */}
        {!consultado && !loading && (
          <div className="text-center py-10">
            <div className="max-w-xs mx-auto space-y-4">
              <div className="text-4xl opacity-20">🎫</div>
              <div className="space-y-2 text-white/20 text-[11px]">
                {[
                  { icon: 'fa-search', text: 'Ingresa tu cédula' },
                  { icon: 'fa-eye', text: 'Ve el estado de tus boletas' },
                  { icon: 'fa-file-pdf', text: 'Descárgalas en PDF' },
                ].map((i) => (
                  <div key={i.text} className="flex items-center gap-2 justify-center">
                    <i className={`fas ${i.icon} text-[9px]`} /><span>{i.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="border-t border-white/[0.06] bg-[#111113]/80 backdrop-blur-xl py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-5 text-white/30 text-[10px]">
          <Link href="/" className="hover:text-white/60 transition-colors"><i className="fas fa-home mr-1" /> Inicio</Link>
          <Link href="/boletas" className="hover:text-white/60 transition-colors"><i className="fas fa-shopping-cart mr-1" /> Comprar</Link>
          <Link href="/verificar" className="hover:text-white/60 transition-colors"><i className="fas fa-qrcode mr-1" /> Verificar</Link>
          <span className="text-[#E63946]"><i className="fas fa-download mr-1" /> Descargar</span>
        </div>
      </div>
    </main>
  );
}
