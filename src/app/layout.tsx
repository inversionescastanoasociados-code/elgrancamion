import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import WhatsAppBanner from '@/components/WhatsAppBanner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Gran Rifa Camionera — 2da Rifa 2026',
  description:
    '2da Rifa: Gana un Camión FVR + Kia Picanto 0km el 3 de octubre. Premio anticipado: Hyundai i10 Attraction 0km el 12 de agosto. Compra tu boleta ahora.',
  keywords: [
    'rifa', 'camión', 'rifa camionera', 'Kia Picanto', 'Hyundai i10',
    'Camión FVR', 'ganar camión', 'boletas', 'rifa Colombia', '2da rifa',
  ],
  openGraph: {
    title: 'Gran Rifa Camionera — 2da Rifa 2026',
    description: 'Camión FVR + Kia Picanto 0km (3 de octubre) y Hyundai i10 Attraction 0km como anticipado (12 de agosto).',
    type: 'website',
    locale: 'es_CO',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body
        className="bg-[#FAFAFA] text-[#1A1A1A] antialiased overflow-x-hidden"
        style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
      >
        <WhatsAppBanner />
        {children}
      </body>
    </html>
  );
}
