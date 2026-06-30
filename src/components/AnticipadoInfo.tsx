'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

import { ANTICIPADO_DATE } from '@/lib/prizeAssets';

function getTimeLeft(target: Date) {
  const now = new Date().getTime();
  const diff = target.getTime() - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function AnticipadoInfo() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft(ANTICIPADO_DATE));
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(ANTICIPADO_DATE));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="relative overflow-hidden bg-[#0D0D10]">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#E63946_0%,transparent_70%)] opacity-[0.04]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#FFB703_0%,transparent_60%)] opacity-[0.03]" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-20">

        {/* ═══ SECTION HEADER ═══ */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-[#FFB703]/10 border border-[#FFB703]/20 rounded-full px-5 py-2 mb-5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFB703] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFB703]" />
            </span>
            <span className="text-[11px] sm:text-[12px] font-bold tracking-[3px] uppercase text-[#FFB703]">
              Premio Anticipado — 2da Rifa
            </span>
          </div>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wider mb-3"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            ¡NO ESPERES AL{' '}
            <span className="bg-gradient-to-r from-[#FFB703] to-[#FFD700] bg-clip-text text-transparent">
              3 DE OCTUBRE!
            </span>
          </h2>
          <p className="text-white/40 text-sm sm:text-base max-w-xl mx-auto">
            Con la 2da rifa puedes ganar antes. El premio anticipado se juega el 15 de agosto con la lotería oficial.
          </p>
        </div>

        {/* ═══ TWO COLUMN LAYOUT ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

          {/* ── LEFT: Premio Anticipado ── */}
          <div className="space-y-6">

            {/* PREMIO CARD */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#25D366] to-[#FFB703] rounded-3xl opacity-20 blur-sm group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#1A1A20] to-[#12121A] border border-white/[0.08] rounded-3xl p-6 sm:p-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#25D366]/10 to-transparent rounded-bl-full" />

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-[#25D366]/15 border border-[#25D366]/25 rounded-full px-4 py-1.5 mb-5">
                    <span className="text-lg">🚗</span>
                    <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#25D366]">15 de agosto de 2026</span>
                  </div>

                  <h3
                    className="text-2xl sm:text-3xl uppercase tracking-wider mb-2"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    PREMIO{' '}
                    <span className="bg-gradient-to-r from-[#25D366] to-[#FFD700] bg-clip-text text-transparent">
                      PREMIO MAYOR
                    </span>
                  </h3>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span
                      className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      Hyundai i10 Attraction
                    </span>
                    <span className="text-[#25D366] text-sm font-bold uppercase">0km</span>
                  </div>

                  <p className="text-white/40 text-[13px] leading-relaxed mb-5">
                    Un <span className="text-white/60 font-bold">Hyundai i10 Attraction 0 kilómetros</span>, full equipo y papeles al día.
                    Si tu número sale el 15 de agosto y eres el dueño de la boleta, ¡te lo llevas antes del gran sorteo!
                  </p>

                  {/* Car visual */}
                  <div className="relative bg-black/30 border border-white/[0.06] rounded-2xl overflow-hidden mb-5 aspect-[16/9]">
                    <Image
                      src="/uploads/hyundai/hyundai_i10_color_2_d4fe2fcc76.webp"
                      alt="Hyundai i10 Attraction 0km — Premio anticipado"
                      fill
                      className="object-cover object-center"
                      sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <p className="text-[10px] font-bold tracking-[3px] uppercase text-white/70">
                        Hyundai i10 Attraction · 0km
                      </p>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="bg-black/30 border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-[10px] font-bold tracking-[3px] uppercase text-white/30 text-center mb-3">
                      Sorteo anticipado en
                    </p>
                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                      {[
                        { value: timeLeft.days, label: 'Días' },
                        { value: timeLeft.hours, label: 'Horas' },
                        { value: timeLeft.minutes, label: 'Min' },
                        { value: timeLeft.seconds, label: 'Seg' },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl py-2.5 sm:py-3 mb-1">
                            <span
                              className="text-xl sm:text-2xl font-black text-white"
                              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                            >
                              {mounted ? pad(item.value) : '--'}
                            </span>
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/30">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* GRAN PREMIO REMINDER */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E63946] to-[#FFB703] rounded-3xl opacity-20 blur-sm group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#1A1A20] to-[#12121A] border border-white/[0.08] rounded-3xl p-6 sm:p-8 overflow-hidden">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-[#E63946]/15 border border-[#E63946]/25 rounded-full px-4 py-1.5 mb-4">
                    <span className="text-lg">🏆</span>
                    <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#E63946]">Gran Premio — 3 de octubre</span>
                  </div>
                  <p className="text-white/50 text-[14px] leading-relaxed">
                    Además del anticipado, con la misma boleta participas por el{' '}
                    <span className="text-white font-bold">Camión FVR</span> y el{' '}
                    <span className="text-white font-bold">Kia Picanto 0km</span> el{' '}
                    <span className="text-[#FFB703] font-bold">3 de octubre de 2026</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Info + CTA ── */}
          <div className="space-y-6">

            {/* HOW IT WORKS */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF0050] to-[#00F2EA] rounded-3xl opacity-15 blur-sm group-hover:opacity-25 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#1A1A20] to-[#12121A] border border-white/[0.08] rounded-3xl p-5 sm:p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 bg-black/40 border border-white/[0.08] rounded-full px-4 py-1.5">
                    <i className="fab fa-tiktok text-white text-sm" />
                    <span className="text-[11px] font-bold tracking-[2px] uppercase text-white/60">Síguenos</span>
                  </div>
                  <a
                    href="https://www.tiktok.com/@elgrancamion.oficial?_r=1&_t=ZS-94LHsPFrtbR"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-white/30 hover:text-white/60 transition-all flex items-center gap-1"
                  >
                    @elgrancamion.oficial
                    <i className="fas fa-external-link-alt text-[9px]" />
                  </a>
                </div>

                <h3
                  className="text-xl sm:text-2xl uppercase tracking-wider mb-4 text-white"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  ¿Cómo funciona el <span className="text-[#FFB703]">anticipado</span>?
                </h3>

                <div className="space-y-4">
                  {[
                    { step: '01', text: 'Compras tu boleta y quedas inscrito en TODOS los sorteos de la 2da rifa.' },
                    { step: '02', text: 'El 15 de agosto se juega el Hyundai i10 Attraction con la lotería oficial.' },
                    { step: '03', text: 'Si tu número sale y eres el dueño, ganas el Hyundai i10 0km.' },
                    { step: '04', text: 'Tu boleta sigue activa para el gran premio del 3 de octubre: Camión FVR + Kia Picanto.' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FFB703]/10 border border-[#FFB703]/25 flex items-center justify-center text-[11px] font-black text-[#FFB703]">
                        {item.step}
                      </span>
                      <p className="text-white/50 text-[13px] leading-relaxed pt-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA CARD */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E63946] to-[#E63946] rounded-3xl opacity-20 blur-sm group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#E63946]/10 to-[#1A1A20] border border-[#E63946]/20 rounded-3xl p-6 sm:p-8 text-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#E63946_0%,transparent_70%)] opacity-[0.06]" />
                <div className="relative z-10">
                  <p className="text-3xl mb-3">🎰</p>
                  <h3
                    className="text-xl sm:text-2xl uppercase tracking-wider mb-3"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    ¿AÚN NO TIENES{' '}
                    <span className="text-[#FFB703]">TU BOLETA?</span>
                  </h3>
                  <p className="text-white/40 text-[13px] mb-5 max-w-sm mx-auto">
                    Una sola boleta te da chance de ganar el Hyundai i10 el 15 de agosto y el Camión FVR + Kia Picanto el 3 de octubre.
                  </p>
                  <a
                    href="/boletas"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#E63946] text-white text-[13px] font-bold uppercase tracking-wider hover:bg-[#d32f3c] shadow-xl shadow-[#E63946]/25 hover:shadow-[#E63946]/40 hover:scale-[1.02] transition-all"
                  >
                    <i className="fas fa-ticket text-[11px]" />
                    COMPRAR MI BOLETA AHORA
                  </a>
                  <p className="text-white/20 text-[11px] mt-3">
                    Por solo $130.000 participas en el anticipado y el gran premio
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BOTTOM INFO STRIP ═══ */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: 'fas fa-calendar-check', title: '15 de agosto', desc: 'Sorteo del Hyundai i10 Attraction 0km', color: '#25D366' },
            { icon: 'fas fa-trophy', title: '3 de octubre', desc: 'Gran premio: Camión FVR + Kia Picanto 0km', color: '#FFB703' },
            { icon: 'fas fa-ticket', title: 'Una sola boleta', desc: 'Participas en el anticipado y el gran sorteo', color: '#E63946' },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4 hover:bg-white/[0.05] transition-all"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}
              >
                <i className={`${item.icon} text-sm`} style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-white text-[13px] font-bold">{item.title}</p>
                <p className="text-white/30 text-[11px]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
