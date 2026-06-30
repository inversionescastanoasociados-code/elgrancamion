'use client';

import Image from 'next/image';
import { CAMION_PRINCIPAL, KIA_PICANTO, HYUNDAI_I10 } from '@/lib/prizeAssets';

const prizes = [
  {
    id: 'hyundai',
    tag: 'Anticipado · 12 ago',
    tagColor: 'text-[#25D366] bg-[#25D366]/10',
    title: 'Hyundai i10 Attraction',
    desc: '0km · Full equipo · Sorteo 12 de agosto',
    image: HYUNDAI_I10,
  },
  {
    id: 'camion',
    tag: 'Premio mayor · 3 oct',
    tagColor: 'text-truck-red bg-truck-red/10',
    title: 'Camión FVR',
    desc: 'Papeles al día · Listo para trabajar',
    image: CAMION_PRINCIPAL,
  },
  {
    id: 'kia',
    tag: 'Premio mayor · 3 oct',
    tagColor: 'text-[#B87A00] bg-[#FFB703]/10',
    title: 'Kia Picanto 0km',
    desc: 'Full equipo · Matrícula incluida',
    image: KIA_PICANTO,
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
            Una boleta de $130.000 · Dos sorteos
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
