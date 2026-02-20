import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Gran Rifa Camionera — Tu Sueño Sobre Ruedas',
  description:
    'Gana un camión, un Kia Picanto 0km, $20 millones en premios y un crucero por las Bahamas. Compra tu boleta ahora.',
  keywords: [
    'rifa', 'camión', 'rifa camionera', 'Kia Picanto', 'sorteo',
    'ganar camión', 'boletas', 'crucero Bahamas', 'rifa Colombia',
  ],
  openGraph: {
    title: 'Gran Rifa Camionera — Tu Sueño Sobre Ruedas',
    description: 'Gana un camión, Kia Picanto 0km, $20 millones y un crucero por las Bahamas.',
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
        {children}
      </body>
    </html>
  );
}
