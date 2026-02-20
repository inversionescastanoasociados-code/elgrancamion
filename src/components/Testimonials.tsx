'use client';

const testimonials = [
  {
    name: 'Roberto Mendoza',
    city: 'Bogotá',
    text: 'Vi esta rifa y decidí participar. La transparencia que manejan me dio toda la confianza. ¡Ojalá sea el ganador!',
  },
  {
    name: 'Patricia Gómez',
    city: 'Medellín',
    text: 'Mi esposo es camionero y este sería un sueño hecho realidad. Compré 5 boletas para toda la familia.',
  },
  {
    name: 'Felipe Castañeda',
    city: 'Cali',
    text: 'El proceso de compra fue super fácil, pagué por Nequi y me llegó la boleta al WhatsApp en segundos.',
  },
];

export default function Testimonials() {
  return (
    <section className="py-28 md:py-36 bg-[#F5F2EE]">
      <div className="max-w-[900px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="h-px w-8 bg-[#FFB703]/30" />
            <span className="text-[11px] font-bold tracking-[5px] uppercase text-[#B87A00]">
              Lo que dicen nuestros participantes
            </span>
            <span className="h-px w-8 bg-[#FFB703]/30" />
          </div>
          <h2
            className="text-[clamp(36px,5vw,60px)] leading-[0.9] uppercase tracking-wider text-[#1A1A1A] mb-5"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            TESTIMONIOS <span className="gradient-text-gold">REALES</span>
          </h2>
        </div>

        {/* Testimonials */}
        <div className="space-y-12">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`py-8 ${
                i < testimonials.length - 1 ? 'border-b border-black/[0.06]' : ''
              }`}
            >
              <p className="text-[18px] sm:text-[20px] text-[#444] leading-relaxed italic mb-5">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-truck-red/20 to-warning-yellow/20 flex items-center justify-center text-truck-red font-bold text-xs">
                  {t.name[0]}
                </div>
                <div>
                  <span className="text-[14px] font-bold text-[#333]">{t.name}</span>
                  <span className="text-[13px] text-[#999] ml-2">{t.city}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 flex flex-wrap justify-center gap-12">
          {[
            { value: '2,500+', label: 'Boletas Vendidas' },
            { value: '98%', label: 'Satisfacción' },
            { value: '24/7', label: 'Soporte' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div
                className="text-3xl tracking-wider gradient-text-red"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                {stat.value}
              </div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#AAA] mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
