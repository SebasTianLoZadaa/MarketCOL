const request = require('supertest');
const app = require('../server');

describe('Pruebas de caja blanca - carrito', () => {
  let clientToken;
  let carritoItemId;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cliente1@ecommerce.com',
        password: 'cliente1'
      });

    clientToken = loginResponse.body.data.token;
  });

  test('debe agregar un producto al carrito', async () => {
    const response = await request(app)
      .post('/api/cliente/carrito')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ productoId: 1, cantidad: 1 });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.item).toHaveProperty('id');
    carritoItemId = response.body.data.item.id;
  });

  test('debe actualizar la cantidad de un item del carrito', async () => {
    const response = await request(app)
      .put(`/api/cliente/carrito/${carritoItemId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ cantidad: 2 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.item.cantidad).toBe(2);
  });

  test('debe eliminar un item del carrito', async () => {
    const response = await request(app)
      .delete(`/api/cliente/carrito/${carritoItemId}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Producto eliminado del carrito');
  });

  test('debe vaciar el carrito', async () => {
    await request(app)
      .post('/api/cliente/carrito')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ productoId: 2, cantidad: 1 });

    const response = await request(app)
      .delete('/api/cliente/carrito')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Carrito vaciado');
  });
});
