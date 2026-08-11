// ==========================================
// RUTAS DEL ADMINISTRADOR (admin.routes.js)
// ==========================================
//
// Agrupa TODAS las rutas del panel de administración.
//
// Prefijo base:
// /api/admin
//
// Acceso:
// Solo usuarios autenticados con rol
// 'administrador' o 'auxiliar'.
//
// Las rutas DELETE y gestión de usuarios
// requieren rol 'administrador' exclusivo.
// ==========================================

const express = require('express');

const router = express.Router();

// ==========================================
// IMPORTACIÓN DE MIDDLEWARES
// ==========================================

const { verificarAuth } = require('../middleware/auth');

const {
  esAdministrador,
  esAdminOAuxiliar,
  soloAdministrador
} = require('../middleware/checkRole');

const { upload } = require('../config/multer');

// ==========================================
// IMPORTACIÓN DE CONTROLADORES
// ==========================================

const categoriaController =
  require('../controllers/categoria.controller');

const subcategoriaController =
  require('../controllers/subcategoria.controller');

const productoController =
  require('../controllers/producto.controller');

const usuarioController =
  require('../controllers/usuario.controller');

const pedidoController =
  require('../controllers/pedido.controller');

const proveedorController =
  require('../controllers/proveedor.controller');

// ==========================================
// VALIDADORES
// ==========================================

/**
 * Valida un ID recibido mediante parámetros
 * de la URL.
 *
 * Ejemplo:
 * /productos/15
 *
 * El valor debe ser un entero positivo seguro.
 */
const validarIdParam = (req, res, next) => {
  const { id } = req.params;

  if (
    typeof id !== 'string' ||
    !/^\d+$/.test(id)
  ) {
    return res.status(400).json({
      success: false,
      message: 'El ID proporcionado no es válido'
    });
  }

  const idNumber = Number(id);

  if (
    !Number.isSafeInteger(idNumber) ||
    idNumber <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'El ID proporcionado no es válido'
    });
  }

  /*
   * Después de validarlo se convierte a número.
   * Los controladores reciben un valor ya validado.
   */
  req.params.id = idNumber;

  next();
};

/**
 * Valida un ID numérico opcional de query.
 *
 * Se utiliza para parámetros como:
 * categoriaId
 * subcategoriaId
 */
const validarQueryId = (value) => {
  if (value === undefined) {
    return true;
  }

  if (
    typeof value !== 'string' ||
    !/^\d+$/.test(value)
  ) {
    return false;
  }

  const numberValue = Number(value);

  return (
    Number.isSafeInteger(numberValue) &&
    numberValue > 0
  );
};

/**
 * Valida los parámetros utilizados
 * por GET /productos.
 */
const validarParametrosProductos = (
  req,
  res,
  next
) => {
  const {
    categoriaId,
    subcategoriaId,
    activo,
    conStock,
    buscar,
    pagina,
    limite
  } = req.query;

  // ==========================================
  // CATEGORÍA
  // ==========================================

  if (!validarQueryId(categoriaId)) {
    return res.status(400).json({
      success: false,
      message: 'El ID de categoría no es válido'
    });
  }

  // ==========================================
  // SUBCATEGORÍA
  // ==========================================

  if (!validarQueryId(subcategoriaId)) {
    return res.status(400).json({
      success: false,
      message: 'El ID de subcategoría no es válido'
    });
  }

  // ==========================================
  // ACTIVO
  // ==========================================

  if (
    activo !== undefined &&
    activo !== 'true' &&
    activo !== 'false'
  ) {
    return res.status(400).json({
      success: false,
      message: 'El parámetro activo debe ser true o false'
    });
  }

  // ==========================================
  // CON STOCK
  // ==========================================

  if (
    conStock !== undefined &&
    conStock !== 'true' &&
    conStock !== 'false'
  ) {
    return res.status(400).json({
      success: false,
      message: 'El parámetro conStock debe ser true o false'
    });
  }

  // ==========================================
  // BÚSQUEDA
  // ==========================================

  if (buscar !== undefined) {
    if (
      typeof buscar !== 'string' ||
      buscar.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'El texto de búsqueda no es válido'
      });
    }
  }

  // ==========================================
  // PÁGINA
  // ==========================================

  if (pagina !== undefined) {
    if (
      typeof pagina !== 'string' ||
      !/^\d+$/.test(pagina)
    ) {
      return res.status(400).json({
        success: false,
        message: 'El número de página no es válido'
      });
    }

    const paginaNumber = Number(pagina);

    if (
      !Number.isSafeInteger(paginaNumber) ||
      paginaNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'El número de página no es válido'
      });
    }
  }

  // ==========================================
  // LÍMITE
  // ==========================================

  if (limite !== undefined) {
    if (
      typeof limite !== 'string' ||
      !/^\d+$/.test(limite)
    ) {
      return res.status(400).json({
        success: false,
        message: 'El límite no es válido'
      });
    }

    const limiteNumber = Number(limite);

    if (
      !Number.isSafeInteger(limiteNumber) ||
      limiteNumber <= 0 ||
      limiteNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'El límite debe estar entre 1 y 100'
      });
    }
  }

  next();
};

