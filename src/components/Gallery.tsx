'use client';

import { useState } from 'react';
import Image from 'next/image';

const galleryImages = [
  {
    src: '/uploads/IMG_7991.JPG',
    alt: 'Camión VW Worker — Vista completa',
    label: 'La Bestia',
  },
  {
    src: '/uploads/IMG_7996.JPG',
    alt: 'Camión VW Worker — Vista frontal',
    label: 'Vista Frontal',
  },
  {
    src: '/uploads/IMG_7999.JPG',
    alt: 'Camión VW Worker — Ángulo lateral',
    label: 'Lateral',
  },
  {
    src: '/uploads/IMG_7982.JPG',
    alt: 'Camión VW Worker — Detalle',
    label: 'Detalle',
  },
  {
    src: '/uploads/IMG_7983.JPG',
    alt: 'Camión VW Worker — Motor',
    label: 'Motor',
  },
  {
    src: '/uploads/IMG_7984.JPG',
    alt: 'Camión VW Worker — Interior',
    label: 'Interior',
  },
  {
    src: '/uploads/IMG_7986.JPG',
    alt: 'Camión VW Worker — Cabina',
    label: 'Cabina',
  },
  {
    src: '/uploads/IMG_7992.JPG',
    alt: 'Camión VW Worker — En ruta',
    label: 'En Ruta',
  },
  {
    src: '/uploads/IMG_8006.JPG',
    alt: 'Camión VW Worker — Perspectiva',
    label: 'Perspectiva',
  },
  {
    src: '/uploads/IMG_8008.JPG',
    alt: 'Camión VW Worker — Detalles mecánicos',
    label: 'Mecánica',
  },
  {
    src: '/uploads/IMG_8010.JPG',
    alt: 'Camión VW Worker — Plataforma',
    label: 'Plataforma',
  },
  {
    src: '/uploads/IMG_8015.JPG',
    alt: 'Camión VW Worker — Lateral trasero',
    label: 'Trasera',
  },
  {
    src: '/uploads/IMG_8021.JPG',
    alt: 'Camión VW Worker — Vista completa lateral',
    label: 'Completo',
  },
  {
    src: '/uploads/kia-picanto.jpg',
    alt: 'Kia Picanto 0km — Segundo premio',
    label: 'Kia Picanto 0km',
  },
];

export default function Gallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightbox === null) return;
    if (direction === 'prev') {
      setLightbox(lightbox === 0 ? galleryImages.length - 1 : lightbox - 1);
    } else {
      setLightbox(lightbox === galleryImages.length - 1 ? 0 : lightbox + 1);
    }
  };

  return (
    <section id="galeria" className="py-28 md:py-36 bg-[#F5F2EE]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-[clamp(40px,6vw,72px)] leading-[0.9] uppercase tracking-wider text-[#1A1A1A] mb-5"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            CONOCE AL <span className="gradient-text-red">CAMIÓN</span>
          </h2>
          <p className="text-[#666] text-lg max-w-lg mx-auto">
            Cada detalle de esta bestia que puede ser tuya. Mira las fotos reales.
          </p>
        </div>

        {/* Gallery — Masonry-style grid */}
        <div className="space-y-4">
          {/* Row 1: Large hero image */}
          <div
            className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => setLightbox(0)}
          >
            <Image
              src={galleryImages[0].src}
              alt={galleryImages[0].alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 flex items-center gap-3">
              <span className="bg-[#E63946] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Premio Principal
              </span>
              <p className="text-white/90 text-xl font-bold uppercase tracking-wider" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                {galleryImages[0].label}
              </p>
            </div>
          </div>

          {/* Row 2: 3 columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryImages.slice(1, 4).map((img, i) => (
              <div
                key={i}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => setLightbox(i + 1)}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(min-width: 768px) 33vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-bold uppercase tracking-wider" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                    {img.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Row 3: 2 wide images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {galleryImages.slice(4, 6).map((img, i) => (
              <div
                key={i}
                className="relative aspect-[16/10] rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => setLightbox(i + 4)}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-bold uppercase tracking-wider" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                    {img.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Row 4: 4 column grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryImages.slice(6, 10).map((img, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => setLightbox(i + 6)}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-xs font-bold uppercase tracking-wider" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                    {img.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Row 5: 3 columns + Kia Picanto highlight */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryImages.slice(10, 13).map((img, i) => (
              <div
                key={i}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => setLightbox(i + 10)}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-xs font-bold uppercase tracking-wider" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                    {img.label}
                  </p>
                </div>
              </div>
            ))}
            {/* Kia Picanto — highlighted */}
            <div
              className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group ring-2 ring-[#E63946]/30"
              onClick={() => setLightbox(13)}
            >
              <Image
                src={galleryImages[13].src}
                alt={galleryImages[13].alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(min-width: 768px) 25vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="bg-[#FFB703] text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  2do Premio
                </span>
                <p className="text-white text-xs font-bold uppercase tracking-wider mt-1" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                  Kia Picanto 0km
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Counter + WhatsApp link */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <p className="text-[#999] text-sm">
            <span className="font-bold text-[#1A1A1A]">{galleryImages.length}</span> fotos reales del camión y premios
          </p>
          <span className="hidden sm:inline text-[#ccc]">|</span>
          <a
            href="https://wa.me/573000000000?text=Quiero%20ver%20más%20fotos%20del%20camión"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-bold text-sm transition-colors"
          >
            <i className="fab fa-whatsapp text-lg" /> Pide más fotos por WhatsApp →
          </a>
        </div>
      </div>

      {/* Lightbox with navigation */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-5"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition z-10"
            onClick={() => setLightbox(null)}
          >
            <i className="fas fa-times text-xl" />
          </button>

          {/* Previous */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition z-10"
            onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
          >
            <i className="fas fa-chevron-left text-lg" />
          </button>

          {/* Next */}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition z-10"
            onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
          >
            <i className="fas fa-chevron-right text-lg" />
          </button>

          {/* Image */}
          <div
            className="relative max-w-5xl w-full aspect-video rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={galleryImages[lightbox].src}
              alt={galleryImages[lightbox].alt}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Counter + label */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
            <p className="text-white/90 text-lg font-bold uppercase tracking-wider" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              {galleryImages[lightbox].label}
            </p>
            <p className="text-white/40 text-sm mt-1">
              {lightbox + 1} / {galleryImages.length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
