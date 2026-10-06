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
  title: 'Gran Rifa Camionera — Proyecto 3 · 2026',
  description:
    'Proyecto 3: gana un Camión FVR 0km modelo 2027 + rumba navideña el 26 de diciembre. Anticipado Hyundai i10 el 14 de noviembre. Boleta $150.000.',
  keywords: [
    'rifa', 'camión', 'rifa camionera', 'Hyundai i10', 'XBOOM',
    'Camión FVR 2027', 'rumba navideña', 'ganar camión', 'boletas', 'rifa Colombia', 'Proyecto 3',
  ],
  openGraph: {
    title: 'Gran Rifa Camionera — Proyecto 3 · 2026',
    description: 'Camión FVR 0km modelo 2027 + rumba navideña (26 de diciembre) y Hyundai i10 anticipado (14 de noviembre).',
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
