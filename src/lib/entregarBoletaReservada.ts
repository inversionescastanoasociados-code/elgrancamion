import { descargarBoletaPDF, descargarTodasPDF, type BoletaPDFData } from '@/lib/boletaPDF';
import { VENTAS_ONLINE_API_BASE, VENTAS_ONLINE_API_KEY } from '@/lib/ventasOnlineApi';

interface BoletaPublica {
  id: string;
  numero: number;
  estado: string;
  qr_url: string;
  barcode: string;
  imagen_url?: string | null;
  precio_boleta: number;
  total_pagado: number;
  saldo_pendiente: number;
}

interface RifaGroupPublica {
  rifa_id: string;
  rifa_nombre: string;
  precio_boleta: number;
  fecha_sorteo: string;
  premio_principal: string;
  boletas: BoletaPublica[];
}

interface ClienteBoletasResponse {
  success: boolean;
  message?: string;
  data: {
    cliente: { nombre: string; identificacion: string } | null;
    rifas: RifaGroupPublica[];
    total_boletas: number;
  };
}

function toPDF(
  boleta: BoletaPublica,
  rifa: RifaGroupPublica,
  cliente: { nombre: string; identificacion: string },
): BoletaPDFData {
  return {
    numero: boleta.numero,
    estado: boleta.estado,
    qr_url: boleta.qr_url,
    barcode: boleta.barcode,
    precio_boleta: boleta.precio_boleta,
    total_pagado: boleta.total_pagado,
    saldo_pendiente: boleta.saldo_pendiente,
    rifaNombre: rifa.rifa_nombre,
    fechaSorteo: rifa.fecha_sorteo,
    premio: rifa.premio_principal,
    clienteNombre: cliente.nombre,
    clienteIdentificacion: cliente.identificacion,
    imagenUrl: boleta.imagen_url || null,
  };
}

/** Obtiene boletas del cliente (incluye RESERVADA) vía API pública */
export async function fetchBoletasPorCedula(identificacion: string) {
  const res = await fetch(
    `${VENTAS_ONLINE_API_BASE}/api/public/cliente/${encodeURIComponent(identificacion)}/boletas`,
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VENTAS_ONLINE_API_KEY,
      },
    },
  );
  const json = (await res.json()) as ClienteBoletasResponse;
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'No se pudieron cargar las boletas');
  }
  return json.data;
}

/**
 * Tras crear reserva: descarga PDF de las boletas recién reservadas (por número).
 * Reintenta porque el backend puede tardar unos segundos en generar QR.
 */
export async function entregarBoletasReservadas(
  identificacion: string,
  numerosReservados: number[],
  maxIntentos = 4,
): Promise<{ descargadas: number; pendiente: boolean }> {
  const numerosSet = new Set(numerosReservados);
  let delay = 800;

  for (let intento = 0; intento < maxIntentos; intento++) {
    const data = await fetchBoletasPorCedula(identificacion);
    if (!data.cliente) return { descargadas: 0, pendiente: true };

    const pdfs: BoletaPDFData[] = [];
    for (const rifa of data.rifas) {
      for (const b of rifa.boletas) {
        if (numerosSet.has(b.numero) && b.qr_url) {
          pdfs.push(toPDF(b, rifa, data.cliente));
        }
      }
    }

    if (pdfs.length >= numerosReservados.length) {
      if (pdfs.length === 1) {
        await descargarBoletaPDF(pdfs[0]);
      } else {
        await descargarTodasPDF(pdfs, data.cliente.nombre, data.cliente.identificacion);
      }
      return { descargadas: pdfs.length, pendiente: false };
    }

    await new Promise((r) => setTimeout(r, delay));
    delay *= 1.5;
  }

  return { descargadas: 0, pendiente: true };
}
