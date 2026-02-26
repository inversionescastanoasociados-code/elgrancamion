import BoletaVerificada from '@/components/BoletaVerificada';
import type { Metadata } from 'next';

interface Props {
  params: { hash: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Verificación de Boleta — Gran Rifa Camionera',
    description: `Verificación de autenticidad de boleta. Código: ${params.hash.substring(0, 8)}...`,
    robots: { index: false, follow: false },
  };
}

export default function VerificarHashPage({ params }: Props) {
  return <BoletaVerificada hash={params.hash} />;
}
