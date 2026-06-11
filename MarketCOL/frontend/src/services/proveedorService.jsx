/**
 * ============================================
 * SERVICIO DE PROVEEDORES - MarketCOL
 * ============================================
 * Funciones para gestionar proveedores (ADMIN)
 */

import api from './api';

const proveedorService = {
  /**
   * Obtener todos los proveedores (con filtros opcionales)
   * @param {Object} filters - { activo, buscar, pagina, limite }
   */
  getProveedores: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.activo !== undefined) params.append('activo', filters.activo);
      if (filters.buscar) params.append('buscar', filters.buscar);
      if (filters.pagina) params.append('pagina', filters.pagina);
      if (filters.limite) params.append('limite', filters.limite);
      
      const response = await api.get(`/admin/proveedores?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Obtener un proveedor por ID
   * @param {number} id - ID del proveedor
   */
  getProveedorById: async (id) => {
    try {
      const response = await api.get(`/admin/proveedores/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Crear un nuevo proveedor
   * @param {Object} data - { nombre, contacto, telefono, email, direccion }
   */
  crearProveedor: async (data) => {
    try {
      const response = await api.post('/admin/proveedores', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Actualizar un proveedor existente
   * @param {number} id - ID del proveedor
   * @param {Object} data - Campos a actualizar
   */
  actualizarProveedor: async (id, data) => {
    try {
      const response = await api.put(`/admin/proveedores/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Activar/Desactivar un proveedor (toggle)
   * @param {number} id - ID del proveedor
   */
  toggleProveedor: async (id) => {
    try {
      const response = await api.patch(`/admin/proveedores/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Eliminar un proveedor (solo si no tiene productos asociados)
   * @param {number} id - ID del proveedor
   */
  eliminarProveedor: async (id) => {
    try {
      const response = await api.delete(`/admin/proveedores/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },
};

export default proveedorService;