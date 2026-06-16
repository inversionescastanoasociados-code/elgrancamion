'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'elgrancamion-whatsapp-banner-dismissed';

const WHATSAPP_LINES = [
  { num: '573117938512', display: '311 793 8512' },
  { num: '573122490402', display: '312 249 0402' },
  { num: '573137919267', display: '313 791 9267' },
  { num: '573207120779', display: '320 712 0779' },
] as const;

const DEFAULT_MESSAGE = 'Hola, quiero comprar una boleta de la Gran Rifa Camionera';

function waLink(num: string) {
  return `https://wa.me/${num}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;
}

export default function WhatsAppBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const close = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, '1');
  };

  if (!mounted || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-banner-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar anuncio"
        onClick={close}
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]"
      />

      {/* Card */}
      <div className="relative w-full max-w-lg animate-[modalPop_0.45s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-br from-[#25D366] via-[#FFB703] to-[#E63946] opacity-80 blur-[1px]" />

        <div className="relative overflow-hidden rounded-[27px] bg-gradient-to-br from-[#141418] via-[#111113] to-[#0D0D10] border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.55)]">
          {/* Glow accents */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-[#25D366]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-56 h-56 bg-[#E63946]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

          {/* Close */}
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.12] hover:border-white/20 transition-all"
          >
            <i className="fas fa-times text-sm" />
          </button>

          <div className="relative z-10 px-6 sm:px-8 pt-8 pb-6 sm:pb-7">
            {/* Header */}
            <div className="text-center mb-6 pr-6">
              <div className="inline-flex items-center gap-2 bg-[#25D366]/15 border border-[#25D366]/25 rounded-full px-4 py-1.5 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]" />
                </span>
                <span className="text-[10px] font-bold tracking-[2.5px] uppercase text-[#25D366]">
                  Atención inmediata
                </span>
              </div>

              <h2
                id="whatsapp-banner-title"
                className="text-3xl sm:text-4xl uppercase tracking-wider text-white mb-2"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                Líneas de{' '}
                <span className="bg-gradient-to-r from-[#25D366] to-[#128C7E] bg-clip-text text-transparent">
                  WhatsApp
                </span>
              </h2>
              <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed">
                Escríbenos por cualquiera de nuestras líneas y compra tu boleta al instante
              </p>
            </div>

            {/* Lines */}
            <div className="space-y-2.5">
              {WHATSAPP_LINES.map((line, i) => (
                <a
                  key={line.num}
                  href={waLink(line.num)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 sm:gap-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] px-4 py-3.5 hover:bg-[#25D366]/10 hover:border-[#25D366]/30 transition-all duration-200"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* WhatsApp icon */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-xl bg-[#25D366] blur-md opacity-0 group-hover:opacity-30 transition-opacity" />
                    <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/20 group-hover:scale-105 transition-transform">
                      <i className="fab fa-whatsapp text-white text-xl" />
                    </div>
                  </div>

                  {/* Number */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/30 mb-0.5">
                      Línea {i + 1}
                    </p>
                    <p
                      className="text-xl sm:text-2xl text-white tracking-[3px] truncate"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      {line.display}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#25D366]/15 border border-[#25D366]/25 text-[#25D366] text-[11px] font-bold uppercase tracking-wider group-hover:bg-[#25D366] group-hover:text-white group-hover:border-[#25D366] transition-all">
                    <span className="hidden sm:inline">Escribir</span>
                    <i className="fas fa-arrow-right text-[9px] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </a>
              ))}
            </div>

            {/* Footer note */}
            <p className="text-center text-white/25 text-[11px] mt-5">
              <i className="fas fa-clock text-[9px] mr-1" />
              Respuesta rápida · Boletas digitales al instante
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
