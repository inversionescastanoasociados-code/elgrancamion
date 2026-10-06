'use client';

const specs = [
  { label: 'Premio', value: 'Camión FVR modelo 2027' },
  { label: 'Estado', value: '0km · Nuevo' },
  { label: 'Incluye', value: 'Rumba navideña completa' },
  { label: 'Impuestos', value: 'Ganancias ocasionales pagadas' },
  { label: 'Sorteo', value: '26 de diciembre de 2026' },
];

export default function TruckSpecs() {
  return (
    <section className="py-16 sm:py-20 bg-[#111113]">
      <div className="max-w-[600px] mx-auto px-6">
        <h2
          className="text-center text-[clamp(28px,5vw,40px)] uppercase text-white mb-8"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          Camión FVR 0km · Modelo 2027
        </h2>
        <dl className="space-y-4">
          {specs.map((s) => (
            <div key={s.label} className="flex justify-between py-3 border-b border-white/[0.08]">
              <dt className="text-[13px] text-white/40 uppercase tracking-wider">{s.label}</dt>
              <dd className="text-[15px] text-white/90 font-medium">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
