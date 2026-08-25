/**
 * Servicio de Pedidos - MarketCOL
 * 
 * Agrupa todas las operaciones sobre pedidos:
 * - Cliente: crear, consultar, detalle, cancelar
 * - Admin: confirmar pago, cambiar estado, estadísticas
 */

import apiClient from "../api/apiClient";

const pedidoService = {
    // ==========================================
    // FUNCIONES DE CLIENTE
    // ==========================================

    /**
     * Crear un pedido nuevo desde el checkout (Aliste y Recoja)
     * 
     * @param {Object} payload - Datos del pedido
     * @param {string} payload.metodoPago - 'whatsapp' o 'efectivo'
     * @param {string} [payload.telefono] - Teléfono (opcional, usa el del perfil)
     * @param {string} [payload.notasAdicionales] - Notas opcionales
     * @returns {Promise<Object>} Pedido creado con su ID y enlace de WhatsApp (si aplica)
     */
    crearPedido: async ({ telefono, metodoPago = 'whatsapp', notasAdicionales = '' }) => {
        const response = await apiClient.post('/cliente/pedidos', {
            telefono,
            metodoPago,
            notasAdicionales
        });
        // MarketCOL devuelve: { success, data: { pedido, linkPago } }
        return response.data?.data || response.data || {};
    },

    /**
     * Obtener el historial de pedidos del usuario autenticado
     * @returns {Promise<Array>} Array de pedidos
     */
    getMisPedidos: async () => {
        const response = await apiClient.get('/cliente/pedidos');
        return response.data?.data?.pedidos || response.data?.pedidos || [];
    },

    /**
     * Obtener el detalle completo de un pedido por ID
     * @param {number} id - ID del pedido
     * @returns {Promise<Object>} Pedido con detalles, productos y usuario
     */
    getPedidoById: async (id) => {
        const response = await apiClient.get(`/cliente/pedidos/${id}`);
        return response.data?.data?.pedido || response.data?.pedido || response.data;
    },

    /**
     * Cancelar un pedido (solo si está en estado 'pendiente' o 'preparando')
     * @param {number} id - ID del pedido
     * @returns {Promise<Object>} Respuesta del backend
     */
    cancelarPedido: async (id) => {
        const response = await apiClient.put(`/cliente/pedidos/${id}/cancelar`);
        return response.data;
    },

    // ==========================================
    // FUNCIONES DE ADMINISTRADOR
    // ==========================================

    /**
     * Obtener todos los pedidos (admin)
     * @param {Object} filters - Filtros: estado, estadoPago, usuarioId, pagina, limite
     * @returns {Promise<Object>} { pedidos, paginacion }
     */
    getAllPedidos: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.estado) params.append('estado', filters.estado);
        if (filters.estadoPago) params.append('estadoPago', filters.estadoPago);
        if (filters.usuarioId) params.append('usuarioId', filters.usuarioId);
        if (filters.pagina) params.append('pagina', filters.pagina);
        if (filters.limite) params.append('limite', filters.limite);
        
        const queryString = params.toString();
        const url = `/admin/pedidos${queryString ? '?' + queryString : ''}`;
        const response = await apiClient.get(url);
        return response.data?.data || response.data || {};
    },

    /**
     * Confirmar el pago de un pedido (admin)
     * Cambia estadoPago a 'confirmado' y estado a 'preparando'
     * @param {number} id - ID del pedido
     * @returns {Promise<Object>} Respuesta del backend
     */
    confirmarPago: async (id) => {
        const response = await apiClient.put(`/admin/pedidos/${id}/confirmar-pago`);
        return response.data;
    },

    /**
     * Cambiar el estado de un pedido (admin)
     * Estados válidos: 'pendiente', 'preparando', 'listo', 'entregado', 'cancelado'
     * @param {number} id - ID del pedido
     * @param {string} estado - Nuevo estado
     * @returns {Promise<Object>} Respuesta del backend
     */
    actualizarEstadoPedido: async (id, estado) => {
        const response = await apiClient.put(`/admin/pedidos/${id}/estado`, { estado });
        return response.data;
    },

    /**
     * Obtener estadísticas de pedidos (admin, para dashboard)
     * @returns {Promise<Object>} Estadísticas: totalPedidos, pedidosHoy, ventasTotales, pedidosPorEstado
     */
    getEstadisticasPedidos: async () => {
        const response = await apiClient.get('/admin/pedidos/estadisticas');
        return response.data?.data || response.data || {};
    },
};

export default pedidoService;