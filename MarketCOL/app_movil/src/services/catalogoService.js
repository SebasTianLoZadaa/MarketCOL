/**
 * Servicio de Catálogo (Público) - MarketCOL
 * 
 * Gestiona las consultas públicas del catálogo:
 * - Obtener categorías y productos con filtros
 * - Construir URLs válidas para imágenes del backend
 */

import apiClient from '../api/apiClient';
import { API_BASE_URL } from '../utils/constants';

const normalizeImagePath = (imagePath = '') => {
    if (typeof imagePath !== 'string') return '';
    return imagePath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
};

const getBackendOrigin = () => {
    try {
        return new URL(API_BASE_URL).origin;
    } catch (error) {
        return 'http://10.0.2.2:5000';
    }
};

const catalogoService = {
    /**
     * Obtener todas las categorías activas
     * @returns {Promise<Array>} Array de categorías
     */
    getCategorias: async () => {
        const response = await apiClient.get('/catalogo/categorias');
        const payload = response.data?.data || response.data || {};
        return payload.categorias || [];
    },

    /**
     * Obtener productos del catálogo con filtros opcionales
     * @param {Object} params - Filtros: categoriaId, subcategoriaId, buscar, precioMin, precioMax, pagina, limite
     * @returns {Promise<Object>} { productos: Array, paginacion: Object }
     */
    getProductos: async (params = {}) => {
        const response = await apiClient.get('/catalogo/productos', { params });
        const payload = response.data?.data || response.data || {};
        const productos = payload.productos || [];
        const paginacion = payload.paginacion || { total: 0, pagina: 1, totalPaginas: 1 };
        return { productos, paginacion };
    },

    /**
     * Obtener un producto específico por ID
     * @param {number} id - ID del producto
     * @returns {Promise<Object>} Producto con sus relaciones
     */
    getProductoById: async (id) => {
        const response = await apiClient.get(`/catalogo/productos/${id}`);
        const payload = response.data?.data || response.data || {};
        return payload.producto || payload;
    },

    /**
     * Obtener subcategorías de una categoría
     * @param {number} categoriaId - ID de la categoría padre
     * @returns {Promise<Array>} Array de subcategorías activas
     */
    getSubcategoriasPorCategoria: async (categoriaId) => {
        const response = await apiClient.get(`/catalogo/categorias/${categoriaId}/subcategorias`);
        const payload = response.data?.data || response.data || {};
        return payload.subcategorias || [];
    },

    /**
     * Obtener productos destacados para la pantalla de inicio
     * @returns {Promise<Array>} Array de productos destacados
     */
    getProductosDestacados: async () => {
        const response = await apiClient.get('/catalogo/destacados');
        const payload = response.data?.data || response.data || {};
        return payload.productos || [];
    },

    /**
     * Convierte una ruta relativa del backend en URL completa usable para imagen.
     * 
     * - Si no hay ruta, devuelve un placeholder gris.
     * - Si ya es una URL absoluta (http/https), la devuelve tal cual.
    * - Si es una ruta relativa, la prefija con la URL del backend.
     * 
     * @param {string} path - Ruta de la imagen (ej: '/images/productos/DESPENSA/ARROZ.webp')
     * @returns {string} URL completa de la imagen
     */
    buildImageUrl: (path) => {
        if (!path) {
            return 'https://via.placeholder.com/300/200.png?text=Producto';
        }

        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        const normalizedPath = normalizeImagePath(path);
        if (!normalizedPath) {
            return 'https://via.placeholder.com/300/200.png?text=Producto';
        }

        const origin = getBackendOrigin();
        if (normalizedPath.startsWith('uploads/') || normalizedPath.startsWith('images/')) {
            return `${origin}/${normalizedPath}`;
        }

        return `${origin}/images/${normalizedPath}`;
    },
};

export default catalogoService;