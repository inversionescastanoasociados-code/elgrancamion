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
    video: '/uploads/ganadores/hernan.MP4',
    shareUrl: 'https://www.facebook.com/share/r/1DkhG6CyQF/?mibextid=wwXIfr',
    accent: '#E63946',
  },
];

export default function GanadoresProyecto2() {
  return (
    <GanadoresSection
      sectionId="ganadores-proyecto-2"
      title="Ganadores Proyecto 2"
      subtitle="Ganadores de la 2da rifa — Camión FVR + Kia Picanto y premio anticipado Hyundai i10"
      winners={winners}
    />
  );
}
