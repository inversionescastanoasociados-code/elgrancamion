const camion = (file: string) => `/uploads/camion/${encodeURIComponent(file)}`;

export const PROJECT_NAME = 'Proyecto 3';
export const TICKET_PRICE = 150000;
export const ANTICIPADO_DATE = new Date('2026-11-14T22:00:00-05:00');
export const GRAN_PREMIO_DATE = new Date('2026-12-26T22:00:00-05:00');

export const CAMION_PRINCIPAL = camion('IMG_9197.JPEG');
export const CAMION_FVR = camion('IMG_9194.JPEG');
export const CAMION_FVR2 = camion('IMG_9198.JPEG');

export const CAMION_GALLERY = [
  { src: CAMION_PRINCIPAL, label: 'Camión FVR 2027', alt: 'Camión FVR 0km modelo 2027 — Foto principal' },
  { src: camion('IMG_9191.JPEG'), label: 'Camión FVR 2027', alt: 'Camión FVR 0km modelo 2027 — Vista exterior' },
  { src: camion('IMG_9198.JPEG'), label: 'Camión FVR 2027', alt: 'Camión FVR 0km modelo 2027 — Vista completa' },
  { src: camion('IMG_9192.JPEG'), label: 'Camión FVR 2027', alt: 'Camión FVR 0km modelo 2027 — Vista frontal izquierda' },
  { src: camion('IMG_9193.JPEG'), label: 'Camión FVR 2027', alt: 'Camión FVR 0km modelo 2027 — Vista frontal' },
  { src: camion('IMG_9194.JPEG'), label: 'Camión FVR 2027', alt: 'Camión FVR 0km modelo 2027 — Frente' },
  { src: camion('IMG_9195.JPEG'), label: 'Camión FVR 2027', alt: 'Camión FVR 0km modelo 2027 — Vista lateral' },
  { src: camion('IMG_9196.JPEG'), label: 'Camión FVR 2027', alt: 'Camión FVR 0km modelo 2027 — Luces encendidas' },
  { src: camion('IMG_9199.JPEG'), label: 'Camión FVR 2027', alt: 'Camión FVR 0km modelo 2027 — Vista panorámica' },
];

export const HYUNDAI_I10 = '/uploads/hyundai/hyundai_i10_color_2_d4fe2fcc76.webp';
