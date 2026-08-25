const request = require('supertest');
const app = require('../server');
const { generateToken } = require('../config/jwt');

describe('Pruebas de caja blanca - auth', () => {
  test('debe rechazar login sin email y password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Email y contraseña son requeridos');
  });

  test('debe rechazar credenciales invalidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'noexiste@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Credenciales inválidas');
  });

  test('debe permitir login exitoso con credenciales válidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@ecommerce.com',
        password: 'admin1234'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data.usuario.email).toBe('admin@ecommerce.com');
  });

  test('debe rechazar acceso a perfil sin token', async () => {
    const response = await request(app)
      .get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('No se proporcionó token de autenticación');
  });

  test('debe aceptar token válido y devolver perfil', async () => {
    const token = generateToken({ id: 1, email: 'admin@ecommerce.com', rol: 'administrador' });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.usuario.email).toBe('admin@ecommerce.com');
  });

  test('debe rechazar cambio de contraseña con contraseña actual incorrecta', async () => {
    const token = generateToken({ id: 1, email: 'admin@ecommerce.com', rol: 'administrador' });

    const response = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        passwordActual: 'wrongpassword',
        passwordNueva: 'nuevapassword123'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Contraseña actual incorrecta');
  });
});
