'use client';

import { useState } from 'react';

const faqs = [
  {
    q: '¿Cuándo juega la rifa?',
    a: 'Juega el próximo 30 de Diciembre con el premio mayor de la Lotería de Medellín.',
  },
  {
    q: '¿Qué pasa si no cae el número?',
    a: 'Se juega nuevamente en la siguiente fecha de sorteo hasta que haya un ganador. ¡El premio se entrega sí o sí!',
  },
  {
    q: '¿Puedo comprar desde el exterior?',
    a: 'Sí, puedes pagar con tarjeta de crédito o PayPal. Contacta a soporte para el link de pago internacional.',
  },
  {
    q: '¿Es legal esta rifa?',
    a: 'Sí, la rifa está autorizada y supervisada por las autoridades competentes.',
  },
  {
    q: '¿Cómo recibo mi boleta?',
    a: 'Tu boleta digital te llega directamente a tu WhatsApp inmediatamente después de confirmar el pago.',
  },
];

export default function Trust() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="confianza" className="py-28 md:py-36 bg-white">
      <div className="max-w-[800px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="h-px w-8 bg-black/10" />
            <span className="text-[11px] font-bold tracking-[5px] uppercase text-[#999]">
              Resolvemos tus dudas
            </span>
            <span className="h-px w-8 bg-black/10" />
          </div>
          <h2
            className="text-[clamp(36px,5vw,60px)] leading-[0.9] uppercase tracking-wider text-[#1A1A1A] mb-5"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            PREGUNTAS <span className="gradient-text-red">FRECUENTES</span>
          </h2>
          <p className="text-[#666] text-lg max-w-lg mx-auto">
            Todo lo que necesitas saber antes de comprar tu boleta.
          </p>
        </div>

        {/* FAQ */}
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border-b border-black/[0.06] cursor-pointer"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className="flex items-center justify-between py-5">
                <h4 className="font-bold text-[15px] text-[#333] pr-4">
                  {faq.q}
                </h4>
                <i
                  className={`fas fa-chevron-down text-truck-red text-xs flex-shrink-0 transition-transform duration-300 ${
                    openFaq === i ? 'rotate-180' : ''
                  }`}
                />
              </div>
              <div className={`faq-answer ${openFaq === i ? 'open pb-5' : ''}`}>
                <p className="text-[14px] text-[#666] leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges row */}
        <div className="mt-16 flex flex-wrap justify-center gap-8">
          {[
            { icon: 'fa-shield-halved', label: 'Pago Seguro' },
            { icon: 'fa-circle-check', label: 'Verificado' },
            { icon: 'fa-scale-balanced', label: 'Legal' },
            { icon: 'fa-heart', label: 'Obra Social' },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-[#AAA]">
              <i className={`fas ${badge.icon} text-sm`} />
              <span className="text-[12px] font-bold tracking-wider uppercase">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
