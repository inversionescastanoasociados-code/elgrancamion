'use client';

const steps = [
  { n: '1', title: 'Elige tu número', desc: 'Selecciona en la tienda online.' },
  { n: '2', title: 'Paga', desc: 'Llave, transferencia o efectivo.' },
  { n: '3', title: 'Recibe tu boleta', desc: 'Te llega al WhatsApp al instante.' },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 sm:py-28 bg-white">
      <div className="max-w-[900px] mx-auto px-6">
        <h2
          className="text-center text-[clamp(36px,6vw,56px)] uppercase text-[#1A1A1A] mb-12"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          Cómo funciona
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
          {steps.map((s) => (
            <div key={s.n} className="text-center md:text-left">
              <span
                className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-truck-red/10 text-truck-red font-bold text-sm mb-4"
              >
                {s.n}
              </span>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">{s.title}</h3>
              <p className="text-[14px] text-[#777] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center border-t border-black/[0.06] pt-12">
          <p className="text-[13px] text-[#999] uppercase tracking-wider mb-2">Precio por boleta</p>
          <p className="text-5xl text-truck-red mb-6" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
            $130.000
          </p>
          <a href="/boletas" className="btn-primary text-[14px] px-10 py-4">
            <i className="fas fa-ticket" />
            Comprar ahora
          </a>
        </div>
      </div>
    </section>
  );
}
