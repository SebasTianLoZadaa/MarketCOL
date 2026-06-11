/**
 * ============================================
 * SERVICIO DE PEDIDOS - MarketCOL
 * ============================================
 * Funciones para gestionar pedidos del cliente y admin
 */

import api from './api';

const pedidoService = {
  /**
   * Crear pedido (checkout) - MarketCOL
   * @param {Object} payload - Datos del pedido
   * @param {string} payload.metodoPago - 'whatsapp' o 'efectivo'
   * @param {string} [payload.telefono] - Teléfono de contacto (opcional, usa el del perfil)
   * @param {string} [payload.notasAdicionales] - Notas opcionales
   */
  crearPedido: async (payload) => {
    try {
      const response = await api.post('/cliente/pedidos', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Obtener pedidos del usuario autenticado
   */
  getMisPedidos: async () => {
    try {
      const response = await api.get('/cliente/pedidos');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Obtener un pedido específico del usuario
   */
  getPedidoById: async (id) => {
    try {
      const response = await api.get(`/cliente/pedidos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Cancelar un pedido (cliente)
   */
  cancelarPedido: async (id) => {
    try {
      const response = await api.put(`/cliente/pedidos/${id}/cancelar`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ==========================================
  // MÉTODOS DE ADMINISTRADOR
  // ==========================================

  /**
   * Obtener todos los pedidos (admin)
   */
  obtenerTodosPedidos: async (params = '') => {
    try {
      const response = await api.get(`/admin/pedidos${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Obtener un pedido por ID (admin)
   */
  obtenerPedidoPorId: async (id) => {
    try {
      const response = await api.get(`/admin/pedidos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Actualizar estado del pedido (admin)
   * @param {number} id - ID del pedido
   * @param {string} estado - 'pendiente', 'preparando', 'listo', 'entregado', 'cancelado'
   */
  actualizarEstadoPedido: async (id, estado) => {
    try {
      const response = await api.put(`/admin/pedidos/${id}/estado`, { estado });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Confirmar pago de un pedido (admin)
   * @param {number} id - ID del pedido
   */
  confirmarPago: async (id) => {
    try {
      const response = await api.put(`/admin/pedidos/${id}/confirmar-pago`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Obtener estadísticas de pedidos (admin)
   */
  getEstadisticasPedidos: async () => {
    try {
      const response = await api.get('/admin/pedidos/estadisticas');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },
};

export default pedidoService;