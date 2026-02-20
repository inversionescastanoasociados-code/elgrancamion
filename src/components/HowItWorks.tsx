'use client';

const steps = [
  {
    number: '01',
    title: 'Elige tus Números',
    desc: 'Selecciona tus números de la suerte. Entre más boletas, más oportunidades de ganar.',
    icon: 'fa-hand-pointer',
    color: 'from-[#E63946] to-[#C62828]',
    bgColor: 'bg-[#E63946]/[0.06]',
  },
  {
    number: '02',
    title: 'Realiza el Pago',
    desc: 'Paga por Nequi, Bancolombia, Daviplata o Tarjeta. 100% seguro y verificado.',
    icon: 'fa-credit-card',
    color: 'from-[#FFB703] to-[#F57F17]',
    bgColor: 'bg-[#FFB703]/[0.06]',
  },
  {
    number: '03',
    title: 'Recibe tu Boleta',
    desc: 'Tu comprobante digital llega al WhatsApp. ¡Ya estás participando para ganar!',
    icon: 'fa-ticket',
    color: 'from-[#00C853] to-[#2E7D32]',
    bgColor: 'bg-[#00C853]/[0.06]',
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-28 md:py-36 bg-white relative overflow-hidden">
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="max-w-[1000px] mx-auto px-6 relative">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="h-px w-8 bg-black/10" />
            <span className="text-[11px] font-bold tracking-[5px] uppercase text-[#999]">
              Fácil y Rápido
            </span>
            <span className="h-px w-8 bg-black/10" />
          </div>
          <h2
            className="text-[clamp(40px,6vw,72px)] leading-[0.9] uppercase tracking-wider text-[#1A1A1A] mb-5"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            ¿CÓMO <span className="gradient-text-red">FUNCIONA</span>?
          </h2>
          <p className="text-[#666] text-lg max-w-lg mx-auto">
            Tres pasos sencillos y puedes estar conduciendo tu propio camión.
          </p>
        </div>

        {/* Steps — horizontal on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-gradient-to-r from-black/10 via-black/5 to-black/10 z-0" />
              )}

              <div className="relative text-center">
                {/* Icon circle */}
                <div className={`relative inline-flex items-center justify-center w-24 h-24 rounded-full ${step.bgColor} mb-6 transition-transform duration-300 group-hover:scale-110`}>
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  <i className={`fas ${step.icon} text-2xl bg-gradient-to-br ${step.color} bg-clip-text text-transparent`}
                    style={{ WebkitTextFillColor: 'transparent' }}
                  />
                  {/* Step number */}
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#333] flex items-center justify-center">
                    <span className="text-[10px] font-black text-white">{step.number}</span>
                  </div>
                </div>

                {/* Title */}
                <h3
                  className="text-2xl tracking-wider uppercase text-[#1A1A1A] mb-3"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-[14px] text-[#777] leading-relaxed max-w-[280px] mx-auto">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Price CTA */}
        <div className="text-center" id="comprar">
          {/* Decorative separator */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-black/10" />
            <span className="w-2 h-2 rounded-full bg-truck-red/20" />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-black/10" />
          </div>

          <span className="block text-[13px] font-bold tracking-[4px] uppercase text-[#999] mb-3">
            Precio por Boleta
          </span>
          <div
            className="text-[clamp(48px,7vw,80px)] gradient-text-red leading-none mb-6"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            $50.000 COP
          </div>
          <a
            href="/boletas"
            className="btn-primary text-[15px] px-10 py-5"
          >
            <i className="fas fa-ticket" />
            COMPRAR MI BOLETA AHORA
          </a>
          <p className="mt-5 text-[13px] text-[#999] flex flex-wrap justify-center gap-4">
            <span><i className="fas fa-lock text-[10px] mr-1" /> Pago seguro</span>
            <span><i className="fab fa-whatsapp text-[10px] mr-1" /> Atención directa</span>
            <span><i className="fas fa-bolt text-[10px] mr-1" /> Boletas limitadas</span>
          </p>
        </div>
      </div>
    </section>
  );
}
