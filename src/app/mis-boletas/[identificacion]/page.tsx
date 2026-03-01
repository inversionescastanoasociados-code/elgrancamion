'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import BoletaTicket from '../../../components/BoletaTicket';

/* ═══════════════════════════════════════════════════
   MIS BOLETAS — Acceso directo por cédula en URL
   URL: /mis-boletas/{cedula}
   Ideal para enviar por WhatsApp
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
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function MisBoletasPage() {
  const params = useParams();
  const identificacion = params.identificacion as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [rifas, setRifas] = useState<RifaGroup[]>([]);
  const [totalBoletas, setTotalBoletas] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    const fetchBoletas = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_BASE}/public/cliente/${encodeURIComponent(identificacion)}/boletas`,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': PUBLIC_API_KEY,
            },
          }
        );

        const data: ApiResponse = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Error al consultar boletas');
        }

        setCliente(data.data.cliente);
        setRifas(data.data.rifas);
        setTotalBoletas(data.data.total_boletas);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (identificacion) fetchBoletas();
  }, [identificacion]);

  const descargarBoleta = useCallback(async (boleta: BoletaData, cc: string) => {
    setDownloadingId(boleta.id);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const el = document.getElementById(`boleta-${boleta.id}`) as HTMLElement;
      if (!el) return;

      const canvas = await html2canvas(el, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      const link = document.createElement('a');
      const num = boleta.numero.toString().padStart(4, '0');
      link.download = `boleta_${num}_CC_${cc.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error descargando boleta:', err);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const descargarTodas = useCallback(async () => {
    if (!cliente) return;
    setDownloadingAll(true);
    const cc = cliente.identificacion || 'SIN_CC';
    try {
      for (const rifa of rifas) {
        for (const boleta of rifa.boletas) {
          await descargarBoleta(boleta, cc);
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    } finally {
      setDownloadingAll(false);
    }
  }, [rifas, cliente, descargarBoleta]);

  // ─── Loading state ───────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0A0A0C] to-[#111113] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#E63946]/20 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-spinner fa-spin text-[#E63946] text-2xl" />
          </div>
          <p className="text-white/40 text-sm">Cargando tus boletas...</p>
        </div>
      </main>
    );
  }

  // ─── Error state ─────────────────────────────────────
  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0A0A0C] to-[#111113] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <h2
            className="text-2xl tracking-wider uppercase text-white mb-3"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            ERROR
          </h2>
          <p className="text-white/40 text-sm mb-6">{error}</p>
          <Link
            href="/descargar-boletas"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E63946] text-white text-[13px] font-bold hover:bg-[#d32f3c] transition-all"
          >
            <i className="fas fa-search text-xs" />
            BUSCAR CON OTRA CÉDULA
          </Link>
        </div>
      </main>
    );
  }

  // ─── Empty state ─────────────────────────────────────
  if (totalBoletas === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0A0A0C] to-[#111113] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📭</div>
          <h2
            className="text-2xl tracking-wider uppercase text-white mb-3"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            SIN BOLETAS
          </h2>
          <p className="text-white/40 text-sm mb-6">
            No se encontraron boletas para la cédula <strong className="text-white/60">{identificacion}</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/boletas"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E63946] text-white text-[13px] font-bold hover:bg-[#d32f3c] transition-all"
            >
              <i className="fas fa-shopping-cart text-xs" />
              COMPRAR BOLETAS
            </Link>
            <Link
              href="/descargar-boletas"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-white/50 text-[13px] font-bold hover:border-white/20 hover:text-white/70 transition-all"
            >
              <i className="fas fa-search text-xs" />
              BUSCAR CON OTRA CÉDULA
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ─── Results ─────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0A0A0C] to-[#111113]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#111113]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/uploads/logos/Logo-principal.png"
              alt="El Gran Camión"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span
              className="text-xl tracking-wider text-white uppercase"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              MIS BOLETAS
            </span>
          </Link>
          <Link
            href="/boletas"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E63946] text-white text-[12px] font-bold hover:bg-[#d32f3c] transition-all"
          >
            <i className="fas fa-shopping-cart text-[10px]" />
            COMPRAR MÁS
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Client info */}
        <div className="bg-gradient-to-br from-[#1A1A1E] to-[#16161A] rounded-2xl border border-white/[0.08] p-5 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-user-check text-green-400 text-lg" />
              </div>
              <div>
                {cliente && (
                  <>
                    <h2 className="text-lg font-bold text-white">{cliente.nombre}</h2>
                    <p className="text-white/40 text-[12px]">
                      CC. {cliente.identificacion} · Tel. {cliente.telefono}
                    </p>
                  </>
                )}
                <p className="text-white/30 text-[11px] mt-0.5">
                  {totalBoletas} boleta{totalBoletas > 1 ? 's' : ''} encontrada{totalBoletas > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <button
              onClick={descargarTodas}
              disabled={downloadingAll}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#E63946] text-white rounded-xl text-[13px] font-bold hover:bg-[#d32f3c] disabled:opacity-50 transition-all shadow-lg shadow-[#E63946]/20"
            >
              {downloadingAll ? (
                <>
                  <i className="fas fa-spinner fa-spin text-sm" />
                  Descargando...
                </>
              ) : (
                <>
                  <i className="fas fa-download text-sm" />
                  DESCARGAR TODAS ({totalBoletas})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Rifas */}
        {rifas.map((rifa) => (
          <div key={rifa.rifa_id} className="mb-10">
            <div className="bg-gradient-to-r from-[#1A1A1E] to-[#222228] rounded-t-2xl border border-white/[0.08] border-b-0 px-6 py-4">
              <h2
                className="text-xl tracking-wider uppercase text-white mb-2"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                <i className="fas fa-ticket-alt text-[#FFB703] text-sm mr-2" />
                {rifa.rifa_nombre}
              </h2>
              <div className="flex flex-wrap gap-4 text-[12px] text-white/40">
                <span>
                  <i className="fas fa-trophy text-[#FFB703] text-[10px] mr-1" />
                  {rifa.premio_principal}
                </span>
                <span>
                  <i className="fas fa-calendar text-[10px] mr-1" />
                  {new Date(rifa.fecha_sorteo).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <span>
                  <i className="fas fa-tag text-[10px] mr-1" />
                  {formatCOP(rifa.precio_boleta)}
                </span>
              </div>
            </div>

            <div className="bg-[#111113] rounded-b-2xl border border-white/[0.08] border-t-0 p-4 sm:p-6">
              <div className="space-y-8">
                {rifa.boletas.map((boleta) => (
                  <div key={boleta.id}>
                    <div className="overflow-x-auto rounded-xl">
                      <div id={`boleta-${boleta.id}`}>
                        <BoletaTicket
                          qrUrl={boleta.qr_url}
                          barcode={boleta.barcode}
                          numero={boleta.numero}
                          imagenUrl={boleta.imagen_url}
                          rifaNombre={rifa.rifa_nombre}
                          estado={boleta.estado}
                          clienteInfo={
                            cliente
                              ? {
                                  nombre: cliente.nombre,
                                  identificacion: cliente.identificacion,
                                }
                              : null
                          }
                          deuda={boleta.saldo_pendiente > 0 ? boleta.saldo_pendiente : null}
                          reservadaHasta={boleta.bloqueo_hasta}
                          precio={boleta.precio_boleta}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 px-1">
                      <div className="text-[12px]">
                        {boleta.saldo_pendiente > 0 ? (
                          <span className="text-amber-400 font-medium">
                            <i className="fas fa-exclamation-triangle text-[10px] mr-1" />
                            Saldo: {formatCOP(boleta.saldo_pendiente)}
                          </span>
                        ) : (
                          <span className="text-green-400 font-medium">
                            <i className="fas fa-check-circle text-[10px] mr-1" />
                            Pago completo
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => descargarBoleta(boleta, cliente?.identificacion || 'SIN_CC')}
                        disabled={downloadingId === boleta.id}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.08] border border-white/10 text-white rounded-xl text-[12px] font-bold hover:bg-white/[0.15] hover:border-white/20 disabled:opacity-50 transition-all"
                      >
                        {downloadingId === boleta.id ? (
                          <>
                            <i className="fas fa-spinner fa-spin text-[10px]" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-download text-[10px]" />
                            Descargar PNG
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="text-center py-6">
          <p className="text-white/20 text-[12px]">
            🍀 ¡Buena suerte en el sorteo! · <Link href="/boletas" className="text-[#E63946] hover:underline">Comprar más boletas</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
