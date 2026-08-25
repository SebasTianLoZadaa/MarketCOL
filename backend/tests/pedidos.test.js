const request = require('supertest');
const app = require('../server');

describe('Pruebas de caja blanca - pedidos', () => {
  let clientToken;
  let adminToken;

  beforeAll(async () => {
    const clientLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cliente1@ecommerce.com',
        password: 'cliente1'
      });

    clientToken = clientLogin.body.data.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@ecommerce.com',
        password: 'admin1234'
      });

    adminToken = adminLogin.body.data.token;
  });

  test('debe crear un pedido desde el carrito', async () => {
    await request(app)
      .post('/api/cliente/carrito')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ productoId: 3, cantidad: 1 });

    const response = await request(app)
      .post('/api/cliente/pedidos')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        direccionEnvio: 'Calle 123 #45-67',
        telefono: '3001234567',
        metodoPago: 'whatsapp',
        notasAdicionales: 'Entregar en portería'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.pedido).toHaveProperty('id');
  });

  test('debe listar mis pedidos', async () => {
    const response = await request(app)
      .get('/api/cliente/pedidos')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('pedidos');
  });

  test('debe cancelar un pedido pendiente', async () => {
    await request(app)
      .post('/api/cliente/carrito')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ productoId: 4, cantidad: 1 });

    const pedidoResponse = await request(app)
      .post('/api/cliente/pedidos')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        direccionEnvio: 'Carrera 10 #20-30',
        telefono: '3109876543',
        metodoPago: 'efectivo'
      });

    const cancelResponse = await request(app)
      .put(`/api/cliente/pedidos/${pedidoResponse.body.data.pedido.id}/cancelar`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.success).toBe(true);
    expect(cancelResponse.body.data.pedido.estado).toBe('cancelado');
  });

  test('debe actualizar el estado de un pedido como administrador', async () => {
    await request(app)
      .post('/api/cliente/carrito')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ productoId: 5, cantidad: 1 });

    const pedidoResponse = await request(app)
      .post('/api/cliente/pedidos')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        direccionEnvio: 'Avenida Siempre Viva 742',
        telefono: '3201112233',
        metodoPago: 'whatsapp'
      });

    const updateResponse = await request(app)
      .put(`/api/admin/pedidos/${pedidoResponse.body.data.pedido.id}/estado`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado: 'preparando' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.data.pedido.estado).toBe('preparando');
  });

  test('debe confirmar el pago de un pedido como administrador', async () => {
    await request(app)
      .post('/api/cliente/carrito')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ productoId: 6, cantidad: 1 });

    const pedidoResponse = await request(app)
      .post('/api/cliente/pedidos')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        direccionEnvio: 'Boulevard los Álamos 99',
        telefono: '3214445566',
        metodoPago: 'efectivo'
      });

    const confirmResponse = await request(app)
      .put(`/api/admin/pedidos/${pedidoResponse.body.data.pedido.id}/confirmar-pago`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.success).toBe(true);
    expect(confirmResponse.body.data.pedido.estadoPago).toBe('confirmado');
    expect(confirmResponse.body.data.pedido.estado).toBe('preparando');
  });

  test('debe generar un enlace de pago por whatsapp al crear un pedido', async () => {
    await request(app)
      .post('/api/cliente/carrito')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ productoId: 7, cantidad: 1 });

    const response = await request(app)
      .post('/api/cliente/pedidos')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        direccionEnvio: 'Calle 80 #10-20',
        telefono: '3005556677',
        metodoPago: 'whatsapp'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('WhatsApp');
    expect(response.body.data.linkPago).toContain('wa.me');
    expect(response.body.data.linkPago).toContain('573203097032');
    expect(response.body.data.linkPago).toContain(`pedido%20%23${response.body.data.pedido.id}`);
  });
});
