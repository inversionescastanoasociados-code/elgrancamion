'use client';

import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="py-16 bg-[#0e0e10] border-t border-white/[0.06] relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[2px] bg-gradient-to-r from-transparent via-truck-red/20 to-transparent" />

      <div className="max-w-[1000px] mx-auto px-6">
        {/* Top: Logo + brand */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20">
            <Image
              src="/uploads/logos/logo-blanco.png"
              alt="Gran Rifa Camionera"
              fill
              className="object-contain"
              sizes="80px"
            />
          </div>
          <span
            className="text-2xl tracking-wider text-white/80"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            GRAN RIFA <span className="text-truck-red">CAMIONERA</span>
          </span>
          <p className="text-[13px] text-white/30 max-w-md text-center">
            La rifa más grande de Colombia. Tu oportunidad de cambiar tu vida con una sola boleta.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

        {/* Links + Social */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { href: '#premios', label: 'Premios' },
              { href: '#galeria', label: 'Galería' },
              { href: '#como-funciona', label: 'Cómo Funciona' },
              { href: '#confianza', label: 'FAQ' },
            ].map((link, i) => (
              <a
                key={i}
                href={link.href}
                className="text-[13px] text-white/35 hover:text-white/60 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Social */}
          <div className="flex justify-center gap-4">
            {[
              { icon: 'fa-facebook-f', href: '#' },
              { icon: 'fa-instagram', href: '#' },
              { icon: 'fa-tiktok', href: '#' },
              { icon: 'fa-whatsapp', href: 'https://wa.me/573000000000' },
            ].map((social, i) => (
              <a
                key={i}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/35 hover:text-white/70 hover:border-white/25 transition-all duration-300 text-sm"
              >
                <i className={`fab ${social.icon}`} />
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-[12px] text-white/20">
            © {new Date().getFullYear()} Gran Rifa Camionera. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
