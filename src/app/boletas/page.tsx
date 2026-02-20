import BoletasShop from '@/components/BoletasShop';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comprar Boletas — Gran Rifa Camionera',
  description:
    'Escoge tu número de la suerte y participa por un camión, un Kia Picanto 0km, $20 millones y un crucero por las Bahamas.',
};

export default function BoletasPage() {
  return <BoletasShop />;
}
