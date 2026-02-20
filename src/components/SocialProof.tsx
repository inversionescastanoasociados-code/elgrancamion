'use client';

import { useEffect, useState } from 'react';

const toasts = [
  { name: 'Carlos', city: 'Bogotá', qty: 2 },
  { name: 'María', city: 'Medellín', qty: 1 },
  { name: 'Andrés', city: 'Cali', qty: 3 },
  { name: 'Luisa', city: 'Barranquilla', qty: 1 },
  { name: 'Pedro', city: 'Bucaramanga', qty: 2 },
  { name: 'Diana', city: 'Cartagena', qty: 1 },
  { name: 'Jorge', city: 'Pereira', qty: 4 },
  { name: 'Camila', city: 'Manizales', qty: 2 },
  { name: 'Fabián', city: 'Villavicencio', qty: 1 },
  { name: 'Sandra', city: 'Ibagué', qty: 3 },
];

export default function SocialProof() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const showToast = () => {
      setCurrent((prev) => (prev + 1) % toasts.length);
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    };

    // First toast after 8 seconds
    const initialTimeout = setTimeout(showToast, 8000);

    // Then every 15-25 seconds
    const interval = setInterval(() => {
      showToast();
    }, 15000 + Math.random() * 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const toast = toasts[current];

  return (
    <div
      className={`fixed bottom-24 left-5 z-[60] transition-all duration-500 ease-out ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-10 opacity-0 pointer-events-none'
      }`}
    >
      <div className="liquid-glass rounded-xl p-3 pr-5 flex items-center gap-3 border-l-4 border-l-green-500 max-w-xs">
        <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
          <i className="fas fa-check text-green-600 text-xs" />
        </div>
        <div>
          <p className="text-[11px] text-[#999]">Hace un momento</p>
          <p className="text-[13px] font-bold text-[#1A1A1A] leading-tight">
            {toast.name} de {toast.city} compró {toast.qty}{' '}
            {toast.qty === 1 ? 'boleta' : 'boletas'}
          </p>
        </div>
      </div>
    </div>
  );
}
