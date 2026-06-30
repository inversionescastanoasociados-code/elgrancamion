import SimpleBoletasShop from '@/components/SimpleBoletasShop';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comprar Boletas — Gran Rifa Camionera 2da Rifa',
  description:
    'Elige tu número, confirma y compra por WhatsApp. Camión FVR + Kia Picanto (3 oct) · Hyundai i10 anticipado (15 de agosto).',
};

export default function BoletasPage() {
  return <SimpleBoletasShop />;
}
