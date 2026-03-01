'use client';

import jsPDF from 'jspdf';

/* ═══════════════════════════════════════════════════════════════
   BOLETA PDF GENERATOR — Diseño oficial de boleta
   
   Replica el diseño original de BoletaTicket exactamente:
   ┌─────────────────┬─────────────────────────────────────────┐
   │  PANEL IZQUIERDO │           PANEL DERECHO                │
   │  (reglas, estado │    (imagen de la rifa o nombre)        │
   │   QR, número,    │                                        │
   │   precio)        │                                        │
   └─────────────────┴─────────────────────────────────────────┘
   
   Proporciones originales: 800x352px → ratio 2.27:1
   En PDF: 200mm x 88mm (landscape)
   Panel izquierdo: ~45mm | Panel derecho: ~155mm
═══════════════════════════════════════════════════════════════ */

export interface BoletaPDFData {
  numero: number;
  estado: string;
  qr_url: string;
  barcode: string;
  precio_boleta: number;
  total_pagado: number;
  saldo_pendiente: number;
  rifaNombre: string;
  fechaSorteo: string;
  premio?: string | null;
  clienteNombre: string;
  clienteIdentificacion: string;
  imagenUrl?: string | null;
}

// ─── Dimensiones del ticket en mm ──────────────────────
const TICKET_W = 200;
const TICKET_H = 88;
const LEFT_W = 45; // Panel izquierdo (proporcional a 179/800 * 200)
const RIGHT_W = TICKET_W - LEFT_W; // Panel derecho
const BORDER = 0.5;

// ─── Helpers ───────────────────────────────────────────
function padNum(n: number): string {
  return n.toString().padStart(4, '0');
}

function formatCOP(n: number): string {
  return '$' + n.toLocaleString('es-CO');
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Estado interpretation (matching original logic) ───
function interpretEstado(data: BoletaPDFData) {
  const norm = (data.estado ?? '').toString().trim().toUpperCase();
  const tieneCliente = Boolean(data.clienteNombre && data.clienteNombre !== 'N/A');
  const deuda = data.saldo_pendiente;

  const pagadoWords = new Set(['CON_PAGO', 'PAGADA', 'PAGADO', 'VENDIDA']);
  const esCancelada = norm === 'ANULADA' || norm === 'CANCELADA';
  const esReservada = norm === 'RESERVADA';
  const esPagada = (pagadoWords.has(norm) || (tieneCliente && deuda === 0)) && tieneCliente;
  const esAbonada = norm === 'ABONADA' || (tieneCliente && typeof deuda === 'number' && deuda > 0);

  if (esCancelada) return { type: 'CANCELADA' as const, label: 'BOLETA CANCELADA', color: [220, 38, 38] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] };
  if (esReservada && tieneCliente) return { type: 'RESERVADA' as const, label: 'RESERVADA', color: [37, 99, 235] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] };
  if (esReservada && !tieneCliente) return { type: 'BLOQUEADA' as const, label: 'BLOQUEADA', color: [253, 224, 71] as [number, number, number], textColor: [0, 0, 0] as [number, number, number] };
  if (esPagada) return { type: 'PAGADA' as const, label: 'PAGADA', color: [21, 128, 61] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] };
  if (esAbonada) return { type: 'ABONADA' as const, label: 'ABONADA', color: [251, 146, 60] as [number, number, number], textColor: [0, 0, 0] as [number, number, number] };
  return { type: 'DISPONIBLE' as const, label: 'DISPONIBLE', color: [110, 231, 183] as [number, number, number], textColor: [0, 0, 0] as [number, number, number] };
}

