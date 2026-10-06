import BoletasShop from '@/components/BoletasShop';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comprar Boletas — Gran Rifa Camionera Proyecto 3',
  description:
    'Reserva en línea, recibe tu boleta digital y paga por WhatsApp. Boleta $150.000 · Proyecto 3.',
};

export default function BoletasPage() {
  return <BoletasShop />;
}
