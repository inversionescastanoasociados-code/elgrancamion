'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CAMION_PRINCIPAL, GRAN_PREMIO_DATE } from '@/lib/prizeAssets';

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    const tick = () => setTimeLeft(getTimeLeft(GRAN_PREMIO_DATE));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section id="inicio" className="relative min-h-screen flex flex-col lg:flex-row bg-[#0e0e10]">
      {/* Imagen */}
      <div className="relative w-full lg:w-[64%] min-h-[52vh] sm:min-h-[60vh] lg:min-h-screen">
        <Image
          src={CAMION_PRINCIPAL}
          alt="Camión FVR — Premio Mayor"
          fill
          className="object-cover object-center"
          sizes="(min-width: 1024px) 64vw, 100vw"
          priority
          quality={95}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#0e0e10]/90" />

        {/* Badge sobre la foto — visible en móvil */}
        <div className="absolute bottom-5 left-5 right-5 lg:hidden z-10">
          <div className="rounded-xl bg-black/60 backdrop-blur-md border border-[#FFB703]/40 px-4 py-3">
            <p
              className="text-lg uppercase text-white leading-tight"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              Camión FVR <span className="text-[#FFB703]">+</span> Kia Picanto 0km
            </p>
            <p className="text-[#FFB703] text-sm font-bold uppercase tracking-wider mt-1">
              Sorteo 3 de octubre
            </p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="relative flex-1 flex items-center px-6 sm:px-10 py-12 lg:py-16 lg:pl-8 lg:pr-12">
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-truck-red mb-4">
            2da Rifa 2026
          </p>

          <h1
            className="text-[clamp(52px,10vw,88px)] leading-[0.9] uppercase tracking-wide text-white"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            Premio
            <span className="block text-truck-red">Mayor</span>
          </h1>

          {/* Premios destacados */}
          <div className="mt-6 relative rounded-2xl overflow-hidden border border-[#FFB703]/40 bg-gradient-to-br from-[#FFB703]/15 via-[#E63946]/10 to-transparent p-5 sm:p-6 shadow-lg shadow-[#FFB703]/10">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFB703] via-[#FFD700] to-[#FFB703]" />
            <p className="text-[10px] font-black tracking-[0.25em] uppercase text-[#FFB703] mb-2">
              <i className="fas fa-trophy text-[9px] mr-1" /> Gana el 3 de octubre
            </p>
            <p
              className="text-[clamp(28px,5vw,42px)] leading-[0.95] uppercase tracking-wide text-white"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              Camión <span className="text-truck-red">FVR</span>
              <span className="text-[#FFB703] mx-1.5">+</span>
              Kia Picanto <span className="text-[#FFB703]">0km</span>
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-full shadow-md shadow-[#E63946]/30">
              <i className="fas fa-calendar-day text-sm" />
              <span
                className="text-[clamp(18px,3vw,24px)] uppercase tracking-wider leading-none"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                Sorteo 3 de octubre
              </span>
            </div>
          </div>

          <p className="mt-4 text-[13px] text-white/45">
            Anticipado Hyundai i10 · <span className="text-[#25D366] font-medium">12 de agosto</span>
            <span className="mx-2 text-white/20">·</span>
            Boleta <span className="text-white font-semibold">$130.000</span>
          </p>

          {/* Countdown — gran premio */}
          <p className="mt-6 text-[10px] font-bold tracking-[0.2em] uppercase text-[#FFB703]/80">
            Cuenta regresiva — 3 de octubre
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2 max-w-[300px]">
            {[
              { v: mounted ? pad(timeLeft.days) : '--', l: 'Días' },
              { v: mounted ? pad(timeLeft.hours) : '--', l: 'Hrs' },
              { v: mounted ? pad(timeLeft.minutes) : '--', l: 'Min' },
              { v: mounted ? pad(timeLeft.seconds) : '--', l: 'Seg' },
            ].map(({ v, l }) => (
              <div key={l} className="text-center rounded-xl bg-white/[0.06] border border-[#FFB703]/20 py-2.5">
                <div
                  className="text-2xl sm:text-3xl text-[#FFD700] tabular-nums"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  {v}
                </div>
                <div className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">{l}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <a href="/boletas" className="btn-primary text-[14px] px-8 py-4 justify-center flex-1 sm:flex-none">
              <i className="fas fa-ticket" />
              Comprar boleta
            </a>
            <a
              href="#anticipado"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full text-[13px] font-semibold text-white/70 border border-white/15 hover:bg-white/5 transition-colors"
            >
              Ver anticipado
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
