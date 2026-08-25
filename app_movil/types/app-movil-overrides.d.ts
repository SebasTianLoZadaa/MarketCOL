declare module '@expo/vector-icons/build/Ionicons' {
  const Ionicons: any;
  export default Ionicons;
}

declare module '../src/services/pedidoService' {
  const pedidoService: {
    crearPedido: (payload: { telefono?: string; metodoPago?: string; notasAdicionales?: string }) => Promise<any>;
    getPedidoById: (id: string | number) => Promise<any>;
    getMisPedidos: () => Promise<any[]>;
    cancelarPedido: (id: string | number) => Promise<any>;
    getAllPedidos: (filters?: any) => Promise<any>;
    confirmarPago: (id: string | number) => Promise<any>;
    actualizarEstadoPedido: (id: string | number, estado: string) => Promise<any>;
    getEstadisticasPedidos: () => Promise<any>;
  };
  export default pedidoService;
}

declare module '../src/services/catalogoService' {
  const catalogoService: {
    getCategorias: () => Promise<any[]>;
    getProductos: (params?: any) => Promise<{ productos: any[]; paginacion: any }>;
    getProductoById: (id: string | number) => Promise<any>;
    getSubcategoriasPorCategoria: (categoriaId: string | number) => Promise<any[]>;
    getProductosDestacados: () => Promise<any[]>;
    buildImageUrl: (path?: string) => string;
  };
  export default catalogoService;
}
