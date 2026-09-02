/**
 * ============================================
 * MIDDLEWARE DE VERIFICACIÓN DE ROLES
 * ============================================
 * Estos middlewares controlan el ACCESO según el rol del usuario.
 * Se usan en cadena DESPUÉS del middleware verificarAuth (middleware/auth.js).
 * 
 * Flujo en una ruta protegida:
 *   Petición HTTP → verificarAuth (valida JWT, adjunta req.usuario) → esAdministrador (verifica rol) → controlador
 * 
 * Si el usuario no tiene el rol requerido → responde 403 (Prohibido) y NO llega al controlador.
 * 
 * Códigos HTTP usados:
 *   401 = No autorizado (no hay usuario logueado)
 *   403 = Prohibido (logueado pero sin permisos suficientes)
 */

/**
 * Middleware base que verifica autenticación y roles
 * Función interna para evitar duplicidad de código
 * 
 * @param {Array|string} rolesPermitidos - Rol o roles permitidos
 * @param {Function} validacionAdicional - Función adicional de validación (opcional)
 * @returns {Function} Middleware de Express
 */
const verificarPermisos = (rolesPermitidos, validacionAdicional = null) => {
  // Normalizar rolesPermitidos a array
  const rolesArray = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
  
  return (req, res, next) => {
    try {
      // Validación común: usuario autenticado
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado. Debes iniciar sesión primero'
        });
      }

      // Validación común: roles permitidos
      if (!rolesArray.includes(req.usuario.rol)) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesArray.join(', ')}`
        });
      }

      // Validación adicional específica (si existe)
      if (validacionAdicional && typeof validacionAdicional === 'function') {
        const resultado = validacionAdicional(req);
        if (resultado !== true) {
          return res.status(403).json({
            success: false,
            message: resultado || 'Acceso denegado'
          });
        }
      }

      // Todas las validaciones pasaron → continúa
      next();
    } catch (error) {
      console.error('Error en middleware de verificación de permisos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

// ------------------- MIDDLEWARES EXPORTADOS -------------------

/**
 * esAdministrador — Solo permite acceso a administradores
 * 
 * Verifica que req.usuario.rol === 'administrador'.
 * req.usuario fue adjuntado por verificarAuth en el paso anterior.
 * 
 * Uso en rutas de admin (routes/admin.routes.js):
 *   router.post('/crear', verificarAuth, esAdministrador, controlador);
 */
const esAdministrador = verificarPermisos('administrador');

/**
 * esCliente — Solo permite acceso a clientes
 * 
 * Verifica que req.usuario.rol === 'cliente'.
 * Se usa en rutas exclusivas para clientes como el carrito de compras.
 * 
 * Uso en rutas de cliente (routes/cliente.routes.js):
 *   router.post('/carrito', verificarAuth, esCliente, controlador);
 */
const esCliente = verificarPermisos('cliente');

/**
 * esAdminOAuxiliar — Permite acceso a administradores Y auxiliares
 * 
 * Se usa para rutas del panel de administración que los auxiliares también pueden ver.
 * Verifica que req.usuario.rol sea 'administrador' O 'auxiliar'.
 * 
 * Uso en rutas:
 *   router.get('/lista', verificarAuth, esAdminOAuxiliar, controlador);
 */
const esAdminOAuxiliar = verificarPermisos(['administrador', 'auxiliar']);

/**
 * soloAdministrador — Bloquea incluso a auxiliares
 * 
 * Más restrictivo que esAdminOAuxiliar.
 * Se usa para operaciones CRÍTICAS como eliminar datos o cambiar configuraciones.
 * Solo 'administrador' pasa; 'auxiliar' es rechazado.
 * 
 * Uso en rutas críticas:
 *   router.delete('/eliminar/:id', verificarAuth, soloAdministrador, controlador);
 */
const soloAdministrador = verificarPermisos('administrador');

/**
 * tieneRol — Permite acceso a MÚLTIPLES roles (middleware flexible/dinámico)
 * 
 * A diferencia de esAdministrador o esCliente que verifican UN solo rol,
 * tieneRol recibe un ARRAY de roles permitidos y acepta cualquiera de ellos.
 * 
 * Es una "función que retorna un middleware" (patrón factory/closure en JavaScript).
 * 
 * Uso en rutas con múltiples roles:
 *   router.get('/perfil', verificarAuth, tieneRol(['cliente', 'administrador']), controlador);
 * 
 * @param {Array} rolesPermitidos - Array de strings con los roles válidos. Ej: ['cliente', 'administrador']
 * @returns {Function} Middleware de Express (req, res, next)
 */
const tieneRol = (rolesPermitidos) => {
  return verificarPermisos(rolesPermitidos);
};

/**
 * esPropioUsuarioOAdmin — Verifica que el usuario accede a SUS propios datos
 * 
 * Compara el ID del usuario autenticado (req.usuario.id) con el ID de la URL (req.params).
 * EXCEPCIÓN: Los administradores pueden acceder a datos de CUALQUIER usuario.
 * 
 * Uso en rutas que manejan datos personales:
 *   router.get('/pedidos/:usuarioId', verificarAuth, esPropioUsuarioOAdmin, controlador);
 */
const esPropioUsuarioOAdmin = (req, res, next) => {
  // Usamos verificarPermisos con validación adicional
  return verificarPermisos(['cliente', 'auxiliar', 'administrador'], (request) => {
    // Si es administrador, permite acceso sin restricciones
    if (request.usuario.rol === 'administrador') {
      return true;
    }

    // Obtiene el ID del usuario de los parámetros de la URL
    const usuarioIdParam = request.params.usuarioId || request.params.id;

    // Compara el ID de la URL con el ID del usuario autenticado
    if (Number.parseInt(usuarioIdParam, 10) !== request.usuario.id) {
      return 'No puedes acceder a datos de otros usuarios';
    }

    return true;
  })(req, res, next);
};

// Exporta todos los middlewares de roles para usarlos en las rutas (routes/*.routes.js)
module.exports = {
  esAdministrador,
  esCliente,
  tieneRol,
  esPropioUsuarioOAdmin,
  esAdminOAuxiliar,
  soloAdministrador
};