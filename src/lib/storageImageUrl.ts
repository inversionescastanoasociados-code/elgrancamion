/**
 * Convierte una URL de imagen del storage del backend a una URL absoluta
 */
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)(\?|#|$)/i;

const BACKEND_URL = 'https://rifas-backend-production.up.railway.app';

export function getStorageImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();

  // Ya es URL absoluta completa al backend
  if (trimmed.startsWith(BACKEND_URL)) return trimmed;

  let filename: string | null = null;

  // URL completa que contiene /storage/
  if (trimmed.includes('/storage/')) {
    const match = trimmed.match(/\/storage\/([^?#]+)/);
    if (match) filename = match[1];
  }

  // URL completa (http(s)://...)
  if (!filename && /^https?:\/\//i.test(trimmed)) {
    try {
      const pathname = new URL(trimmed).pathname;
      const lastSegment = pathname.replace(/^\/+/, '').split('/').pop();
      if (lastSegment && IMAGE_EXT.test(lastSegment)) filename = lastSegment;
    } catch { /* ignore */ }
  }

  // Ruta /storage/xxx
  if (!filename && trimmed.startsWith('/storage/')) {
    filename = trimmed.replace('/storage/', '');
  }

  // Solo nombre de archivo
  if (!filename && !trimmed.includes('/') && IMAGE_EXT.test(trimmed)) {
    filename = trimmed;
  }

  // Path relativo
  if (!filename) {
    const pathSegment = trimmed.replace(/^\/+/, '').split('/').pop();
    if (pathSegment && IMAGE_EXT.test(pathSegment)) filename = pathSegment;
  }

  if (filename) return `${BACKEND_URL}/storage/${filename}`;
  return trimmed;
}
