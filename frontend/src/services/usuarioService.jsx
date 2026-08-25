/**
 * ============================================
 * SERVICIO DE USUARIOS - MarketCOL
 * ============================================
 * Funciones para gestionar usuarios (ADMIN)
 */

import api from './api';

const usuarioService = {
  /**
   * Obtener todos los usuarios (con filtros opcionales)
   * @param {Object} filters - { rol, activo, buscar, pagina, limite }
   */
  obtenerUsuarios: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.rol) params.append('rol', filters.rol);
      if (filters.activo !== undefined) params.append('activo', filters.activo);
      if (filters.buscar) params.append('buscar', filters.buscar);
      if (filters.pagina) params.append('pagina', filters.pagina);
      if (filters.limite) params.append('limite', filters.limite);
      
      const response = await api.get(`/admin/usuarios?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Obtener usuario por ID
   */
  obtenerUsuarioPorId: async (id) => {
    try {
      const response = await api.get(`/admin/usuarios/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Crear nuevo usuario
   */
  crearUsuario: async (usuario) => {
    try {
      const response = await api.post('/admin/usuarios', usuario);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Actualizar usuario
   */
  actualizarUsuario: async (id, usuario) => {
    try {
      const response = await api.put(`/admin/usuarios/${id}`, usuario);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Activar/Desactivar usuario (toggle)
   * Usa el endpoint PATCH específico
   */
  toggleUsuario: async (id) => {
    try {
      const response = await api.patch(`/admin/usuarios/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Cambiar estado activo/inactivo (alias de toggleUsuario para compatibilidad)
   * @deprecated Usar toggleUsuario en su lugar
   */
  cambiarEstado: async (id, activo) => {
    try {
      // Si queremos mantener compatibilidad, usamos PUT con todo el objeto
      // Pero es mejor usar toggleUsuario
      const response = await api.put(`/admin/usuarios/${id}`, { activo });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Eliminar usuario
   */
  eliminarUsuario: async (id) => {
    try {
      const response = await api.delete(`/admin/usuarios/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Obtener estadísticas de usuarios (para dashboard)
   */
  getEstadisticasUsuarios: async () => {
    try {
      const response = await api.get('/admin/usuarios/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },
};

export default usuarioService;