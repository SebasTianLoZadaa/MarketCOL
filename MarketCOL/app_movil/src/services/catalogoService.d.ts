declare const catalogoService: {
  getCategorias: () => Promise<any[]>;
  getProductos: (params?: any) => Promise<{ productos: any[]; paginacion: any }>;
  getProductoById: (id: string | number) => Promise<any>;
  getSubcategoriasPorCategoria: (categoriaId: string | number) => Promise<any[]>;
  getProductosDestacados: () => Promise<any[]>;
  buildImageUrl: (path?: string) => string;
};
export default catalogoService;