// ==========================================
// MIDDLEWARE GLOBAL DEL ROUTER
// ==========================================
//
// Todas las rutas requieren:
// 1. Token JWT válido.
// 2. Rol administrador o auxiliar.
//
// Las rutas que requieren administrador exclusivo
// agregan posteriormente soloAdministrador.
// ==========================================

router.use(
  verificarAuth,
  esAdminOAuxiliar
);

// ==========================================
// RUTAS DE CATEGORÍAS
// /api/admin/categorias
// ==========================================

// Obtener todas las categorías
router.get(
  '/categorias',
  categoriaController.getCategorias
);

// Obtener una categoría por ID
router.get(
  '/categorias/:id',
  validarIdParam,
  categoriaController.getCategoriaById
);

// Estadísticas de una categoría
router.get(
  '/categorias/:id/stats',
  validarIdParam,
  categoriaController.getEstadisticasCategoria
);

// Crear categoría
router.post(
  '/categorias',
  categoriaController.crearCategoria
);

// Actualizar categoría
router.put(
  '/categorias/:id',
  validarIdParam,
  categoriaController.actualizarCategoria
);

// Activar/desactivar categoría
router.patch(
  '/categorias/:id/toggle',
  validarIdParam,
  categoriaController.toggleCategoria
);

// Eliminar categoría
router.delete(
  '/categorias/:id',
  validarIdParam,
  soloAdministrador,
  categoriaController.eliminarCategoria
);

// ==========================================
// RUTAS DE SUBCATEGORÍAS
// /api/admin/subcategorias
// ==========================================

// Obtener subcategorías
router.get(
  '/subcategorias',
  subcategoriaController.getSubcategorias
);

// Obtener una subcategoría
router.get(
  '/subcategorias/:id',
  validarIdParam,
  subcategoriaController.getSubcategoriaById
);

// Estadísticas de una subcategoría
router.get(
  '/subcategorias/:id/stats',
  validarIdParam,
  subcategoriaController.getEstadisticasSubcategoria
);

// Crear subcategoría
router.post(
  '/subcategorias',
  subcategoriaController.crearSubcategoria
);

// Actualizar subcategoría
router.put(
  '/subcategorias/:id',
  validarIdParam,
  subcategoriaController.actualizarSubcategoria
);

// Activar/desactivar subcategoría
router.patch(
  '/subcategorias/:id/toggle',
  validarIdParam,
  subcategoriaController.toggleSubcategoria
);

// Eliminar subcategoría
router.delete(
  '/subcategorias/:id',
  validarIdParam,
  soloAdministrador,
  subcategoriaController.eliminarSubcategoria
);

// ==========================================
// RUTAS DE PRODUCTOS
// /api/admin/productos
// ==========================================

// Obtener productos con filtros y paginación
//
// Ejemplo:
// /api/admin/productos?categoriaId=1&subcategoriaId=1
// &activo=true&conStock=true&buscar=texto
// &pagina=1&limite=10
router.get(
  '/productos',
  validarParametrosProductos,
  productoController.getProductos
);

