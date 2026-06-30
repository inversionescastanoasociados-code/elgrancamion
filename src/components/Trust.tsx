'use client';

import { useState } from 'react';

const faqs = [
  {
    q: '¿Cuándo juega la 2da rifa?',
    a: 'El premio anticipado (Hyundai i10 Attraction 0km) juega el 15 de agosto. El gran premio (Camión FVR + Kia Picanto 0km) juega el 3 de octubre, con la lotería oficial.',
  },
  {
    q: '¿Qué pasa si no cae el número?',
    a: 'Se juega nuevamente en la siguiente fecha de sorteo hasta que haya un ganador. ¡El premio se entrega sí o sí!',
  },
  {
    q: '¿Puedo comprar desde el exterior?',
    a: 'Sí, puedes pagar con diferentes métodos de pago. Contacta a soporte para el proceso de pago internacional.',
  },
  {
    q: '¿Es legal esta rifa?',
    a: 'Sí, la rifa está autorizada y supervisada por las autoridades competentes EDSA.',
  },
  {
    q: '¿Cómo recibo mi boleta?',
    a: 'Tu boleta digital te llega directamente a tu WhatsApp inmediatamente después de confirmar el pago, o la puedes descargar desde este sitio web en el apartado de "Mis Boletas".',
  },
];

export default function Trust() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="confianza" className="py-20 sm:py-28 bg-white">
      <div className="max-w-[640px] mx-auto px-6">
        <h2
          className="text-center text-[clamp(36px,6vw,56px)] uppercase text-[#1A1A1A] mb-10"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          Preguntas frecuentes
        </h2>
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
