'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

/* ─── Prize data ─── */
const prizes = [
  {
    id: 'truck',
    rank: 'GRAN PREMIO',
    title: 'Tractomula VW Worker',
    subtitle: 'Modelo 2024 · Papeles al día',
    description:
      'Tu propio negocio sobre ruedas. Motor ajustado, llantas nuevas, documentos al día. Empieza a generar ingresos desde el día uno.',
    image: '/uploads/IMG_7998.JPG',
    badge: '🥇',
    badgeColor: 'from-[#E63946] to-[#B71C1C]',
    cardBg: 'bg-gradient-to-br from-[#111113] via-[#1a1a1f] to-[#111113]',
    textColor: 'text-white',
    subtitleColor: 'text-white/50',
    descColor: 'text-white/60',
    featured: true,
    value: '+$200M',
  },
  {
    id: 'kia',
    rank: '2DO PREMIO',
    title: 'Kia Picanto 0km',
    subtitle: 'Full Equipo · Matrícula incluida',
    description:
      'Color plata, full equipo, matrícula incluida. El carro perfecto para tu familia.',
    image: '/uploads/kia-picanto.jpg',
    badge: '🥈',
    badgeColor: 'from-[#FFB703] to-[#F57F17]',
    cardBg: 'bg-gradient-to-br from-white via-[#FFFDF5] to-[#FFF8E7]',
    textColor: 'text-[#1A1A1A]',
    subtitleColor: 'text-[#999]',
    descColor: 'text-[#666]',
    featured: false,
    value: '$45M',
  },
  {
    id: 'mothers',
    rank: 'DÍA DE LA MADRE',
    title: '$10 Millones',
    subtitle: '14 de Mayo · En Efectivo',
    description:
      'Porque mamá merece lo mejor. Dinero directo a tu cuenta.',
    image: null,
    icon: 'mothers',
    badge: '💝',
    badgeColor: 'from-[#E91E63] to-[#AD1457]',
    cardBg: 'bg-gradient-to-br from-[#FFF0F3] via-white to-[#FFF0F3]',
    textColor: 'text-[#1A1A1A]',
    subtitleColor: 'text-[#999]',
    descColor: 'text-[#666]',
    featured: false,
    value: '$10M',
  },
  {
    id: 'fathers',
    rank: 'DÍA DEL PADRE',
    title: '$10 Millones',
    subtitle: '18 de Junio · En Efectivo',
    description:
      'Premios en efectivo para el papá de la casa. Celebra en grande.',
    image: null,
    icon: 'fathers',
    badge: '👔',
    badgeColor: 'from-[#1565C0] to-[#0D47A1]',
    cardBg: 'bg-gradient-to-br from-[#F0F4FF] via-white to-[#F0F4FF]',
    textColor: 'text-[#1A1A1A]',
    subtitleColor: 'text-[#999]',
    descColor: 'text-[#666]',
    featured: false,
    value: '$10M',
  },
  {
    id: 'cruise',
    rank: '5TO PREMIO',
    title: 'Crucero Bahamas',
    subtitle: 'Para 2 Personas · All Inclusive',
    description:
      'El viaje de tus sueños por las islas del Caribe con todo incluido.',
    image: null,
    icon: 'cruise',
    badge: '🚢',
    badgeColor: 'from-[#00838F] to-[#006064]',
    cardBg: 'bg-gradient-to-br from-[#E8F5FA] via-white to-[#E0F7FA]',
    textColor: 'text-[#1A1A1A]',
    subtitleColor: 'text-[#999]',
    descColor: 'text-[#666]',
    featured: false,
    value: '$25M',
  },
];

