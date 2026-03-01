'use client';

import { useState } from 'react';
import { getStorageImageUrl } from '../lib/storageImageUrl';

/* ═══════════════════════════════════════════════════
   BOLETA TICKET — Visual ticket component
   Renders as 800x352px for high-res PNG capture
═══════════════════════════════════════════════════ */

interface BoletaTicketProps {
  qrUrl: string;
  barcode: string;
  numero: number;
  imagenUrl?: string | null;
  rifaNombre: string;
  estado: string;
  clienteInfo?: {
    nombre: string;
    identificacion?: string;
  } | null;
  deuda?: number | string | null;
  reservadaHasta?: string | null;
  precio?: number | null;
}

export default function BoletaTicket(props: BoletaTicketProps) {
  const {
    qrUrl,
    barcode,
    numero,
    imagenUrl,
    rifaNombre,
    estado,
    clienteInfo,
    deuda,
    reservadaHasta,
    precio,
  } = props;

  const [imageError, setImageError] = useState(false);
  const imagen = getStorageImageUrl(imagenUrl ?? null) ?? imagenUrl;
  const hasImagen = Boolean(imagen && imagen.trim());

  // --- Helpers ---
  const estadoNorm = (estado ?? '').toString().trim().toUpperCase();
  const deudaNum =
    typeof deuda === 'number'
      ? deuda
      : deuda
        ? Number(String(deuda).replace(/[^0-9.-]/g, '')) || null
        : null;
  const tieneCliente = Boolean(clienteInfo && (clienteInfo.nombre || clienteInfo.identificacion));

  const formatDateDisplay = (d?: string | null) => {
    if (!d) return undefined;
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return d;
    }
  };

  const reservadaHastaFmt = formatDateDisplay(reservadaHasta ?? null);

  // --- Interpretación de estados ---
  const esReservada = estadoNorm === 'RESERVADA';
  const esCancelada = estadoNorm === 'ANULADA' || estadoNorm === 'CANCELADA';

  const estadoPagadoWords = new Set(['CON_PAGO', 'PAGADA', 'PAGADO', 'VENDIDA']);
  const esPagada = (estadoPagadoWords.has(estadoNorm) || (tieneCliente && deudaNum === 0)) && tieneCliente;

  const esAbonada = estadoNorm === 'ABONADA' || (tieneCliente && typeof deudaNum === 'number' && deudaNum > 0);

  const badge = (label: string, className: string) => (
    <div className={`w-full py-1 text-center font-extrabold text-[11px] tracking-wide ${className}`}>
      {label}
    </div>
  );

  const baseText = 'text-[10px] text-center space-y-1 text-black';

  const renderEstado = () => {
    if (esCancelada) {
      return (
        <div className={baseText}>
          {badge('BOLETA CANCELADA', 'bg-red-600 text-white')}
          <p className="font-bold">Esta boleta no tiene validez</p>
        </div>
      );
    }

    if (esReservada && tieneCliente) {
      return (
        <div className={baseText}>
          {badge('RESERVADA', 'bg-blue-600 text-white')}
          <p className="font-semibold">A nombre de:</p>
          <p>{clienteInfo?.nombre ?? '—'}</p>
          <p>CC. {clienteInfo?.identificacion ?? '—'}</p>
          <p className="font-bold">Reservada hasta: {reservadaHastaFmt ?? '—'}</p>
        </div>
      );
    }

    if (esReservada && !tieneCliente) {
      return (
        <div className={baseText}>
          {badge('BLOQUEADA', 'bg-amber-200 text-black')}
          <p className="font-semibold">Boleta bloqueada momentáneamente</p>
        </div>
      );
    }

    if (esPagada) {
      return (
        <div className={baseText}>
          {badge('PAGADA', 'bg-green-700 text-white')}
          <p className="font-semibold">A nombre de:</p>
          <p>{clienteInfo?.nombre ?? '—'}</p>
          <p>CC. {clienteInfo?.identificacion ?? '—'}</p>
        </div>
      );
    }

    if (esAbonada) {
      return (
        <div className={baseText}>
          {badge('ABONADA', 'bg-orange-400 text-black')}
          <p className="font-extrabold">Deuda: {typeof deudaNum === 'number' ? `$${deudaNum.toLocaleString('es-CO')}` : '—'}</p>
          <p className="font-semibold">A nombre de:</p>
          <p>{clienteInfo?.nombre ?? '—'}</p>
          <p>CC. {clienteInfo?.identificacion ?? '—'}</p>
        </div>
      );
    }

    return (
      <div className={baseText}>
        {badge('DISPONIBLE', 'bg-emerald-300 text-black')}
      </div>
    );
  };

  // Aspect ratio: 3224 / 1417 ≈ 2.275
  // Screen size: 800 x 352 (same proportions)
  return (
    <div
      className="boleta-ticket flex border-2 border-black overflow-hidden bg-white mx-auto"
      style={{ width: '800px', height: '352px' }}
    >
      {/* LEFT PANEL */}
      <div
        className="flex-shrink-0 p-2 flex flex-col justify-between border-r-2 border-black"
        style={{ width: '179px' }}
      >
        <div className="text-[10px] text-center space-y-0.5 text-black font-medium">
          <p>- Boleta sin pagar no juega</p>
          <p>- 128 días de caducidad</p>
          <p>- Juega hasta quedar en poder del público</p>
        </div>

        {renderEstado()}

        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} className="w-20 h-20 border border-black" alt="QR" />
        </div>

        <div className="space-y-0.5">
          <div className="text-center text-lg font-extrabold text-black">
            #{numero.toString().padStart(4, '0')}
          </div>
          {typeof precio === 'number' && precio > 0 && (
            <div className="text-center text-[11px] font-bold text-black">
              ${precio.toLocaleString('es-CO')}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Imagen de la rifa */}
      <div className="flex-shrink-0 h-full" style={{ width: '621px' }}>
        {hasImagen && !imageError && imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagen}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            alt={rifaNombre}
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white">
            <div className="text-center text-black">
              <p className="text-xl font-bold">{rifaNombre}</p>
              <p>Boleta #{numero.toString().padStart(4, '0')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
