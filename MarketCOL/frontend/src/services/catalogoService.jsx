/**
 * ============================================
 * SERVICIO DE CATÁLOGO (PÚBLICO)
 * ============================================
 * Funciones para ver productos, categorías
 * (sin autenticación)
 */

import api from './api';

const catalogoService = {
  /**
   * Obtener productos con filtros
   */
  getProductos: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.categoriaId) {
        params.append('categoriaId', filters.categoriaId);
      }

      if (filters.subcategoriaId) {
        params.append('subcategoriaId', filters.subcategoriaId);
      }

      if (filters.buscar) {
        params.append('buscar', filters.buscar);
      }

      if (filters.precioMin) {
        params.append('precioMin', filters.precioMin);
      }

      if (filters.precioMax) {
        params.append('precioMax', filters.precioMax);
      }

      if (filters.pagina) {
        params.append('pagina', filters.pagina);
      }

      if (filters.limite) {
        params.append('limite', filters.limite);
      }

      const response = await api.get(
        `/catalogo/productos?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Error de conexión'
      };
    }
  },

  /**
   * Obtener un producto por ID
   */
  getProductoById: async (id) => {
    try {
      const productoId = Number(id);

      if (!Number.isSafeInteger(productoId) || productoId <= 0) {
        throw new Error('ID de producto inválido');
      }

      const safeProductoId = encodeURIComponent(
        String(productoId)
      );

      const response = await api.get(
        `/catalogo/productos/${safeProductoId}`
      );

      return response.data;
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Error de conexión'
      };
    }
  },

  /**
   * Obtener todas las categorías activas
   */
  getCategorias: async () => {
    try {
      const response = await api.get(
        '/catalogo/categorias'
      );

      return response.data;
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Error de conexión'
      };
    }
  },

  /**
   * Obtener subcategorías por categoría
   */
  getSubcategoriasPorCategoria: async (categoriaId) => {
    try {
      const id = Number(categoriaId);

      if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error('ID de categoría inválido');
      }

      /*
       * El ID ha sido validado como entero positivo
       * antes de utilizarse para construir la URL.
       */
      const safeCategoriaId = encodeURIComponent(
        String(id)
      );

      const response = await api.get(
        `/catalogo/categorias/${safeCategoriaId}/subcategorias`
      );

      return response.data;
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Error de conexión'
      };
    }
  },

  /**
   * Obtener productos destacados
   */
  getProductosDestacados: async () => {
    try {
      const response = await api.get(
        '/catalogo/destacados'
      );

      return response.data;
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Error de conexión'
      };
    }
  }
};

export default catalogoService;