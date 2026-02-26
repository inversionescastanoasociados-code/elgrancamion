import { Suspense } from 'react';
import VerificadorBoleta from '@/components/VerificadorBoleta';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verificar Boleta — Gran Rifa Camionera',
  description:
    'Verifica la autenticidad de tu boleta escaneando el código QR o ingresando el hash de verificación.',
};

export default function VerificarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#E63946] border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderWidth: '3px' }} />
          <p className="text-[13px] text-[#888]">Cargando verificador...</p>
        </div>
      </div>
    }>
      <VerificadorBoleta />
    </Suspense>
  );
}
