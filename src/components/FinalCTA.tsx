'use client';

import Image from 'next/image';

export default function FinalCTA() {
  return (
    <section className="dark-section py-32 md:py-40 bg-[#111113] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-radial from-[#E63946]/[0.04] to-transparent" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-radial from-[#FFB703]/[0.03] to-transparent" />
      </div>

      <div className="max-w-[700px] mx-auto px-6 relative">
        <div className="text-center">
          {/* Logo watermark */}
          <div className="relative w-20 h-20 mx-auto mb-8 opacity-40">
            <Image
              src="/uploads/logos/logo-blanco.png"
              alt=""
              fill
              className="object-contain"
              sizes="80px"
            />
          </div>

          {/* Eyebrow */}
          <span className="text-[12px] font-bold tracking-[6px] uppercase text-truck-red/70 mb-4 block">
            No dejes pasar esta oportunidad
          </span>

          {/* Headline */}
          <h2
            className="text-[clamp(40px,7vw,80px)] leading-[0.85] uppercase tracking-wider text-white mb-6"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            TU VIDA PUEDE <span className="gradient-text-red">CAMBIAR</span>{' '}
            <span className="gradient-text-gold">HOY</span>
          </h2>

          <p className="text-white/55 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Imagina despertar siendo dueño de tu propio camión, con un carro nuevo y un crucero esperándote. Todo con{' '}
            <strong className="text-white/80">una sola boleta</strong>.
          </p>

          {/* Price + CTA */}
          <div className="mb-8">
            <span className="block text-[12px] font-bold tracking-[4px] uppercase text-white/35 mb-3">
              Solo por
            </span>
            <span
              className="block text-[clamp(48px,8vw,72px)] gradient-text-gold leading-none mb-8"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              $50.000
            </span>
            <a
              href="/boletas"
              className="btn-primary text-[16px] px-12 py-5"
            >
              <i className="fas fa-ticket text-xl" />
              ELEGIR MI BOLETA
            </a>
          </div>

          {/* Payment methods */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {['Nequi', 'Bancolombia', 'Daviplata', 'Tarjeta'].map((method) => (
              <span
                key={method}
                className="px-4 py-2 rounded-full border border-white/[0.1] text-[12px] font-semibold text-white/40"
              >
                {method}
              </span>
            ))}
          </div>

          <p className="text-[13px] text-white/35">
            <i className="fas fa-clock text-[10px] mr-1" /> Quedan pocas boletas disponibles
          </p>
        </div>
      </div>
    </section>
  );
}
