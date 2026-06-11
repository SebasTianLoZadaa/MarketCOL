/**
 * Servicio de Catálogo (Público) - MarketCOL
 * 
 * Gestiona las consultas públicas del catálogo:
 * - Obtener categorías y productos con filtros
 * - Construir URLs válidas para imágenes del backend
 */

import apiClient from '../api/apiClient';

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
     * - Si es una ruta relativa, la prefija con la URL del backend en /images/ (catálogo estático).
     * 
     * @param {string} path - Ruta de imagen (ej: 'BEBIDAS/AGUA.png' o '/images/BEBIDAS/AGUA.png')
     * @returns {string} URL completa de la imagen
     */
    buildImageUrl: (path) => {
        if (!path) {
            return 'https://via.placeholder.com/300/200.png?text=Producto';
        }

        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        // URL base del backend (emulador Android)
        const origin = 'http://10.0.2.2:5000';
        
        // Si ya tiene la ruta /images/, devolverla tal cual
        if (path.startsWith('/images/')) {
            return `${origin}${path}`;
        }
        
        // Si es una ruta relativa, agregarlo a /images/
        return `${origin}/images/${path.replace(/^\//, '')}`;
    },
};

export default catalogoService;