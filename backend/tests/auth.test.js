const request = require('supertest');
const app = require('../server');
const { generateToken } = require('../config/jwt');

describe('Pruebas de caja blanca - auth', () => {
  // ============================================
  // CONSTANTES
  // ============================================
  
  const ADMIN_USER = {
    id: 1,
    email: 'admin@ecommerce.com',
    password: 'admin1234',
    rol: 'administrador'
  };

  // ============================================
  // HELPERS PARA PETICIONES
  // ============================================

  /**
   * Realiza una petición HTTP con autenticación opcional
   */
  const peticion = (method, endpoint, token = null, body = null) => {
    const req = request(app)[method](endpoint);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    if (body) {
      req.send(body);
    }
    return req;
  };

  /**
   * Login de usuario
   */
  const login = (email, password) => {
    return peticion('post', '/api/auth/login', null, { email, password });
  };

  /**
   * Obtener perfil de usuario
   */
  const obtenerPerfil = (token) => {
    return peticion('get', '/api/auth/me', token);
  };

  /**
   * Cambiar contraseña
   */
  const cambiarPassword = (token, passwordActual, passwordNueva) => {
    return peticion('put', '/api/auth/change-password', token, {
      passwordActual,
      passwordNueva
    });
  };

  /**
   * Generar token para pruebas
   */
  const generarTokenPrueba = (userData = {}) => {
    const user = { ...ADMIN_USER, ...userData };
    return generateToken({
      id: user.id,
      email: user.email,
      rol: user.rol
    });
  };

  // ============================================
  // HELPERS PARA VALIDACIONES
  // ============================================

  /**
   * Validar respuesta de error
   */
  const validarError = (response, status, mensaje) => {
    expect(response.status).toBe(status);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(mensaje);
  };

  /**
   * Validar respuesta de login exitoso
   */
  const validarLoginExitoso = (response, emailEsperado) => {
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data.usuario.email).toBe(emailEsperado);
  };

  /**
   * Validar respuesta de perfil exitoso
   */
  const validarPerfilExitoso = (response, emailEsperado) => {
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.usuario.email).toBe(emailEsperado);
  };

  // ============================================
  // TESTS DE LOGIN
  // ============================================

  test('debe rechazar login sin email y password', async () => {
    const response = await login();
    validarError(response, 400, 'Email y contraseña son requeridos');
  });

  test('debe rechazar credenciales invalidas', async () => {
    const response = await login('noexiste@example.com', 'wrongpassword');
    validarError(response, 401, 'Credenciales inválidas');
  });

  test('debe permitir login exitoso con credenciales válidas', async () => {
    const response = await login(ADMIN_USER.email, ADMIN_USER.password);
    validarLoginExitoso(response, ADMIN_USER.email);
  });

  // ============================================
  // TESTS DE PERFIL
  // ============================================

  test('debe rechazar acceso a perfil sin token', async () => {
    const response = await obtenerPerfil();
    validarError(response, 401, 'No se proporcionó token de autenticación');
  });

  test('debe aceptar token válido y devolver perfil', async () => {
    const token = generarTokenPrueba();
    const response = await obtenerPerfil(token);
    validarPerfilExitoso(response, ADMIN_USER.email);
  });

  // ============================================
  // TESTS DE CAMBIO DE CONTRASEÑA
  // ============================================

  test('debe rechazar cambio de contraseña con contraseña actual incorrecta', async () => {
    const token = generarTokenPrueba();
    const response = await cambiarPassword(token, 'wrongpassword', 'nuevapassword123');
    validarError(response, 401, 'Contraseña actual incorrecta');
  });

  // ============================================
  // TESTS ADICIONALES (para mayor cobertura)
  // ============================================

  test('debe rechazar cambio de contraseña sin token', async () => {
    const response = await cambiarPassword(null, 'oldpass', 'newpass');
    validarError(response, 401, 'No se proporcionó token de autenticación');
  });

  test('debe rechazar token inválido en perfil', async () => {
    const response = await obtenerPerfil('token-invalido');
    // El mensaje puede variar según la implementación
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});