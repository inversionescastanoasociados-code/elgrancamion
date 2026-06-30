'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CAMION_GALLERY, CAMION_PRINCIPAL } from '@/lib/prizeAssets';

export default function Gallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <section id="galeria" className="py-20 sm:py-28 bg-[#F5F2EE]">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="mb-10">
          <h2
            className="text-[clamp(36px,6vw,56px)] uppercase tracking-wide text-[#1A1A1A]"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            Galería del camión
          </h2>
          <p className="mt-2 text-[#777] text-base">{CAMION_GALLERY.length} fotos reales</p>
        </div>

        <div
          className="relative aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer mb-4 group"
          onClick={() => setLightbox(0)}
        >
          <Image
            src={CAMION_PRINCIPAL}
            alt="Camión FVR"
            fill
            className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
            sizes="100vw"
            priority
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {CAMION_GALLERY.slice(1).map((img, i) => (
            <div
              key={img.src}
              className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => setLightbox(i + 1)}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                sizes="(min-width: 768px) 25vw, 50vw"
              />
            </div>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <i className="fas fa-times" />
          </button>
          <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <Image
              src={CAMION_GALLERY[lightbox].src}
              alt={CAMION_GALLERY[lightbox].alt}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
        </div>
      )}
    </section>
  );
}
