'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/* ═══════════════════════════════════════════════════
   VERIFICADOR DE BOLETAS POR QR / HASH
   Endpoint público — Sin autenticación
   Rate limit: 30 req / 5 min por IP
═══════════════════════════════════════════════════ */

const API_BASE = 'https://rifas-backend-production.up.railway.app';

type VerificationState = 'idle' | 'scanning' | 'loading' | 'success' | 'error' | 'not-found';

interface BoletaData {
  numero: string;
  estado: string;
  comprador?: string;
  fecha_compra?: string;
  rifa?: string;
  hash?: string;
  verificado: boolean;
}

/* ═══ Format helper ═══ */
function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

/* ═══ Extract hash from QR URL or raw text ═══ */
function extractHash(input: string): string | null {
  // Try to extract hash from URL pattern: ...?hash=XXXX or .../verificar/XXXX
  const urlPatterns = [
    /[?&]hash=([a-fA-F0-9]{32,64})/,
    /[?&]h=([a-fA-F0-9]{32,64})/,
    /\/verificar\/([a-fA-F0-9]{32,64})/,
    /\/verify\/([a-fA-F0-9]{32,64})/,
  ];
  for (const pattern of urlPatterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  // If it looks like a plain hex hash
  const hexMatch = input.trim().match(/^[a-fA-F0-9]{32,64}$/);
  if (hexMatch) return hexMatch[0];
  return null;
}

export default function VerificadorBoleta() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>('idle');
  const [hashInput, setHashInput] = useState('');
  const [boletaData, setBoletaData] = useState<BoletaData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if hash came from URL (?hash=xxx)
    const urlHash = searchParams.get('hash') || searchParams.get('h') || '';
    if (urlHash && /^[a-fA-F0-9]{32,64}$/.test(urlHash)) {
      setHashInput(urlHash);
      verifyHash(urlHash);
    }
    return () => stopScanner();
  }, []);

  /* ═══ VERIFY HASH — Navigate to dynamic route ═══ */
  const verifyHash = useCallback(async (hash: string) => {
    if (!hash || hash.length < 32) {
      setErrorMsg('El hash debe tener al menos 32 caracteres hexadecimales.');
      setState('error');
      return;
    }
    // Navigate to the dynamic verification route
    window.location.href = `/verificar/${hash}`;
  }, []);

  /* ═══ QR SCANNER — using native BarcodeDetector or canvas ═══ */
  async function startScanner() {
    setCameraError('');
    setIsScanning(true);
    setState('scanning');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Try BarcodeDetector API (Chrome, Edge, newer Safari)
      if ('BarcodeDetector' in window) {
        // @ts-ignore
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState !== 4) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const raw = barcodes[0].rawValue;
              const hash = extractHash(raw);
              if (hash) {
                stopScanner();
                setHashInput(hash);
                verifyHash(hash);
              }
            }
          } catch {}
        }, 300);
      } else {
        // Fallback: use canvas + basic scan attempt
        setCameraError('Tu navegador no soporta lectura automática de QR. Puedes ingresar el código manualmente o usar la cámara de tu celular para leer el QR.');
        // Keep camera open so user can see what the QR says and type it
      }
    } catch (err: any) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Habilita la cámara en la configuración del navegador.'
          : 'No se pudo acceder a la cámara. Intenta desde un dispositivo móvil.'
      );
      setIsScanning(false);
      setState('idle');
    }
  }

  function stopScanner() {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    if (state === 'scanning') setState('idle');
  }

  /* ═══ HANDLE MANUAL SUBMIT ═══ */
  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hash = extractHash(hashInput);
    if (hash) {
      setHashInput(hash);
      verifyHash(hash);
    } else {
      setErrorMsg('Ingresa un hash válido (32-64 caracteres hexadecimales) o la URL del QR.');
      setState('error');
    }
  }

  /* ═══ RESET ═══ */
  function reset() {
    setState('idle');
    setHashInput('');
    setBoletaData(null);
    setErrorMsg('');
    setCameraError('');
    stopScanner();
  }

  const isHome = typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '');

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
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
            <Link href="/boletas" className="text-[12px] font-bold text-truck-red hover:text-red-700 tracking-wide transition-colors hidden sm:block">
              <i className="fas fa-store text-[10px] mr-1" />
              Tienda
            </Link>
            <Link href="/" className="btn-secondary text-[11px] px-4 py-2 !border-black/10">
              <i className="fas fa-home text-[10px]" />
              Inicio
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════ HERO SECTION ══════ */}
      <section className="dark-section relative overflow-hidden">
        <Image
          src="/uploads/camion/principal.jpeg"
          alt="Verificar Boleta"
          fill
          className="object-cover opacity-30"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111113]/80 via-[#111113]/90 to-[#111113]" />
        <div className="relative z-10 max-w-[800px] mx-auto px-6 pt-20 pb-16 text-center">
          {/* Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/[0.06] border border-white/10">
            <i className="fas fa-qrcode text-3xl text-truck-red" />
          </div>

          {/* Badge */}
          <div className="mb-5">
            <span className="pill pill-red">
              <i className="fas fa-shield-halved text-[9px]" /> Verificación Oficial
            </span>
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
            <span className="block text-[clamp(36px,6vw,64px)] leading-[0.9] tracking-[2px] text-white">
              VERIFICA TU
            </span>
            <span className="block text-[clamp(36px,6vw,64px)] leading-[0.9] tracking-[2px] text-truck-red">
              BOLETA
            </span>
          </h1>

          <p className="mt-5 text-[15px] text-white/60 max-w-[50ch] mx-auto leading-relaxed">
            Escanea el código QR de tu boleta o ingresa el código de verificación para confirmar su autenticidad.
          </p>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-[11px] text-white/40">
            <span><i className="fas fa-shield-halved text-[10px] mr-1 text-truck-red/60" /> Verificación inmediata</span>
            <span><i className="fas fa-lock text-[10px] mr-1 text-truck-red/60" /> Conexión segura</span>
            <span><i className="fas fa-fingerprint text-[10px] mr-1 text-truck-red/60" /> HMAC-SHA256</span>
          </div>
        </div>
      </section>

      {/* ══════ MAIN CONTENT ══════ */}
      <section className="relative z-10 -mt-8 pb-20">
        <div className="max-w-[700px] mx-auto px-6">

          {/* ── VERIFICATION CARD ── */}
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-black/[0.04] overflow-hidden">

            {/* Card Header */}
            <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-black/[0.04]">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-full bg-truck-red/10 flex items-center justify-center">
                  <i className="fas fa-search text-truck-red text-[13px]" />
                </div>
                <h2 className="text-[18px] font-bold text-[#1A1A1A] tracking-tight">
                  Verificar Boleta
                </h2>
              </div>
              <p className="text-[13px] text-[#888] ml-11">
                Escanea el QR o pega el código de verificación
              </p>
            </div>

            {/* Card Body */}
            <div className="px-6 sm:px-8 py-7">

              {/* ── STATE: IDLE / SCANNING / ERROR INPUT ── */}
              {(state === 'idle' || state === 'scanning' || state === 'error') && (
                <div className="space-y-6">

                  {/* QR Scanner Area */}
                  {isScanning ? (
                    <div className="relative">
                      <div className="relative w-full aspect-square max-w-[320px] mx-auto rounded-xl overflow-hidden bg-black border-2 border-truck-red/20">
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                        <canvas ref={canvasRef} className="hidden" />
                        {/* Scanner overlay corners */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-4 left-4 w-12 h-12 border-t-3 border-l-3 border-truck-red rounded-tl-lg" style={{ borderWidth: '3px 0 0 3px' }} />
                          <div className="absolute top-4 right-4 w-12 h-12 border-t-3 border-r-3 border-truck-red rounded-tr-lg" style={{ borderWidth: '3px 3px 0 0' }} />
                          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-3 border-l-3 border-truck-red rounded-bl-lg" style={{ borderWidth: '0 0 3px 3px' }} />
                          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-3 border-r-3 border-truck-red rounded-br-lg" style={{ borderWidth: '0 3px 3px 0' }} />
                          {/* Scan line animation */}
                          <div className="absolute left-6 right-6 h-[2px] bg-truck-red/80 shadow-[0_0_10px_rgba(230,57,70,0.6)] scan-line" />
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-[12px] text-[#888]">Apunta la cámara al código QR de tu boleta</p>
                        <button
                          onClick={stopScanner}
                          className="mt-3 text-[13px] font-semibold text-truck-red hover:text-red-700 transition-colors"
                        >
                          <i className="fas fa-times mr-1" /> Cerrar cámara
                        </button>
                      </div>
                      {cameraError && (
                        <div className="mt-3 p-3 bg-warning-yellow/10 border border-warning-yellow/20 rounded-lg text-[12px] text-[#866100] text-center">
                          <i className="fas fa-exclamation-triangle mr-1" /> {cameraError}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Scanner Button */
                    <button
                      onClick={startScanner}
                      className="w-full group relative overflow-hidden rounded-xl border-2 border-dashed border-black/10 hover:border-truck-red/30 bg-[#FAFAFA] hover:bg-truck-red/[0.02] transition-all duration-300 py-10"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-truck-red/8 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <i className="fas fa-qrcode text-2xl text-truck-red" />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-[#1A1A1A]">Escanear Código QR</p>
                          <p className="text-[12px] text-[#999] mt-0.5">Usa la cámara de tu dispositivo</p>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-black/[0.06]" />
                    <span className="text-[11px] font-bold text-[#BBB] tracking-wider uppercase">o ingresa el código</span>
                    <div className="flex-1 h-px bg-black/[0.06]" />
                  </div>

                  {/* Manual Input */}
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-2 tracking-wide uppercase">
                        Código de verificación (Hash)
                      </label>
                      <div className="relative">
                        <i className="fas fa-fingerprint absolute left-4 top-1/2 -translate-y-1/2 text-[#CCC] text-[14px]" />
                        <input
                          type="text"
                          value={hashInput}
                          onChange={(e) => { setHashInput(e.target.value); if (state === 'error') setState('idle'); }}
                          placeholder="ej: a1b2c3d4e5f6789012345678abcdef01"
                          className="w-full pl-11 pr-4 py-3.5 bg-[#F8F8F8] border border-black/[0.08] rounded-xl text-[14px] text-[#333] placeholder:text-[#CCC] focus:outline-none focus:ring-2 focus:ring-truck-red/20 focus:border-truck-red/30 transition-all font-mono"
                          spellCheck={false}
                          autoComplete="off"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#AAA]">
                        Pega el hash, la URL del QR o el código de 32 caracteres
                      </p>
                    </div>

                    {/* Error message */}
                    {state === 'error' && errorMsg && (
                      <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                        <i className="fas fa-circle-exclamation text-truck-red text-[14px] mt-0.5" />
                        <p className="text-[13px] text-red-700 leading-snug">{errorMsg}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!hashInput.trim()}
                      className="btn-primary w-full justify-center text-[14px] py-4 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <i className="fas fa-search" />
                      VERIFICAR BOLETA
                    </button>
                  </form>
                </div>
              )}

              {/* ── STATE: LOADING ── */}
              {state === 'loading' && (
                <div className="py-16 text-center">
                  <div className="verify-spinner mx-auto mb-5" />
                  <p className="text-[15px] font-semibold text-[#1A1A1A]">Verificando boleta...</p>
                  <p className="text-[12px] text-[#999] mt-1">Consultando en la base de datos</p>
                </div>
              )}

              {/* ── STATE: SUCCESS ── */}
              {state === 'success' && boletaData && (
                <div className="space-y-6 verify-result-enter">
                  {/* Status Banner */}
                  <div className={`p-5 rounded-xl border ${
                    boletaData.verificado
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                        boletaData.verificado ? 'bg-emerald-500' : 'bg-red-500'
                      }`}>
                        <i className={`fas ${boletaData.verificado ? 'fa-check' : 'fa-times'} text-white text-xl`} />
                      </div>
                      <div>
                        <h3 className={`text-[18px] font-bold ${boletaData.verificado ? 'text-emerald-800' : 'text-red-800'}`}>
                          {boletaData.verificado ? '¡Boleta Verificada!' : 'Boleta No Verificada'}
                        </h3>
                        <p className={`text-[13px] mt-0.5 ${boletaData.verificado ? 'text-emerald-600' : 'text-red-600'}`}>
                          {boletaData.verificado
                            ? 'Esta boleta es auténtica y está registrada en nuestro sistema'
                            : 'No pudimos verificar esta boleta. Contacta soporte.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Boleta Details Card */}
                  <div className="bg-[#FAFAFA] rounded-xl border border-black/[0.04] overflow-hidden">
                    {/* Number header */}
                    <div className="bg-[#111113] px-6 py-5 text-center">
                      <p className="text-[10px] font-bold tracking-[3px] uppercase text-white/40 mb-2">Número de Boleta</p>
                      <div className="text-[48px] font-black text-white tracking-[8px]" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                        {boletaData.numero}
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="p-5 space-y-3">
                      {[
                        { icon: 'fa-tag', label: 'Estado', value: boletaData.estado.charAt(0).toUpperCase() + boletaData.estado.slice(1), accent: true },
                        boletaData.comprador && { icon: 'fa-user', label: 'Comprador', value: boletaData.comprador },
                        boletaData.fecha_compra && { icon: 'fa-calendar', label: 'Fecha de Compra', value: new Date(boletaData.fecha_compra).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) },
                        boletaData.rifa && { icon: 'fa-trophy', label: 'Rifa', value: boletaData.rifa },
                      ].filter(Boolean).map((item: any, i) => (
                        <div key={i} className="flex items-center gap-3 py-2.5 border-b border-black/[0.04] last:border-0">
                          <div className="w-8 h-8 rounded-lg bg-truck-red/8 flex items-center justify-center flex-shrink-0">
                            <i className={`fas ${item.icon} text-truck-red text-[11px]`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-[#AAA] tracking-wide uppercase">{item.label}</p>
                            <p className={`text-[14px] font-semibold truncate ${item.accent ? 'text-emerald-600' : 'text-[#333]'}`}>
                              {item.value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Hash display */}
                    {boletaData.hash && (
                      <div className="px-5 pb-5">
                        <div className="bg-[#F0F0F0] rounded-lg p-3">
                          <p className="text-[10px] font-bold text-[#AAA] tracking-wider uppercase mb-1">Hash de Verificación</p>
                          <p className="text-[11px] font-mono text-[#666] break-all leading-relaxed">{boletaData.hash}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={reset}
                      className="btn-primary flex-1 justify-center text-[13px] py-3.5"
                    >
                      <i className="fas fa-qrcode" />
                      Verificar Otra
                    </button>
                    <Link
                      href="/boletas"
                      className="btn-secondary flex-1 justify-center text-[13px] py-3.5"
                    >
                      <i className="fas fa-ticket" />
                      Comprar Boletas
                    </Link>
                  </div>
                </div>
              )}

              {/* ── STATE: NOT FOUND ── */}
              {state === 'not-found' && (
                <div className="py-10 text-center verify-result-enter">
                  <div className="w-16 h-16 rounded-full bg-warning-yellow/10 flex items-center justify-center mx-auto mb-5">
                    <i className="fas fa-question text-warning-yellow text-2xl" />
                  </div>
                  <h3 className="text-[18px] font-bold text-[#1A1A1A]">Boleta no encontrada</h3>
                  <p className="text-[13px] text-[#888] mt-2 max-w-[40ch] mx-auto leading-relaxed">
                    No encontramos ninguna boleta con ese código de verificación. Revisa que el código sea correcto.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={reset} className="btn-primary text-[13px] px-8 py-3.5">
                      <i className="fas fa-redo" />
                      Intentar de Nuevo
                    </button>
                    <a
                      href="https://wa.me/573000000000?text=Hola%2C%20necesito%20ayuda%20verificando%20mi%20boleta"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-[13px] px-8 py-3.5"
                    >
                      <i className="fab fa-whatsapp" />
                      Contactar Soporte
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── HOW IT WORKS ── */}
          <div className="mt-12">
            <div className="text-center mb-8">
              <p className="text-[12px] font-bold tracking-[4px] uppercase text-[#AAA]">
                ── <span className="gradient-text-red">Cómo Funciona</span> ──
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { icon: 'fa-qrcode', title: 'Escanea el QR', desc: 'Apunta la cámara al código QR impreso en tu boleta' },
                { icon: 'fa-server', title: 'Verificamos', desc: 'Consultamos la boleta en nuestra base de datos segura' },
                { icon: 'fa-circle-check', title: 'Resultado', desc: 'Confirma que tu boleta es auténtica y está vigente' },
              ].map((step, i) => (
                <div key={i} className="bg-white rounded-xl border border-black/[0.04] p-5 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-truck-red/8 flex items-center justify-center mx-auto mb-3">
                    <i className={`fas ${step.icon} text-truck-red text-[16px]`} />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#F0F0F0] flex items-center justify-center mx-auto mb-3 text-[11px] font-bold text-[#999]">
                    {i + 1}
                  </div>
                  <h4 className="text-[14px] font-bold text-[#1A1A1A] mb-1">{step.title}</h4>
                  <p className="text-[12px] text-[#888] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECURITY INFO ── */}
          <div className="mt-10 bg-[#111113] rounded-2xl p-6 sm:p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <i className="fas fa-shield-halved text-truck-red text-lg" />
              <h3 className="text-[16px] font-bold text-white tracking-wide" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '2px' }}>
                SEGURIDAD GARANTIZADA
              </h3>
            </div>
            <p className="text-[13px] text-white/50 leading-relaxed max-w-[50ch] mx-auto">
              Cada boleta tiene un hash único generado con <span className="text-white/70 font-semibold">HMAC-SHA256</span>.
              Este código es irrepetible y garantiza que tu boleta es legítima.
              Toda verificación es <span className="text-white/70 font-semibold">pública y gratuita</span>.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-5 text-[11px] text-white/40">
              <span><i className="fas fa-bolt text-warning-yellow/60 mr-1" /> Verificación instantánea</span>
              <span><i className="fas fa-globe text-truck-red/60 mr-1" /> Sin registro requerido</span>
              <span><i className="fas fa-database text-truck-red/60 mr-1" /> Base de datos en tiempo real</span>
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="mt-10 text-center">
            <p className="text-[13px] text-[#888] mb-4">¿Aún no tienes tu boleta?</p>
            <Link href="/boletas" className="btn-primary text-[14px] px-10 py-4">
              <i className="fas fa-ticket" />
              COMPRAR MI BOLETA
            </Link>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER MINI ══════ */}
      <footer className="bg-[#111113] border-t border-white/[0.04] py-8">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <div className="relative w-10 h-10 mx-auto mb-3 opacity-40">
            <Image src="/uploads/logos/logo-blanco.png" alt="Logo" fill className="object-contain" sizes="40px" />
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
