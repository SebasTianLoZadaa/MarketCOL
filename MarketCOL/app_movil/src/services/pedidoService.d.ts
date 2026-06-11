declare const pedidoService: {
  crearPedido: (payload: { telefono?: string; direccionEnvio?: string; metodoPago?: string; notasAdicionales?: string }) => Promise<any>;
  getPedidoById: (id: string | number) => Promise<any>;
  getMisPedidos: () => Promise<any[]>;
  cancelarPedido: (id: string | number) => Promise<any>;
  getAllPedidos: (filters?: any) => Promise<any>;
  confirmarPago: (id: string | number) => Promise<any>;
  actualizarEstadoPedido: (id: string | number, estado: string) => Promise<any>;
  getEstadisticasPedidos: () => Promise<any>;
};
export default pedidoService;