/* ─── Cash prize illustration ─── */
function CashPrizeVisual({ type }: { type: string }) {
  if (type === 'mothers') {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-pink-200/60 to-pink-300/30 blur-2xl" />
        </div>
        <div className="relative text-center">
          <div className="text-6xl sm:text-7xl mb-2 animate-float">💝</div>
          <div
            className="text-4xl sm:text-5xl font-black tracking-wider bg-gradient-to-r from-[#E91E63] to-[#C2185B] bg-clip-text text-transparent"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            $10M
          </div>
          <div className="mt-1 text-[10px] font-bold tracking-[3px] uppercase text-[#E91E63]/60">
            En Efectivo
          </div>
          <div className="absolute -top-4 -left-6 text-xl animate-float" style={{ animationDelay: '0.5s' }}>❤️</div>
          <div className="absolute -top-2 right-0 text-lg animate-float" style={{ animationDelay: '1s' }}>💕</div>
          <div className="absolute bottom-0 -right-4 text-sm animate-float" style={{ animationDelay: '1.5s' }}>🌹</div>
        </div>
      </div>
    );
  }

  if (type === 'fathers') {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-200/60 to-blue-300/30 blur-2xl" />
        </div>
        <div className="relative text-center">
          <div className="text-6xl sm:text-7xl mb-2 animate-float">👔</div>
          <div
            className="text-4xl sm:text-5xl font-black tracking-wider bg-gradient-to-r from-[#1565C0] to-[#0D47A1] bg-clip-text text-transparent"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            $10M
          </div>
          <div className="mt-1 text-[10px] font-bold tracking-[3px] uppercase text-[#1565C0]/60">
            En Efectivo
          </div>
          <div className="absolute -top-4 -left-6 text-xl animate-float" style={{ animationDelay: '0.5s' }}>⭐</div>
          <div className="absolute -top-2 right-0 text-lg animate-float" style={{ animationDelay: '1s' }}>🏆</div>
          <div className="absolute bottom-0 -right-4 text-sm animate-float" style={{ animationDelay: '1.5s' }}>💪</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-cyan-200/60 to-teal-200/30 blur-2xl" />
      </div>
      <div className="relative text-center">
        <div className="text-6xl sm:text-7xl mb-2 animate-float">🚢</div>
        <div
          className="text-3xl sm:text-4xl font-black tracking-wider bg-gradient-to-r from-[#00838F] to-[#00695C] bg-clip-text text-transparent"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          BAHAMAS
        </div>
        <div className="mt-1 text-[10px] font-bold tracking-[3px] uppercase text-[#00838F]/60">
          2 Personas · All Inclusive
        </div>
        <div className="absolute -top-4 -left-6 text-xl animate-float" style={{ animationDelay: '0.5s' }}>🌴</div>
        <div className="absolute -top-2 right-0 text-lg animate-float" style={{ animationDelay: '1s' }}>🏝️</div>
        <div className="absolute bottom-0 -right-4 text-sm animate-float" style={{ animationDelay: '1.5s' }}>🌊</div>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function Prizes() {
  return (
    <section id="premios" className="py-28 md:py-40 bg-white relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-[#E63946]/[0.03] to-transparent pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-6 relative">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="h-px w-8 bg-[#E63946]/30" />
            <span className="text-[11px] font-bold tracking-[5px] uppercase text-[#E63946]">
              Premios Increíbles
            </span>
            <span className="h-px w-8 bg-[#E63946]/30" />
          </div>
          <h2
            className="text-[clamp(42px,7vw,80px)] leading-[0.85] uppercase tracking-wider text-[#1A1A1A] mb-6"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            LO QUE PUEDES <span className="gradient-text-red">GANAR</span>
          </h2>
          <p className="text-[#777] text-lg max-w-xl mx-auto leading-relaxed">
            Más de <strong className="text-[#1A1A1A]">$300 millones</strong> en premios esperando
            por ti. Una boleta puede cambiar tu vida para siempre.
          </p>
        </div>

        {/* ═══ FEATURED PRIZE — Truck ═══ */}
        <div className="mb-8">
          <div className={`prize-card-featured relative rounded-3xl overflow-hidden ${prizes[0].cardBg} border border-white/[0.06]`}>
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-3xl prize-border-glow-red pointer-events-none" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Image side */}
              <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[480px] overflow-hidden">
                <Image
                  src={prizes[0].image!}
                  alt={prizes[0].title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#111113]/80 hidden lg:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-transparent to-transparent lg:hidden" />

                <div className="absolute top-5 left-5">
                  <div className="prize-value-badge bg-gradient-to-r from-[#E63946] to-[#B71C1C] text-white px-5 py-2 rounded-full text-sm font-black tracking-wider shadow-lg shadow-[#E63946]/30">
                    <i className="fas fa-crown text-xs mr-2 text-yellow-300" />
                    GRAN PREMIO
                  </div>
                </div>
              </div>

              {/* Content side */}
              <div className="relative p-8 sm:p-10 lg:p-14 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{prizes[0].badge}</span>
                  <span className="text-[11px] font-bold tracking-[4px] uppercase text-[#E63946]">
                    {prizes[0].rank}
                  </span>
                </div>

                <h3
                  className="text-[clamp(36px,5vw,56px)] leading-[0.9] uppercase tracking-wider text-white mb-2"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  {prizes[0].title}
                </h3>

                <p className="text-[13px] font-bold text-white/40 uppercase tracking-[3px] mb-5">
                  {prizes[0].subtitle}
                </p>

                <p className="text-[15px] text-white/55 leading-relaxed max-w-md mb-8">
                  {prizes[0].description}
                </p>

                <div className="flex items-end gap-3 mb-8">
                  <span className="text-[12px] font-bold text-white/30 uppercase tracking-wider">Valor estimado</span>
                  <span
                    className="text-4xl sm:text-5xl leading-none"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    <span className="bg-gradient-to-r from-[#FFB703] via-[#FFD700] to-[#FFB703] bg-clip-text text-transparent">
                      {prizes[0].value}
                    </span>
                  </span>
                </div>

                <a
                  href="/boletas"
                  className="btn-primary text-[13px] px-8 py-3.5 w-fit"
                >
                  <i className="fas fa-ticket text-xs" />
                  QUIERO ESTE PREMIO
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECONDARY PRIZES — Grid ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {prizes.slice(1).map((prize) => (
            <div
              key={prize.id}
              className={`prize-card group relative rounded-2xl overflow-hidden ${prize.cardBg} border border-black/[0.06] hover:border-black/[0.12] transition-all duration-500 hover:-translate-y-1 hover:shadow-xl`}
            >
              {/* Image / Visual area */}
              <div className="relative aspect-[4/3] overflow-hidden">
                {prize.image ? (
                  <Image
                    src={prize.image}
                    alt={prize.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  />
                ) : (
                  <CashPrizeVisual type={prize.icon!} />
                )}

                {/* Rank badge */}
                <div className="absolute top-3 left-3 z-10">
                  <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${prize.badgeColor} text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider shadow-lg`}>
                    <span>{prize.badge}</span>
                    {prize.rank}
                  </div>
                </div>

                {/* Value badge */}
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-white/90 backdrop-blur-sm text-[#1A1A1A] px-3 py-1 rounded-full text-xs font-black tracking-wider shadow-sm">
                    {prize.value}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 pb-6">
                <h3
                  className={`text-2xl sm:text-[26px] tracking-wider uppercase ${prize.textColor} mb-1`}
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  {prize.title}
                </h3>
                <p className={`text-[11px] font-bold ${prize.subtitleColor} uppercase tracking-[2px] mb-3`}>
                  {prize.subtitle}
                </p>
                <p className={`text-[13px] ${prize.descColor} leading-relaxed`}>
                  {prize.description}
                </p>
              </div>

              {/* Bottom accent line */}
              <div className={`h-1 w-full bg-gradient-to-r ${prize.badgeColor} opacity-60 group-hover:opacity-100 transition-opacity`} />
            </div>
          ))}
        </div>

        {/* ═══ TOTAL VALUE — Bottom strip ═══ */}
        <div className="mt-16 relative">
          <div className="prize-total-strip relative bg-gradient-to-r from-[#111113] via-[#1a1a1f] to-[#111113] rounded-2xl px-8 py-10 sm:py-12 overflow-hidden">
            {/* Animated shimmer */}
            <div className="absolute inset-0 prize-shimmer pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
                  <div className="w-10 h-10 rounded-full bg-[#FFB703]/10 flex items-center justify-center">
                    <i className="fas fa-coins text-[#FFB703] text-sm" />
                  </div>
                  <span className="text-[12px] font-bold tracking-[4px] uppercase text-white/40">
                    Valor Total en Premios
                  </span>
                </div>
                <div
                  className="text-[clamp(44px,6vw,72px)] leading-none"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  <span className="bg-gradient-to-r from-[#FFB703] via-[#FFD700] to-[#FFB703] bg-clip-text text-transparent">
                    +$300 MILLONES
                  </span>
                </div>
                <span className="block text-[13px] text-white/35 mt-2">
                  Todo puede ser tuyo con una sola boleta de <strong className="text-white/60">$50.000</strong>
                </span>
              </div>

              <a
                href="/boletas"
                className="btn-primary text-[13px] px-10 py-4 flex-shrink-0"
              >
                <i className="fas fa-ticket text-lg" />
                COMPRAR AHORA
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
