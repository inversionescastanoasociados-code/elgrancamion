'use client';

import GanadoresSection, { type GanadorEntry } from '@/components/GanadoresSection';

const winners: GanadorEntry[] = [
  {
    id: 'hyundai-anticipado',
    tag: 'Anticipado · Proyecto 2',
    prize: 'Hyundai i10 Attraction 0km',
    name: 'Hernán',
    ticket: '2984',
    delivered: true,
    image: '/uploads/hyundai/hyundai_i10_color_2_d4fe2fcc76.webp',
    shareUrl: 'https://www.facebook.com/share/r/1DkhG6CyQF/?mibextid=wwXIfr',
    accent: '#E63946',
  },
  {
    id: 'premio-mayor',
    tag: 'Premio mayor · Proyecto 2',
    prize: 'Camión FVR + Kia Picanto 0km',
    name: 'Hernán',
    ticket: '7394',
    delivered: true,
    image: '/uploads/kia/KIA_2026.png',
    accent: '#FFB703',
  },
];

export default function GanadoresProyecto2() {
  return (
    <GanadoresSection
      sectionId="ganadores-proyecto-2"
      title="Ganadores Proyecto 2"
      subtitle="Proyecto finalizado — Hyundai i10 anticipado y premio mayor Camión FVR + Kia Picanto entregados"
      winners={winners}
    />
  );
}
