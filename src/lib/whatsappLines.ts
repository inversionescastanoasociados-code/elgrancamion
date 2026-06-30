export const WHATSAPP_LINES = [
  { num: '573117938512', display: '311 793 8512' },
  { num: '573122490402', display: '312 249 0402' },
  { num: '573137919267', display: '313 791 9267' },
  { num: '573207120779', display: '320 712 0779' },
] as const;

/** Línea única para confirmar compra de boletas en la tienda */
export const BOLETAS_WHATSAPP_LINE = WHATSAPP_LINES[0];

export function formatBoletaWhatsAppMessage(numbers: string[]): string {
  if (numbers.length === 1) {
    return `Hola, quiero el número ${numbers[0]} de la Gran Rifa Camionera.`;
  }
  return `Hola, quiero los números ${numbers.join(', ')} de la Gran Rifa Camionera.`;
}

export function pickRandomWhatsAppLine() {
  return WHATSAPP_LINES[Math.floor(Math.random() * WHATSAPP_LINES.length)];
}

export function buildWhatsAppUrl(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
