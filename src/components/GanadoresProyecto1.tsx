'use client';

import GanadoresSection, { type GanadorEntry } from '@/components/GanadoresSection';

const winners: GanadorEntry[] = [
  {
    id: 'crucero',
    tag: 'Anticipado · Proyecto 1',
    prize: 'Crucero por el Caribe',
    name: 'Alejandro Gallego',
    ticket: '8943',
    note: 'Eligió el premio en efectivo',
    video: '/uploads/ganadores/alejandro-gallego.MP4',
    shareUrl: 'https://www.facebook.com/share/v/18sNUfKt7R/?mibextid=wwXIfr',
    accent: '#25D366',
  },
  {
    id: 'mayor',
    tag: 'Premio mayor · Proyecto 1',
    prize: 'Premio Mayor',
    name: 'Brayan Cano',
    ticket: '4224',
    video: '/uploads/ganadores/brayan-cano.MP4',
    shareUrl: 'https://www.facebook.com/share/v/1DtKNaYpTo/?mibextid=wwXIfr',
    accent: '#FFB703',
  },
];

export default function GanadoresProyecto1() {
  return (
    <GanadoresSection
      sectionId="ganadores-proyecto-1"
      title="Ganadores Proyecto 1"
      subtitle="Conoce a quienes ya ganaron con la Gran Rifa Camionera"
      winners={winners}
    />
  );
}
