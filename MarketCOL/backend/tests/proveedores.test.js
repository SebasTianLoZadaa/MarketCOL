const request = require('supertest');
const app = require('../server');

describe('Pruebas de caja blanca - proveedores', () => {
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

  test('debe rechazar crear un proveedor sin nombre', async () => {
    const response = await request(app)
      .post('/api/admin/proveedores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        contacto: 'Juan Pérez',
        telefono: '3001234567',
        email: 'proveedor@test.com',
        direccion: 'Calle 123'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('El nombre del proveedor es requerido');
  });

  test('debe gestionar proveedores completos', async () => {
    const nombreBase = `Proveedor prueba ${Date.now()}`;

    const crearResponse = await request(app)
      .post('/api/admin/proveedores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreBase,
        contacto: 'Contacto prueba',
        telefono: '3107778899',
        email: `proveedor${Date.now()}@test.com`,
        direccion: 'Carrera 15 10-20'
      });

    expect(crearResponse.status).toBe(201);
    expect(crearResponse.body.success).toBe(true);
    const proveedorCreado = crearResponse.body.data.proveedor;
    expect(proveedorCreado).toHaveProperty('id');
    expect(proveedorCreado.nombre).toBe(nombreBase);

    const listadoResponse = await request(app)
      .get('/api/admin/proveedores')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listadoResponse.status).toBe(200);
    expect(listadoResponse.body.success).toBe(true);
    expect(Array.isArray(listadoResponse.body.data.proveedores)).toBe(true);

    const obtenerResponse = await request(app)
      .get(`/api/admin/proveedores/${proveedorCreado.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(obtenerResponse.status).toBe(200);
    expect(obtenerResponse.body.success).toBe(true);
    expect(obtenerResponse.body.data.proveedor.nombre).toBe(nombreBase);

    const actualizarResponse = await request(app)
      .put(`/api/admin/proveedores/${proveedorCreado.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `${nombreBase} actualizado`,
        contacto: 'Contacto actualizado'
      });

    expect(actualizarResponse.status).toBe(200);
    expect(actualizarResponse.body.success).toBe(true);
    expect(actualizarResponse.body.data.proveedor.nombre).toBe(`${nombreBase} actualizado`);

    const toggleResponse = await request(app)
      .patch(`/api/admin/proveedores/${proveedorCreado.id}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(toggleResponse.status).toBe(200);
    expect(toggleResponse.body.success).toBe(true);
    expect(toggleResponse.body.data.proveedor.activo).toBe(false);

    const eliminarResponse = await request(app)
      .delete(`/api/admin/proveedores/${proveedorCreado.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(eliminarResponse.status).toBe(200);
    expect(eliminarResponse.body.success).toBe(true);
    expect(eliminarResponse.body.message).toBe('Proveedor eliminado exitosamente');
  });
});
