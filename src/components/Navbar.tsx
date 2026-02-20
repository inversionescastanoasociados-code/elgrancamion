'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isBoletasPage = pathname.startsWith('/boletas');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { href: '#premios', label: 'Premios' },
    { href: '#galeria', label: 'Galería' },
    { href: '#como-funciona', label: 'Cómo Funciona' },
    { href: '#confianza', label: 'FAQ' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'py-2 bg-white/90 backdrop-blur-xl border-b border-black/[0.06] shadow-sm'
          : 'py-4'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
        {/* Brand with Logo */}
        <a href="#inicio" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
            <Image
              src={scrolled ? '/uploads/logos/logo-negro.png' : '/uploads/logos/logo-blanco.png'}
              alt="Gran Rifa Camionera"
              fill
              className="object-contain transition-opacity duration-300"
              sizes="44px"
              priority
            />
          </div>
          <span
            className={`text-lg tracking-wider transition-colors hidden sm:block ${scrolled ? 'text-[#1A1A1A]' : 'text-white/90'}`}
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            GRAN RIFA <span className={scrolled ? 'text-truck-red' : 'text-truck-red'}>CAMIONERA</span>
          </span>
        </a>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`px-4 py-2 text-[13px] font-semibold tracking-wide transition-colors relative group ${scrolled ? 'text-[#666] hover:text-[#1A1A1A]' : 'text-white/50 hover:text-white'}`}
            >
              {link.label}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-truck-red rounded-full transition-all duration-300 group-hover:w-4" />
            </a>
          ))}
          <Link
            href="/boletas"
            className={`ml-2 px-4 py-2 text-[13px] font-bold tracking-wide transition-all relative group ${
              isBoletasPage
                ? 'text-truck-red'
                : scrolled ? 'text-truck-red hover:text-red-700' : 'text-warning-yellow hover:text-yellow-300'
            }`}
          >
            <i className="fas fa-store text-[10px] mr-1" />
            Tienda
            <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-truck-red rounded-full transition-all duration-300 ${isBoletasPage ? 'w-6' : 'w-0 group-hover:w-4'}`} />
          </Link>
        </div>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/boletas"
            className="btn-primary text-[12px] px-6 py-2.5"
          >
            <i className="fas fa-ticket text-[10px]" />
            Comprar Boleta
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
          aria-label="Menu"
        >
          <span className={`w-5 h-[1.5px] transition-all duration-300 ${scrolled ? 'bg-[#333]' : 'bg-white/70'} ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`w-5 h-[1.5px] transition-all duration-300 ${scrolled ? 'bg-[#333]' : 'bg-white/70'} ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`w-5 h-[1.5px] transition-all duration-300 ${scrolled ? 'bg-[#333]' : 'bg-white/70'} ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-black/[0.06] shadow-lg transition-all duration-400 overflow-hidden ${
        mobileOpen ? 'max-h-[400px] py-6' : 'max-h-0 py-0'
      }`}>
        <div className="flex flex-col items-center gap-4 px-6">
          {/* Logo in mobile menu */}
          <div className="relative w-14 h-14 mb-2">
            <Image
              src="/uploads/logos/logo-principal.png"
              alt="Gran Rifa Camionera"
              fill
              className="object-contain"
              sizes="56px"
            />
          </div>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-[15px] font-semibold text-[#555] hover:text-[#1A1A1A] tracking-wide transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/boletas"
            onClick={() => setMobileOpen(false)}
            className="text-[15px] font-bold text-truck-red hover:text-red-700 tracking-wide transition-colors flex items-center gap-2"
          >
            <i className="fas fa-store text-[12px]" />
            Tienda de Boletas
          </Link>
          <Link
            href="/boletas"
            onClick={() => setMobileOpen(false)}
            className="btn-primary text-[13px] px-8 py-3 mt-2 w-full text-center justify-center"
          >
            <i className="fas fa-ticket text-xs" />
            Comprar Boleta
          </Link>
        </div>
      </div>
    </nav>
  );
}
