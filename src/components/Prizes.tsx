'use client';

import Image from 'next/image';
import { CAMION_PRINCIPAL, HYUNDAI_I10 } from '@/lib/prizeAssets';

const prizes = [
  {
    id: 'hyundai',
    tag: 'Anticipado · 14 nov',
    tagColor: 'text-[#25D366] bg-[#25D366]/10',
    title: 'Hyundai i10 Attraction',
    desc: '0km · Full equipo · Sorteo 14 de noviembre de 2026',
    image: HYUNDAI_I10,
  },
  {
    id: 'camion',
    tag: 'Premio mayor · 26 dic',
    tagColor: 'text-truck-red bg-truck-red/10',
    title: 'Camión FVR 2027',
    desc: '0km · Nuevo · Listo para trabajar',
    image: CAMION_PRINCIPAL,
  },
  {
    id: 'rumba',
    tag: 'Premio mayor · 26 dic',
    tagColor: 'text-[#B87A00] bg-[#FFB703]/10',
    title: 'Rumba navideña',
    desc: 'Marrano · Licor · Torre de sonido XBOOM',
    image: CAMION_PRINCIPAL,
    festive: true,
  },
];

export default function Prizes() {
  return (
    <section id="premios" className="py-20 sm:py-28 bg-white">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2
            className="text-[clamp(36px,6vw,56px)] uppercase tracking-wide text-[#1A1A1A]"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            Los premios
          </h2>
          <p className="mt-3 text-[#777] text-base max-w-md mx-auto">
            Una boleta de $150.000 · Dos sorteos · Ganancias ocasionales pagadas
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {prizes.map((prize) => (
            <article
              key={prize.id}
              className="group rounded-2xl overflow-hidden border border-black/[0.06] bg-[#FAFAFA] hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={prize.image}
                  alt={prize.title}
                  fill
                  className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
                  sizes="(min-width: 640px) 33vw, 100vw"
                />
                {prize.festive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7f1d1d]/85 via-[#14532d]/80 to-black/80 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="flex items-center justify-center gap-5 text-4xl mb-3">
                        <i className="fas fa-piggy-bank" />
                        <i className="fas fa-wine-bottle text-[#FFB703]" />
                        <i className="fas fa-volume-high text-[#25D366]" />
                      </div>
                      <p
                        className="text-3xl uppercase tracking-wide"
                        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                      >
                        Rumba navideña
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-5">
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 ${prize.tagColor}`}>
                  {prize.tag}
                </span>
                <h3
                  className="text-xl uppercase tracking-wide text-[#1A1A1A]"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  {prize.title}
                </h3>
                <p className="mt-1 text-[13px] text-[#888]">{prize.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="/boletas" className="btn-primary text-[14px] px-10 py-4">
            <i className="fas fa-ticket" />
            Comprar boleta
          </a>
        </div>
      </div>
    </section>
  );
}