// ═══════════════════════════════════════════════════════
//  DRAW A SINGLE BOLETA ON A PAGE
// ═══════════════════════════════════════════════════════
async function drawBoletaOnPage(doc: jsPDF, data: BoletaPDFData, ox: number, oy: number) {
  const estado = interpretEstado(data);
  const tieneCliente = Boolean(data.clienteNombre && data.clienteNombre !== 'N/A');

  // ─── Outer border ────────────────────────────────
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(BORDER);
  doc.setFillColor(255, 255, 255);
  doc.rect(ox, oy, TICKET_W, TICKET_H, 'FD');

  // ─── Divider line between panels ─────────────────
  doc.setLineWidth(BORDER);
  doc.line(ox + LEFT_W, oy, ox + LEFT_W, oy + TICKET_H);

  // ═══════════════════════════════════════════════════
  //  LEFT PANEL
  // ═══════════════════════════════════════════════════
  const lx = ox + 2; // left margin
  const lw = LEFT_W - 4; // usable width
  let ly = oy + 4; // cursor y

  // ─── Rules text ──────────────────────────────────
  doc.setFontSize(5.5);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const rules = [
    '- Boleta sin pagar no juega',
    '- 128 días de caducidad',
    '- Juega hasta quedar en',
    '  poder del público',
  ];
  for (const rule of rules) {
    doc.text(rule, ox + LEFT_W / 2, ly, { align: 'center' });
    ly += 3;
  }

  ly += 1.5;

  // ─── Estado badge ────────────────────────────────
  const badgeH = 5;
  doc.setFillColor(...estado.color);
  doc.rect(lx, ly, lw, badgeH, 'F');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...estado.textColor);
  doc.text(estado.label, ox + LEFT_W / 2, ly + 3.5, { align: 'center' });
  ly += badgeH + 2;

  // ─── Estado-specific content ─────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(5.5);

  if (estado.type === 'CANCELADA') {
    doc.setFont('helvetica', 'bold');
    doc.text('Esta boleta no tiene validez', ox + LEFT_W / 2, ly, { align: 'center' });
    ly += 4;
  } else if (estado.type === 'BLOQUEADA') {
    doc.setFont('helvetica', 'normal');
    doc.text('Boleta bloqueada', ox + LEFT_W / 2, ly, { align: 'center' });
    doc.text('momentáneamente', ox + LEFT_W / 2, ly + 3, { align: 'center' });
    ly += 7;
  } else if (estado.type === 'PAGADA' && tieneCliente) {
    doc.setFont('helvetica', 'normal');
    doc.text('A nombre de:', ox + LEFT_W / 2, ly, { align: 'center' });
    ly += 3;
    doc.setFont('helvetica', 'normal');
    const nameLines = doc.splitTextToSize(data.clienteNombre, lw - 2);
    for (const line of nameLines.slice(0, 2)) {
      doc.text(line, ox + LEFT_W / 2, ly, { align: 'center' });
      ly += 3;
    }
    doc.text(`CC. ${data.clienteIdentificacion}`, ox + LEFT_W / 2, ly, { align: 'center' });
    ly += 4;
  } else if (estado.type === 'ABONADA' && tieneCliente) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Deuda: ${formatCOP(data.saldo_pendiente)}`, ox + LEFT_W / 2, ly, { align: 'center' });
    ly += 3;
    doc.setFont('helvetica', 'normal');
    doc.text('A nombre de:', ox + LEFT_W / 2, ly, { align: 'center' });
    ly += 3;
    const nameLines = doc.splitTextToSize(data.clienteNombre, lw - 2);
    for (const line of nameLines.slice(0, 2)) {
      doc.text(line, ox + LEFT_W / 2, ly, { align: 'center' });
      ly += 3;
    }
    doc.text(`CC. ${data.clienteIdentificacion}`, ox + LEFT_W / 2, ly, { align: 'center' });
    ly += 4;
  } else if (estado.type === 'RESERVADA' && tieneCliente) {
    doc.setFont('helvetica', 'normal');
    doc.text('A nombre de:', ox + LEFT_W / 2, ly, { align: 'center' });
    ly += 3;
    const nameLines = doc.splitTextToSize(data.clienteNombre, lw - 2);
    for (const line of nameLines.slice(0, 2)) {
      doc.text(line, ox + LEFT_W / 2, ly, { align: 'center' });
      ly += 3;
    }
    doc.text(`CC. ${data.clienteIdentificacion}`, ox + LEFT_W / 2, ly, { align: 'center' });
    ly += 4;
  }

  // ─── QR Code ─────────────────────────────────────
  const qrSize = 20;
  const qrX = ox + (LEFT_W - qrSize) / 2;
  // Position QR dynamically but with minimum position
  const qrY = Math.max(ly, oy + 48);

  const qrBase64 = await loadImageAsBase64(data.qr_url);
  if (qrBase64) {
    // QR border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(qrX - 0.5, qrY - 0.5, qrSize + 1, qrSize + 1, 'S');
    doc.addImage(qrBase64, 'PNG', qrX, qrY, qrSize, qrSize);
  }

  // ─── Boleta number ───────────────────────────────
  const numY = qrY + qrSize + 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`#${padNum(data.numero)}`, ox + LEFT_W / 2, numY, { align: 'center' });

  // ─── Precio ──────────────────────────────────────
  if (data.precio_boleta > 0) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCOP(data.precio_boleta), ox + LEFT_W / 2, numY + 5, { align: 'center' });
  }

  // ═══════════════════════════════════════════════════
  //  RIGHT PANEL — Imagen de la rifa
  // ═══════════════════════════════════════════════════
  const rx = ox + LEFT_W + BORDER;
  const rw = RIGHT_W - BORDER;
  const rh = TICKET_H - BORDER * 2;
  const ry = oy + BORDER;

  // Try to load the rifa image
  let rifaImgLoaded = false;
  if (data.imagenUrl) {
    const imgBase64 = await loadImageAsBase64(data.imagenUrl);
    if (imgBase64) {
      try {
        doc.addImage(imgBase64, 'JPEG', rx, ry, rw, rh);
        rifaImgLoaded = true;
      } catch {
        // fallback to text
      }
    }
  }

  // Fallback: show rifa name and boleta number
  if (!rifaImgLoaded) {
    doc.setFillColor(250, 250, 250);
    doc.rect(rx, ry, rw, rh, 'F');

    // Rifa name large
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 26, 26);
    const rifaLines = doc.splitTextToSize(data.rifaNombre, rw - 20);
    const textBlockH = rifaLines.length * 8;
    const startTextY = ry + (rh / 2) - (textBlockH / 2);
    for (let i = 0; i < Math.min(rifaLines.length, 3); i++) {
      doc.text(rifaLines[i], rx + rw / 2, startTextY + i * 8, { align: 'center' });
    }

    // Boleta number below
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Boleta #${padNum(data.numero)}`, rx + rw / 2, startTextY + textBlockH + 5, { align: 'center' });

    // Premio if available
    if (data.premio) {
      doc.setFontSize(8);
      doc.setTextColor(184, 122, 0);
      doc.text(`🏆 ${data.premio}`, rx + rw / 2, startTextY + textBlockH + 12, { align: 'center' });
    }

    // Sorteo date
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    const sorteoDate = new Date(data.fechaSorteo).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc.text(`Sorteo: ${sorteoDate}`, rx + rw / 2, ry + rh - 5, { align: 'center' });
  }
}

// ═══════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════

export async function generarBoletaPDF(boleta: BoletaPDFData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [TICKET_H, TICKET_W] });
  await drawBoletaOnPage(doc, boleta, 0, 0);
  return doc;
}

export async function generarTodasBoletasPDF(boletas: BoletaPDFData[]): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [TICKET_H, TICKET_W] });
  for (let i = 0; i < boletas.length; i++) {
    if (i > 0) doc.addPage([TICKET_H, TICKET_W], 'landscape');
    await drawBoletaOnPage(doc, boletas[i], 0, 0);
  }
  return doc;
}

export async function descargarBoletaPDF(boleta: BoletaPDFData) {
  const doc = await generarBoletaPDF(boleta);
  doc.save(`boleta_${padNum(boleta.numero)}_CC_${boleta.clienteIdentificacion}.pdf`);
}

export async function descargarTodasPDF(
  boletas: BoletaPDFData[],
  clienteNombre: string,
  clienteCC: string,
) {
  const doc = await generarTodasBoletasPDF(boletas);
  doc.save(`boletas_CC_${clienteCC}_${boletas.length}_boletas.pdf`);
}