// Obtener un producto por ID
router.get(
  '/productos/:id',
  validarIdParam,
  productoController.getProductoById
);

// Crear producto
router.post(
  '/productos',
  upload.single('imagen'),
  productoController.crearProducto
);

// Actualizar producto
router.put(
  '/productos/:id',
  validarIdParam,
  upload.single('imagen'),
  productoController.actualizarProducto
);

// Activar/desactivar producto
router.patch(
  '/productos/:id/toggle',
  validarIdParam,
  productoController.toggleProducto
);

// Actualizar stock
router.patch(
  '/productos/:id/stock',
  validarIdParam,
  productoController.actualizarStock
);

// Eliminar producto
router.delete(
  '/productos/:id',
  validarIdParam,
  soloAdministrador,
  productoController.eliminarProducto
);

// ==========================================
// RUTAS DE USUARIOS
// /api/admin/usuarios
// ==========================================

// IMPORTANTE:
// /usuarios/stats debe estar antes de
// /usuarios/:id para que "stats" no sea
// interpretado como un ID.
router.get(
  '/usuarios/stats',
  usuarioController.getEstadisticasUsuarios
);

// Obtener usuarios
router.get(
  '/usuarios',
  usuarioController.getUsuarios
);

// Obtener usuario por ID
router.get(
  '/usuarios/:id',
  validarIdParam,
  usuarioController.getUsuarioById
);

// Crear usuario
router.post(
  '/usuarios',
  soloAdministrador,
  usuarioController.crearUsuario
);

// Actualizar usuario
router.put(
  '/usuarios/:id',
  validarIdParam,
  soloAdministrador,
  usuarioController.actualizarUsuario
);

// Activar/desactivar usuario
router.patch(
  '/usuarios/:id/toggle',
  validarIdParam,
  soloAdministrador,
  usuarioController.toggleUsuario
);

// Eliminar usuario
router.delete(
  '/usuarios/:id',
  validarIdParam,
  soloAdministrador,
  usuarioController.eliminarUsuario
);

// ==========================================
// RUTAS DE PEDIDOS
// /api/admin/pedidos
// ==========================================

// Confirmar pago
router.put(
  '/pedidos/:id/confirmar-pago',
  validarIdParam,
  soloAdministrador,
  pedidoController.confirmarPago
);

// Estadísticas de pedidos
//
// Debe estar antes de /pedidos/:id.
router.get(
  '/pedidos/estadisticas',
  pedidoController.getEstadisticasPedidos
);

// Obtener todos los pedidos
router.get(
  '/pedidos',
  pedidoController.getAllPedidos
);

// Obtener pedido por ID
router.get(
  '/pedidos/:id',
  validarIdParam,
  pedidoController.getPedidoById
);

// Actualizar estado del pedido
router.put(
  '/pedidos/:id/estado',
  validarIdParam,
  pedidoController.actualizarEstadoPedido
);

// ==========================================
// RUTAS DE PROVEEDORES
// /api/admin/proveedores
// ==========================================

// Obtener proveedores
router.get(
  '/proveedores',
  proveedorController.getProveedores
);

// Obtener proveedor por ID
router.get(
  '/proveedores/:id',
  validarIdParam,
  proveedorController.getProveedorById
);

// Crear proveedor
router.post(
  '/proveedores',
  soloAdministrador,
  proveedorController.crearProveedor
);

// Actualizar proveedor
router.put(
  '/proveedores/:id',
  validarIdParam,
  soloAdministrador,
  proveedorController.actualizarProveedor
);

// Activar/desactivar proveedor
router.patch(
  '/proveedores/:id/toggle',
  validarIdParam,
  soloAdministrador,
  proveedorController.toggleProveedor
);

// Eliminar proveedor
router.delete(
  '/proveedores/:id',
  validarIdParam,
  soloAdministrador,
  proveedorController.eliminarProveedor
);

// ==========================================
// EXPORTAR ROUTER
// ==========================================

module.exports = router;