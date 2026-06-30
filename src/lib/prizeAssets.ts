const camion = (file: string) => `/uploads/camion/${encodeURIComponent(file)}`;

export const CAMION_PRINCIPAL = '/uploads/camion/principal.jpeg';
export const CAMION_FVR = '/uploads/camion/fvr.png';
export const CAMION_FVR2 = '/uploads/camion/fvr2.jpg';

export const CAMION_GALLERY = [
  { src: CAMION_PRINCIPAL, label: 'Camión FVR', alt: 'Camión FVR — Foto principal' },
  { src: CAMION_FVR, label: 'Camión FVR', alt: 'Camión FVR — Vista frontal' },
  { src: CAMION_FVR2, label: 'Camión FVR', alt: 'Camión FVR — Detalle' },
  { src: camion('WhatsApp Image 2026-06-24 at 16.13.30.jpeg'), label: 'Camión FVR', alt: 'Camión FVR' },
  { src: camion('WhatsApp Image 2026-06-24 at 16.13.30 (1).jpeg'), label: 'Camión FVR', alt: 'Camión FVR' },
  { src: camion('WhatsApp Image 2026-06-24 at 16.13.30 (2).jpeg'), label: 'Camión FVR', alt: 'Camión FVR' },
  { src: camion('WhatsApp Image 2026-06-24 at 16.13.30 (3).jpeg'), label: 'Camión FVR', alt: 'Camión FVR' },
  { src: camion('WhatsApp Image 2026-06-24 at 16.13.31.jpeg'), label: 'Camión FVR', alt: 'Camión FVR' },
  { src: camion('WhatsApp Image 2026-06-24 at 16.13.31 (1).jpeg'), label: 'Camión FVR', alt: 'Camión FVR' },
  { src: camion('WhatsApp Image 2026-06-24 at 16.13.31 (2).jpeg'), label: 'Camión FVR', alt: 'Camión FVR' },
];

export const KIA_PICANTO = '/uploads/kia/KIA_2026.png';
export const HYUNDAI_I10 = '/uploads/hyundai/hyundai_i10_color_2_d4fe2fcc76.webp';

export const ANTICIPADO_DATE = new Date('2026-08-15T22:00:00');
export const GRAN_PREMIO_DATE = new Date('2026-10-03T22:00:00');
