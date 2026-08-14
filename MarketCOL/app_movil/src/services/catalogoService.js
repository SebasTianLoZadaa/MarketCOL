/**
 * ============================================
 * SERVICIO DE CATÁLOGO (PÚBLICO) - MarketCOL
 * ============================================
 *
 * Gestiona las consultas públicas del catálogo:
 * - Obtener categorías y productos con filtros
 * - Construir URLs válidas para imágenes del backend
 *
 */

import apiClient from '../api/apiClient';
import { API_BASE_URL } from '../utils/constants';

/**
 * Normaliza la ruta de una imagen.
 */
const normalizeImagePath = (imagePath = '') => {
    if (typeof imagePath !== 'string') {
        return '';
    }

    return imagePath
        .trim()
        .replaceAll('\\', '/')
        .replace(/^\/+/, '');
};

/**
 * Obtiene el origen seguro del backend.
 *
 * La aplicación debe utilizar HTTPS para las
 * comunicaciones con el backend.
 */
const getBackendOrigin = () => {
    try {
        const backendUrl = new URL(API_BASE_URL);

        if (backendUrl.protocol !== 'https:') {
            return '';
        }

        return backendUrl.origin;
    } catch (error) {
        console.error('Error al procesar la información:', error);
        return '';
    }
};

/**
 * Valida IDs numéricos provenientes de fuentes externas.
 */
const isValidId = (value) => {
    const id = Number(value);

    return Number.isSafeInteger(id) && id > 0;
};

const catalogoService = {

    /**
     * Obtener todas las categorías activas
     *
     * @returns {Promise<Array>} Array de categorías
     */
    getCategorias: async () => {
        const response = await apiClient.get(
            '/catalogo/categorias'
        );

        const payload =
            response.data?.data ||
            response.data ||
            {};

        return payload.categorias || [];
    },

    /**
     * Obtener productos del catálogo con filtros opcionales
     *
     * @param {Object} params - Filtros:
     * categoriaId, subcategoriaId, buscar,
     * precioMin, precioMax, pagina, limite
     *
     * @returns {Promise<Object>}
     */
    getProductos: async (params = {}) => {
        const response = await apiClient.get(
            '/catalogo/productos',
            { params }
        );

        const payload =
            response.data?.data ||
            response.data ||
            {};

        const productos = payload.productos || [];

        const paginacion =
            payload.paginacion || {
                total: 0,
                pagina: 1,
                totalPaginas: 1
            };

        return {
            productos,
            paginacion
        };
    },

    /**
     * Obtener un producto específico por ID
     *
     * @param {number} id - ID del producto
     * @returns {Promise<Object>} Producto con sus relaciones
     */
    getProductoById: async (id) => {

        if (!isValidId(id)) {
            throw new Error('ID de producto inválido');
        }

        const productoId = Number(id);

        const safeProductoId = encodeURIComponent(
            String(productoId)
        );

        const response = await apiClient.get(
            `/catalogo/productos/${safeProductoId}`
        );

        const payload =
            response.data?.data ||
            response.data ||
            {};

        return payload.producto || payload;
    },

    /**
     * Obtener subcategorías de una categoría
     *
     * @param {number} categoriaId - ID de la categoría padre
     * @returns {Promise<Array>} Array de subcategorías activas
     */
    getSubcategoriasPorCategoria: async (categoriaId) => {

        if (!isValidId(categoriaId)) {
            throw new Error('ID de categoría inválido');
        }

        const id = Number(categoriaId);

        const safeCategoriaId = encodeURIComponent(
            String(id)
        );

        const response = await apiClient.get(
            `/catalogo/categorias/${safeCategoriaId}/subcategorias`
        );

        const payload =
            response.data?.data ||
            response.data ||
            {};

        return payload.subcategorias || [];
    },

    /**
     * Obtener productos destacados para la pantalla de inicio
     *
     * @returns {Promise<Array>} Array de productos destacados
     */
    getProductosDestacados: async () => {
        const response = await apiClient.get(
            '/catalogo/destacados'
        );

        const payload =
            response.data?.data ||
            response.data ||
            {};

        return payload.productos || [];
    },

    /**
     * Convierte una ruta relativa del backend
     * en una URL HTTPS completa usable para imagen.
     *
     * - Si no hay ruta, devuelve un placeholder.
     * - Si ya es una URL HTTPS absoluta, la devuelve.
     * - Si es una ruta relativa, la prefija con la URL segura
     *   del backend.
     *
     * @param {string} path - Ruta de la imagen
     * @returns {string} URL completa de la imagen
     */
    buildImageUrl: (path) => {

        const placeholder =
            'https://via.placeholder.com/300/200.png?text=Producto';

        if (!path || typeof path !== 'string') {
            return placeholder;
        }

        const trimmedPath = path.trim();

        /*
         * Solo se permiten URLs HTTPS.
         * Las URLs HTTP son rechazadas.
         */
        if (trimmedPath.startsWith('https://')) {
            try {
                const imageUrl = new URL(trimmedPath);

                if (imageUrl.protocol === 'https:') {
                    return imageUrl.toString();
                }
            } catch {
                return placeholder;
            }

            return placeholder;
        }

        /*
         * Las URLs HTTP no son seguras.
         */
        if (trimmedPath.startsWith('http://')) {
            return placeholder;
        }

        const normalizedPath =
            normalizeImagePath(trimmedPath);

        if (!normalizedPath) {
            return placeholder;
        }

        const origin = getBackendOrigin();

        /*
         * Si API_BASE_URL no utiliza HTTPS,
         * no se construye una URL insegura.
         */
        if (!origin) {
            return placeholder;
        }

        if (
            normalizedPath.startsWith('uploads/') ||
            normalizedPath.startsWith('images/')
        ) {
            return `${origin}/${normalizedPath}`;
        }

        return `${origin}/images/${normalizedPath}`;
    },
};

export default catalogoService;