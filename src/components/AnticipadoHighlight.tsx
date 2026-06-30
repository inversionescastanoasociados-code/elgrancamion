'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ANTICIPADO_DATE, HYUNDAI_I10 } from '@/lib/prizeAssets';

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

export default function AnticipadoHighlight() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    const tick = () => setTimeLeft(getTimeLeft(ANTICIPADO_DATE));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section id="anticipado" className="bg-[#0a1628] border-y border-white/[0.06]">
      <div className="max-w-[1100px] mx-auto px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
            <Image
              src={HYUNDAI_I10}
              alt="Hyundai i10 Attraction 0km"
              fill
              className="object-cover object-center"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute top-4 left-4 bg-[#25D366] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Anticipado · 12 ago
            </span>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#25D366] mb-3">
              Premio anticipado
            </p>
            <h2
              className="text-[clamp(32px,5vw,48px)] leading-none uppercase text-white mb-4"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              Hyundai i10 Attraction 0km
            </h2>
            <p className="text-white/55 text-[15px] leading-relaxed mb-6 max-w-md">
              Gánalo el 12 de agosto con la misma boleta. Full equipo, 0 kilómetros y papeles al día.
            </p>

            <div className="flex gap-4 mb-8">
              {[
                { v: timeLeft.days, l: 'Días' },
                { v: timeLeft.hours, l: 'Hrs' },
                { v: timeLeft.minutes, l: 'Min' },
                { v: timeLeft.seconds, l: 'Seg' },
              ].map(({ v, l }) => (
                <div key={l}>
                  <div className="text-3xl text-white tabular-nums" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                    {mounted ? pad(v) : '--'}
                  </div>
                  <div className="text-[10px] text-white/35 uppercase">{l}</div>
                </div>
              ))}
            </div>

            <a href="/boletas" className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white text-[13px] font-bold px-8 py-3.5 rounded-full transition-colors">
              <i className="fas fa-ticket text-xs" />
              Comprar boleta — $130.000
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
