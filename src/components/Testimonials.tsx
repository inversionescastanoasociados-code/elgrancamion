'use client';

import Image from 'next/image';

const leaders = [
  {
    name: 'JULIAN CASTAÑO 1',
    role: ' responsable',
    photo: '/uploads/equipo/julian-castano.jpg',
  },
  {
    name: 'ALEJANDRO CASTAÑO ',
    role: 'responsable',
    photo: '/uploads/equipo/alejandro-castano.jpg',
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-28 md:py-36  overflow-hidden">
      {/* ── Background: Team Photo ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/uploads/equipo/equipo-grupal.jpg"
          alt="Nuestro equipo"
          fill
          className="object-cover "
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111113] via-[#111113]/70 to-[#111113]" />
      </div>

      <div className="relative z-10 max-w-[900px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="h-px w-8 bg-[#FFB703]/30" />
            <span className="text-[11px] font-bold tracking-[5px] uppercase text-[#FFB703]">
              Conoce a quienes hacen esto posible
            </span>
            <span className="h-px w-8 bg-[#FFB703]/30" />
          </div>
          <h2
            className="text-[clamp(36px,5vw,60px)] leading-[0.9] uppercase tracking-wider text-white mb-5"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            QUIÉNES <span className="gradient-text-gold">SOMOS</span>
          </h2>
          <p className="text-[15px] sm:text-[17px] text-white/50 max-w-[52ch] mx-auto leading-relaxed">
            Somos un equipo apasionado, comprometido con la transparencia y la confianza. Cada boleta que compras está respaldada por personas reales.
          </p>
        </div>

        {/* ── Leaders — Round Photos ── */}
        <div className="flex flex-wrap justify-center gap-10 sm:gap-16 mb-16">
          {leaders.map((leader, i) => (
            <div key={i} className="text-center group">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-5">
                {/* Glow ring */}
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-truck-red via-warning-yellow to-truck-red opacity-40 blur-md group-hover:opacity-60 transition-opacity duration-500" />
                {/* Photo */}
                <div className="relative w-full h-full rounded-full overflow-hidden border-[3px] border-white/20 shadow-2xl">
                  <Image
                    src={leader.photo}
                    alt={leader.name}
                    fill
                    className="object-cover"
                    sizes="176px"
                  />
                </div>
              </div>
              <h3
                className="text-[22px] sm:text-[26px] tracking-wider text-white uppercase"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                {leader.name}
              </h3>
              <p className="text-[12px] font-bold tracking-[3px] uppercase text-truck-red mt-1">
                {leader.role}
              </p>
            </div>
          ))}
        </div>

        {/* ── Emotional Text ── */}
        <div className="max-w-[700px] mx-auto text-center">
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 sm:p-10 backdrop-blur-sm">
            <i className="fas fa-quote-left text-truck-red/30 text-3xl mb-5 block" />
            <p className="text-[17px] sm:text-[19px] text-white/80 leading-relaxed italic mb-6">
              Nacimos con un sueño: darle la oportunidad a miles de colombianos de cumplir el suyo.
              Detrás de cada boleta hay esfuerzo, dedicación y un compromiso real contigo.
              Somos <span className="text-truck-red font-bold not-italic">Inversiones Castaño Asociados S.A.S</span>, 
              una empresa legalmente constituida que trabaja con total transparencia 
              para que tu confianza siempre esté bien depositada.
            </p>
            <p className="text-[15px] text-white/50 leading-relaxed">
              Porque cuando tú ganas, ganamos todos. 🤝
            </p>
          </div>
        </div>

        {/* ── Contact & Trust ── */}
        <div className="mt-14 flex flex-wrap justify-center gap-8 sm:gap-14">
          {[
            { icon: 'fa-building', label: 'Empresa', value: 'Inv. Castaño Asociados SAS' },
            { icon: 'fa-shield-halved', label: 'Compromiso', value: '100% Transparencia' },
            { icon: 'fa-headset', label: 'Soporte', value: '24/7 por WhatsApp' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 rounded-full bg-truck-red/10 flex items-center justify-center mx-auto mb-3">
                <i className={`fas ${stat.icon} text-truck-red text-lg`} />
              </div>
              <div className="text-[10px] font-bold tracking-[3px] uppercase text-white/30 mb-1">
                {stat.label}
              </div>
              <div className="text-[14px] font-bold text-white/70">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
