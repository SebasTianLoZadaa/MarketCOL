/**
 * ============================================
 * UTILIDADES - FORMATOS (MarketCOL)
 * ============================================
 * Funciones auxiliares para formatear datos
 */

/**
 * Formatear precio en pesos colombianos
 */
export const formatCurrency = (value) => {
  const numero = parseFloat(value);
  if (isNaN(numero)) return '$0';
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numero);
};

/**
 * Formatear fecha (solo fecha)
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Formatear fecha y hora
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Obtener URL completa de la imagen
 */
const normalizeImagePath = (imagePath) => {
  if (typeof imagePath !== 'string') return '';
  return imagePath.trim().replace(/\\\\/g, '/');
};

const encodeImageUrl = (url) => {
  try {
    return encodeURI(url);
  } catch (err) {
    return url;
  }
};

const buildStaticImageCandidates = (imagePath) => {
  const normalized = normalizeImagePath(imagePath);
  const base = `/images/${normalized}`;
  const encodedBase = encodeImageUrl(base);
  const extMatch = normalized.match(/\.(png|jpg|jpeg|webp)$/i);
  if (!extMatch) {
    return [encodedBase, encodeImageUrl(`${base}.webp`), encodeImageUrl(`${base}.jpg`), encodeImageUrl(`${base}.png`)];
  }

  const originalExt = extMatch[0].toLowerCase();
  const baseWithoutExt = encodedBase.replace(new RegExp(`${originalExt}$`, 'i'), '');
  const candidates = [encodedBase];
  if (originalExt !== '.webp') candidates.push(`${baseWithoutExt}.webp`);
  if (originalExt !== '.jpg') candidates.push(`${baseWithoutExt}.jpg`);
  if (originalExt !== '.png') candidates.push(`${baseWithoutExt}.png`);
  if (originalExt !== '.jpeg') candidates.push(`${baseWithoutExt}.jpeg`);
  return candidates;
};

export const getImageUrlCandidates = (imagePath) => {
  if (!imagePath) return ['https://via.placeholder.com/200x200?text=No+Image'];
  if (imagePath.startsWith('http')) return [encodeImageUrl(imagePath)];

  if (imagePath.startsWith('/images/')) return [encodeImageUrl(imagePath)];
  if (imagePath.includes('/') && !imagePath.startsWith('uploads/')) {
    return buildStaticImageCandidates(imagePath);
  }

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  try {
    const u = new URL(apiUrl);
    const base = u.origin;
    return [encodeImageUrl(`${base}/uploads/${normalizeImagePath(imagePath)}`)];
  } catch (err) {
    return [encodeImageUrl(`http://localhost:5000/uploads/${normalizeImagePath(imagePath)}`)];
  }
};

export const getImageUrl = (imagePath) => {
  return getImageUrlCandidates(imagePath)[0];
};

/**
 * Validar email
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validar teléfono colombiano (10 dígitos, iniciando con 3)
 */
export const isValidPhone = (phone) => {
  const re = /^3\d{9}$/;
  return re.test(phone);
};

/**
 * Obtener badge de estado de pedido (MarketCOL)
 */
export const getEstadoBadge = (estado) => {
  const badges = {
    pendiente: 'warning',
    preparando: 'info',
    listo: 'primary',
    entregado: 'success',
    cancelado: 'danger',
  };
  return badges[estado] || 'secondary';
};

/**
 * Obtener texto de estado de pedido (MarketCOL)
 */
export const getEstadoTexto = (estado) => {
  const textos = {
    pendiente: 'Pendiente',
    preparando: 'Preparando',
    listo: 'Listo para recoger',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  };
  return textos[estado] || estado;
};

/**
 * Obtener badge de estado de pago
 */
export const getEstadoPagoBadge = (estadoPago) => {
  return estadoPago === 'confirmado' ? 'success' : 'warning';
};

/**
 * Obtener texto de estado de pago
 */
export const getEstadoPagoTexto = (estadoPago) => {
  return estadoPago === 'confirmado' ? 'Confirmado' : 'Pendiente';
};

/**
 * Obtener badge de rol de usuario
 */
export const getRolBadge = (rol) => {
  const badges = {
    administrador: 'danger',
    auxiliar: 'warning',
    cliente: 'info',
  };
  return badges[rol] || 'secondary';
};

/**
 * Obtener texto de rol de usuario
 */
export const getRolTexto = (rol) => {
  const textos = {
    administrador: 'Administrador',
    auxiliar: 'Auxiliar',
    cliente: 'Cliente',
  };
  return textos[rol] || rol;
};

/**
 * Truncar texto con puntos suspensivos
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalizar primera letra de cada palabra
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  return text.replace(/\b\w/g, char => char.toUpperCase());
};