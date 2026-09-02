const request = require('supertest');
const app = require('../server');

describe('Pruebas de caja blanca - productos', () => {
  let adminToken;
  let productoId;

  // ============================================
  // HELPERS PARA ELIMINAR DUPLICIDAD
  // ============================================

  /**
   * Helper para login de admin
   */
  const loginAdmin = async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@marketcol.com',
        password: 'admin1234'
      });
    return response.body.data.token;
  };

  /**
   * Helper para crear producto
   */
  const crearProducto = async (token, productoData = {}) => {
    const defaultData = {
      nombre: `Producto test ${Date.now()}`,
      descripcion: 'Producto creado por pruebas',
      precio: '15000',
      stock: '10',
      categoriaId: '1',
      subcategoriaId: '1'
    };

    const data = { ...defaultData, ...productoData };

    const response = await request(app)
      .post('/api/admin/productos')
      .set('Authorization', `Bearer ${token}`)
      .field('nombre', data.nombre)
      .field('descripcion', data.descripcion)
      .field('precio', data.precio)
      .field('stock', data.stock)
      .field('categoriaId', data.categoriaId)
      .field('subcategoriaId', data.subcategoriaId);

    return response;
  };

  /**
   * Helper para gestionar stock
   */
  const gestionarStock = async (token, productoId, cantidad, operacion) => {
    const response = await request(app)
      .patch(`/api/admin/productos/${productoId}/stock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cantidad, operacion });
    return response;
  };

  /**
   * Helper para validar respuesta de error
   */
  const expectErrorResponse = (response, status, mensajeEsperado) => {
    expect(response.status).toBe(status);
    expect(response.body.success).toBe(false);
    if (mensajeEsperado) {
      // Soporta tanto strings exactos como expresiones regulares
      if (typeof mensajeEsperado === 'string') {
        expect(response.body.message).toContain(mensajeEsperado);
      } else {
        expect(response.body.message).toMatch(mensajeEsperado);
      }
    }
  };

  /**
   * Helper para validar respuesta exitosa de producto
   */
  const expectProductoSuccess = (response, status, nombreEsperado = null) => {
    expect(response.status).toBe(status);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('producto');
    if (nombreEsperado) {
      expect(response.body.data.producto.nombre).toBe(nombreEsperado);
    }
    return response.body.data.producto;
  };

  // ============================================
  // TESTS
  // ============================================

  beforeAll(async () => {
    adminToken = await loginAdmin();
  });

  test('debe listar productos con token admin', async () => {
    const response = await request(app)
      .get('/api/admin/productos')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('productos');
  });

  test('debe rechazar crear producto sin campos obligatorios', async () => {
    const response = await request(app)
      .post('/api/admin/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'Producto prueba')
      .field('precio', '10000');

    expectErrorResponse(
      response,
      400,
      'Faltan campos requeridos: nombre, precio, categoriaId y subcategoriaId'
    );
  });

  test('debe rechazar precio inválido al crear producto', async () => {
    const response = await crearProducto(adminToken, {
      nombre: 'Producto precio inválido',
      precio: '0'
    });

    expectErrorResponse(response, 400, 'El precio debe ser mayor a 0');
  });

  test('debe crear un producto válido', async () => {
    const nombreProducto = 'Producto prueba jest';
    const response = await crearProducto(adminToken, {
      nombre: nombreProducto,
      precio: '15000',
      stock: '10'
    });

    const producto = expectProductoSuccess(response, 201, nombreProducto);
    expect(producto).toHaveProperty('id');
  });

  test('debe gestionar stock de producto', async () => {
    // 1. Crear producto para pruebas de stock
    const nombreProducto = `Producto stock ${Date.now()}`;
    const createResponse = await crearProducto(adminToken, {
      nombre: nombreProducto,
      precio: '12000',
      stock: '5'
    });

    const producto = expectProductoSuccess(createResponse, 201);
    productoId = producto.id;

    // 2. Probar operaciones de stock
    const operaciones = [
      { cantidad: 3, operacion: 'aumentar', stockEsperado: 8 },
      { cantidad: 2, operacion: 'reducir', stockEsperado: 6 },
      { cantidad: 15, operacion: 'establecer', stockEsperado: 15 }
    ];

    for (const op of operaciones) {
      const response = await gestionarStock(adminToken, productoId, op.cantidad, op.operacion);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stockNuevo).toBe(op.stockEsperado);
    }

    // 3. Probar error por stock insuficiente
    const errorResponse = await gestionarStock(adminToken, productoId, 999, 'reducir');
    expectErrorResponse(errorResponse, 400, 'No hay suficiente stock');
  });
});