'use client';

export default function FinalCTA() {
  return (
    <section className="py-20 sm:py-28 bg-[#111113]">
      <div className="max-w-lg mx-auto px-6 text-center">
        <h2
          className="text-[clamp(36px,6vw,56px)] uppercase text-white leading-none mb-4"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          Participa hoy
        </h2>
        <p className="text-white/50 text-base mb-8">
          Camión FVR, Kia Picanto y Hyundai i10. Una sola boleta.
        </p>
        <p
          className="text-[clamp(40px,8vw,64px)] text-[#FFB703] leading-none mb-8"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          $130.000
        </p>
        <a href="/boletas" className="btn-primary text-[15px] px-12 py-4">
          <i className="fas fa-ticket" />
          Comprar boleta
        </a>
        <p className="mt-6 text-[12px] text-white/30">
          Llave · Transferencia · Efectivo
        </p>
      </div>
    </section>
  );
}
