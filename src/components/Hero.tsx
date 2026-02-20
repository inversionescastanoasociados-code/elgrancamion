'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

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

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const targetDate = new Date('2026-05-10T00:00:00');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft(targetDate));
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section
      ref={heroRef}
      id="inicio"
      className="dark-section relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background Image — full cover */}
      <Image
        src="/uploads/IMG_7998.JPG"
        alt="Camión VW Worker 17.220 — Premio Mayor"
        fill
        className="object-cover object-left"
        sizes="100vw"
        priority
        quality={90}
      />

      {/* Dark overlay — LEFT half clear, RIGHT half fades to dark smoothly */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent from-30% via-black/50 via-55% to-black/85 to-80%" />
      {/* Bottom fade for section transition */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-transparent to-transparent" style={{ background: 'linear-gradient(to top, #111113 0%, #111113 2%, transparent 25%)' }} />

      {/* Content — positioned right */}
      <div className="relative z-10 w-full max-w-[1300px] mx-auto px-6 py-28 lg:py-0 min-h-screen flex items-center">
        <div className="w-full flex justify-end">
          <div className="w-full lg:w-[50%] text-center lg:text-left">

            {/* Logo mark */}
            <div className="mb-5 flex justify-center lg:justify-start">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 opacity-80">
                <Image
                  src="/uploads/logos/logo-blanco.png"
                  alt="Gran Rifa Camionera"
                  fill
                  className="object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                  sizes="64px"
                />
              </div>
            </div>

            {/* Badge */}
            <div className="mb-6">
              <span className="pill pill-red">
                <i className="fas fa-star text-[9px]" /> Edición Limitada 2026
              </span>
            </div>

            {/* Main Title */}
            <h1 style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              <span className="block text-[clamp(48px,8vw,100px)] leading-[0.85] tracking-[3px] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
                EL REY DE LA
              </span>
              <span className="block text-[clamp(48px,8vw,100px)] leading-[0.85] tracking-[3px] text-truck-red drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
                CARRETERA
              </span>
              <span className="block text-[clamp(16px,2vw,24px)] leading-[1.2] tracking-[6px] text-white/50 mt-3">
                PUEDE SER TUYO
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 text-[15px] sm:text-[17px] leading-relaxed text-white/70 max-w-[48ch] mx-auto lg:mx-0">
              Una tractomula, un <span className="text-warning-yellow font-semibold">Kia Picanto 0km</span>,{' '}
              <span className="text-warning-yellow font-semibold">$20 millones en premios</span> y un{' '}
              <span className="text-warning-yellow font-semibold">crucero por las Bahamas</span>.
              <br className="hidden sm:block" />
              Todo por solo <span className="text-white font-bold">$50.000 COP</span>.
            </p>

            {/* Countdown */}
            <div className="mt-8 flex justify-center lg:justify-start gap-5 sm:gap-7">
              {[
                { value: pad(timeLeft.days), label: 'Días' },
                { value: pad(timeLeft.hours), label: 'Horas' },
                { value: pad(timeLeft.minutes), label: 'Min' },
                { value: pad(timeLeft.seconds), label: 'Seg' },
              ].map((item) => (
                <div key={item.label} className="countdown-unit">
                  <div className="number" style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 'clamp(32px, 4vw, 44px)', letterSpacing: '2px' }}>
                    {item.value}
                  </div>
                  <div className="label">{item.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
              <a
                href="/boletas"
                className="btn-primary text-[15px] px-10 py-4"
              >
                <i className="fas fa-ticket" />
                QUIERO MI BOLETA
              </a>
              <a
                href="#premios"
                className="btn-secondary text-[14px] px-8 py-4"
              >
                Ver Premios
              </a>
            </div>

            {/* Trust line */}
            <p className="mt-5 text-[12px] text-white/40 tracking-wider">
              <i className="fas fa-lock text-[10px] mr-1" /> Compra segura · Boletas digitales · WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="text-[10px] font-bold tracking-[3px] uppercase text-white/30">
          Descubre
        </span>
        <div className="w-5 h-8 rounded-full border border-white/20 flex justify-center pt-2">
          <div className="w-1 h-1.5 rounded-full bg-white/50 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
