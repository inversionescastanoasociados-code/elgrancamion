'use client';

const specs = [
  { label: 'Motor', value: 'Cummins ISX 450HP' },
  { label: 'Transmisión', value: 'Eaton Fuller 18 vel.' },
  { label: 'Extras', value: 'SOAT + Tanque lleno + $5M viáticos' },
  { label: 'Cabina', value: 'A/C, litera doble, cuero' },
  { label: 'Kia Picanto', value: '2025 Full Equipo 0km' },
  { label: 'Estado', value: 'Papeles al día, llantas nuevas' },
];

export default function TruckSpecs() {
  return (
    <section className="dark-section py-28 md:py-36 bg-[#111113] relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />
      <div className="max-w-[900px] mx-auto px-6 relative">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Left — title */}
          <div className="lg:w-[40%] lg:sticky lg:top-32">
            <span className="pill pill-red mb-5 inline-flex">
              <i className="fas fa-wrench text-[9px]" /> Ficha Técnica
            </span>
            <h2
              className="text-[clamp(36px,5vw,56px)] leading-[0.9] uppercase tracking-wider text-white mb-5"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              CONOCE A LA <span className="gradient-text-red">BESTIA</span>
            </h2>
            <p className="text-white/50 text-[16px] leading-relaxed">
              Esta máquina está lista para trabajar desde el día uno. Motor ajustado, llantas nuevas, documentos al día.
            </p>
          </div>

          {/* Right — specs list */}
          <div className="lg:w-[60%]">
            {specs.map((spec, i) => (
              <div
                key={i}
                className={`flex justify-between items-baseline py-5 ${
                  i < specs.length - 1 ? 'border-b border-white/[0.06]' : ''
                }`}
              >
                <span className="text-[13px] font-bold uppercase tracking-wider text-white/40">
                  {spec.label}
                </span>
                <span className="text-[15px] text-white/85 font-medium text-right max-w-[60%]">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
