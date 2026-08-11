const request = require('supertest');
const app = require('../server');

describe('Pruebas de caja blanca - productos', () => {
  let adminToken;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@ecommerce.com',
        password: 'admin1234'
      });

    adminToken = loginResponse.body.data.token;
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

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Faltan campos requeridos: nombre, precio, categoriaId y subcategoriaId');
  });

  test('debe rechazar precio inválido al crear producto', async () => {
    const response = await request(app)
      .post('/api/admin/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'Producto precio inválido')
      .field('precio', '0')
      .field('categoriaId', '1')
      .field('subcategoriaId', '1');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('El precio debe ser mayor a 0');
  });

  test('debe crear un producto válido', async () => {
    const response = await request(app)
      .post('/api/admin/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'Producto prueba jest')
      .field('descripcion', 'Producto creado por pruebas')
      .field('precio', '15000')
      .field('stock', '10')
      .field('categoriaId', '1')
      .field('subcategoriaId', '1');

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.producto.nombre).toBe('Producto prueba jest');
  });

  test('debe gestionar stock de producto', async () => {
    const createResponse = await request(app)
      .post('/api/admin/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', `Producto stock ${Date.now()}`)
      .field('descripcion', 'Producto para pruebas de stock')
      .field('precio', '12000')
      .field('stock', '5')
      .field('categoriaId', '1')
      .field('subcategoriaId', '1');

    expect(createResponse.status).toBe(201);
    const producto = createResponse.body.data.producto;
    expect(producto).toHaveProperty('id');

    const aumentarResponse = await request(app)
      .patch(`/api/admin/productos/${producto.id}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cantidad: 3, operacion: 'aumentar' });

    expect(aumentarResponse.status).toBe(200);
    expect(aumentarResponse.body.success).toBe(true);
    expect(aumentarResponse.body.data.stockNuevo).toBe(8);

    const reducirResponse = await request(app)
      .patch(`/api/admin/productos/${producto.id}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cantidad: 2, operacion: 'reducir' });

    expect(reducirResponse.status).toBe(200);
    expect(reducirResponse.body.success).toBe(true);
    expect(reducirResponse.body.data.stockNuevo).toBe(6);

    const establecerResponse = await request(app)
      .patch(`/api/admin/productos/${producto.id}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cantidad: 15, operacion: 'establecer' });

    expect(establecerResponse.status).toBe(200);
    expect(establecerResponse.body.success).toBe(true);
    expect(establecerResponse.body.data.stockNuevo).toBe(15);

    const errorResponse = await request(app)
      .patch(`/api/admin/productos/${producto.id}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cantidad: 999, operacion: 'reducir' });

    expect(errorResponse.status).toBe(400);
    expect(errorResponse.body.success).toBe(false);
    expect(errorResponse.body.message).toContain('No hay suficiente stock');
  });
});
