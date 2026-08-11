const request = require('supertest');
const app = require('../server');
const { generateToken } = require('../config/jwt');

describe('Pruebas de caja blanca - acceso admin', () => {
  let adminToken = '';
  let auxiliarToken = '';
  let clienteToken = '';

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@ecommerce.com',
        password: 'admin1234'
      });

    adminToken = adminLogin.body.data.token;

    const auxiliarLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'auxiliar@ecommerce.com',
        password: 'aux123'
      });

    auxiliarToken = auxiliarLogin.body.data.token;

    const clienteLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cliente1@ecommerce.com',
        password: 'cliente1'
      });

    clienteToken = clienteLogin.body.data.token;
  });

  test('debe bloquear acceso a rutas admin sin token', async () => {
    const response = await request(app)
      .get('/api/admin/usuarios');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('No se proporcionó token de autenticación');
  });

  test('debe bloquear acceso admin para cliente', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cliente1@ecommerce.com',
        password: 'cliente1'
      });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.data.token;
    const response = await request(app)
      .get('/api/admin/usuarios')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Acceso denegado. Se requieren permisos de administrador o auxiliar');
  });

  test('debe permitir acceso a admin o auxiliar', async () => {
    const token = generateToken({ id: 1, email: 'admin@ecommerce.com', rol: 'administrador' });

    const response = await request(app)
      .get('/api/admin/usuarios')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('debe permitir a admin y auxiliar gestionar inventario', async () => {
    const adminResponse = await request(app)
      .patch('/api/admin/productos/1/stock')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cantidad: 2, operacion: 'aumentar' });

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.success).toBe(true);
    expect(adminResponse.body.data).toHaveProperty('stockNuevo');

    const auxiliarResponse = await request(app)
      .patch('/api/admin/productos/1/stock')
      .set('Authorization', `Bearer ${auxiliarToken}`)
      .send({ cantidad: 1, operacion: 'aumentar' });

    expect(auxiliarResponse.status).toBe(200);
    expect(auxiliarResponse.body.success).toBe(true);
  });

  test('debe bloquear acceso a reportes para cliente', async () => {
    const response = await request(app)
      .get('/api/admin/pedidos/estadisticas')
      .set('Authorization', `Bearer ${clienteToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Acceso denegado. Se requieren permisos de administrador o auxiliar');
  });

  test('debe permitir a admin y auxiliar consultar reportes', async () => {
    const adminResponse = await request(app)
      .get('/api/admin/pedidos/estadisticas')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.success).toBe(true);
    expect(adminResponse.body.data).toHaveProperty('totalPedidos');
    expect(adminResponse.body.data).toHaveProperty('pedidosPorEstado');

    const auxiliarResponse = await request(app)
      .get('/api/admin/pedidos/estadisticas')
      .set('Authorization', `Bearer ${auxiliarToken}`);

    expect(auxiliarResponse.status).toBe(200);
    expect(auxiliarResponse.body.success).toBe(true);
  });

  test('debe permitir a admin y auxiliar consultar múltiples reportes', async () => {
    const endpoints = [
      '/api/admin/usuarios/stats',
      '/api/admin/categorias/1/stats',
      '/api/admin/subcategorias/1/stats'
    ];

    for (const endpoint of endpoints) {
      const adminResponse = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminResponse.status).toBe(200);
      expect(adminResponse.body.success).toBe(true);

      const auxiliarResponse = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${auxiliarToken}`);

      expect(auxiliarResponse.status).toBe(200);
      expect(auxiliarResponse.body.success).toBe(true);
    }
  });

  test('debe bloquear operaciones críticas para auxiliar', async () => {
    const token = generateToken({ id: 2, email: 'auxiliar@ecommerce.com', rol: 'auxiliar' });

    const response = await request(app)
      .delete('/api/admin/usuarios/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Acceso denegado. Solo administradores pueden realizar esta operación');
  });
});
