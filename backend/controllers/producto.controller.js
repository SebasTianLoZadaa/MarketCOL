/**
 * ============================================
 * CONTROLADOR DE PRODUCTOS (Admin)
 * ============================================
 *
 * CRUD completo de productos con subida de imágenes (Multer).
 * Incluye:
 * - Listar productos
 * - Ver producto
 * - Crear producto
 * - Actualizar producto
 * - Activar/desactivar producto
 * - Eliminar producto
 * - Gestión de stock
 *
 * Las rutas están definidas en routes/admin.routes.js
 */

const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const Proveedor = require('../models/Proveedor');

const { Op } = require('sequelize');
const { deleteFile } = require('../config/multer');

// ==========================================
// ERRORES DE VALIDACIÓN
// ==========================================

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Valida y convierte un ID a entero positivo seguro.
 *
 * Retorna null si el valor no es válido.
 */
const parsePositiveInteger = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const stringValue = String(value).trim();

  if (!/^\d+$/.test(stringValue)) {
    return null;
  }

  const numberValue = Number(stringValue);

  if (
    !Number.isSafeInteger(numberValue) ||
    numberValue <= 0
  ) {
    return null;
  }

  return numberValue;
};

/**
 * Obtiene una imagen enviada desde el body.
 */
const getImagenFromBody = (body = {}) => {
  const rawValue =
    body.imagen ??
    body.image ??
    body.imagenUrl ??
    body.imageUrl;

  if (
    rawValue === null ||
    rawValue === undefined
  ) {
    return null;
  }

  if (typeof rawValue !== 'string') {
    return null;
  }

  const trimmed = rawValue.trim();

  if (
    !trimmed ||
    ['null', 'undefined'].includes(
      trimmed.toLowerCase()
    )
  ) {
    return null;
  }

  return trimmed;
};

/**
 * Obtiene la URL pública base del servidor.
 */
const getPublicBaseUrl = (req) => {
  const protocol = req.protocol || 'http';

  const host =
    req.get?.('host') ||
    req.headers?.host ||
    'localhost:5000';

  return `${protocol}://${host}`;
};

/**
 * Convierte una ruta de imagen almacenada
 * en una URL pública.
 */
const getStoredImageUrl = (req, imageValue) => {
  if (
    imageValue === null ||
    imageValue === undefined
  ) {
    return null;
  }

  const trimmed = String(imageValue).trim();

  if (
    !trimmed ||
    ['null', 'undefined'].includes(
      trimmed.toLowerCase()
    )
  ) {
    return null;
  }

  /*
   * Si ya es una URL absoluta se conserva.
   */
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const baseUrl = getPublicBaseUrl(req);

  const normalizedPath = trimmed
    .replaceAll('\\', '/')
    .replace(/^\/+/, '');

  if (
    normalizedPath.startsWith('uploads/') ||
    normalizedPath.startsWith('images/')
  ) {
    return `${baseUrl}/${normalizedPath}`;
  }

  if (trimmed.startsWith('/')) {
    return `${baseUrl}${trimmed}`;
  }

  return `${baseUrl}/uploads/${normalizedPath}`;
};

// ==========================================
// FUNCIONES AUXILIARES PARA GET PRODUCTOS
// ==========================================

/**
 * Valida un ID opcional recibido por query.
 */
const parseOptionalId = (value, fieldName) => {
  if (value === undefined) {
    return null;
  }

  const parsedValue = parsePositiveInteger(value);

  if (parsedValue === null) {
    throw new ValidationError(
      `El ID de ${fieldName} no es válido`
    );
  }

  return parsedValue;
};

/**
 * Valida un parámetro booleano opcional.
 */
const parseOptionalBoolean = (value, fieldName) => {
  if (value === undefined) {
    return undefined;
  }

  const validValues = ['true', 'false'];

  if (!validValues.includes(value)) {
    throw new ValidationError(
      `El parámetro ${fieldName} debe ser true o false`
    );
  }

  return value === 'true';
};

/**
 * Valida el texto de búsqueda.
 */
const parseSearchValue = (value) => {
  if (value === undefined) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new ValidationError(
      'El parámetro buscar no es válido'
    );
  }

  const searchValue = value.trim();

  if (searchValue.length > 100) {
    throw new ValidationError(
      'El texto de búsqueda es demasiado largo'
    );
  }

  return searchValue;
};

/**
 * Valida los parámetros de paginación.
 */
const parsePagination = (pagina, limite) => {
  const paginaNum = parsePositiveInteger(pagina);
  const limiteNum = parsePositiveInteger(limite);

  if (paginaNum === null) {
    throw new ValidationError(
      'El número de página no es válido'
    );
  }

  if (limiteNum === null || limiteNum > 100) {
    throw new ValidationError(
      'El límite debe estar entre 1 y 100'
    );
  }

  return {
    paginaNum,
    limiteNum
  };
};

/**
 * Valida todos los filtros de productos.
 */
const validateProductFilters = (query) => {
  const {
    categoriaId,
    subcategoriaId,
    activo,
    conStock,
    buscar,
    pagina = '1',
    limite = '100'
  } = query;

  const categoriaIdNum = parseOptionalId(
    categoriaId,
    'categoría'
  );

  const subcategoriaIdNum = parseOptionalId(
    subcategoriaId,
    'subcategoría'
  );

  const activoValue = parseOptionalBoolean(
    activo,
    'activo'
  );

  const conStockValue = parseOptionalBoolean(
    conStock,
    'conStock'
  );

  const buscarValue = parseSearchValue(buscar);

  const {
    paginaNum,
    limiteNum
  } = parsePagination(
    pagina,
    limite
  );

  return {
    categoriaIdNum,
    subcategoriaIdNum,
    activoValue,
    conStockValue,
    buscarValue,
    paginaNum,
    limiteNum
  };
};

/**
 * Construye el WHERE de Sequelize.
 */
const buildProductWhere = ({
  categoriaIdNum,
  subcategoriaIdNum,
  activoValue,
  conStockValue,
  buscarValue
}) => {
  const where = {};

  if (categoriaIdNum !== null) {
    where.categoriaId = categoriaIdNum;
  }

  if (subcategoriaIdNum !== null) {
    where.subcategoriaId = subcategoriaIdNum;
  }

  if (activoValue !== undefined) {
    where.activo = activoValue;
  }

  if (conStockValue === true) {
    where.stock = {
      [Op.gt]: 0
    };
  }

  if (buscarValue) {
    where[Op.or] = [
      {
        nombre: {
          [Op.like]: `%${buscarValue}%`
        }
      },
      {
        descripcion: {
          [Op.like]: `%${buscarValue}%`
        }
      }
    ];
  }

  return where;
};

/**
 * Construye las opciones utilizadas por Sequelize.
 */
const buildProductQueryOptions = (
  where,
  limiteNum,
  offset
) => ({
  where,

  include: [
    {
      model: Categoria,
      as: 'categoria',
      attributes: [
        'id',
        'nombre'
      ]
    },
    {
      model: Subcategoria,
      as: 'subcategoria',
      attributes: [
        'id',
        'nombre'
      ]
    },
    {
      model: Proveedor,
      as: 'proveedor',
      attributes: [
        'id',
        'nombre'
      ]
    }
  ],

  limit: limiteNum,
  offset,

  order: [
    ['nombre', 'ASC']
  ]
});

// ==========================================
// GET PRODUCTOS
// ==========================================

/**
 * Obtener todos los productos (admin)
 *
 * Ruta:
 * GET /api/admin/productos
 *
 * Query params opcionales:
 * - categoriaId
 * - subcategoriaId
 * - activo
 * - conStock
 * - buscar
 * - pagina
 * - limite
 */
const getProductos = async (req, res) => {
  try {
    const filtros = validateProductFilters(
      req.query
    );

    const where = buildProductWhere(filtros);

    const offset =
      (filtros.paginaNum - 1) *
      filtros.limiteNum;

    const opciones =
      buildProductQueryOptions(
        where,
        filtros.limiteNum,
        offset
      );

    const {
      count,
      rows: productos
    } = await Producto.findAndCountAll(
      opciones
    );

    res.json({
      success: true,
      data: {
        productos,

        paginacion: {
          total: count,
          pagina: filtros.paginaNum,
          limite: filtros.limiteNum,
          totalPaginas: Math.ceil(
            count / filtros.limiteNum
          )
        }
      }
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(
        error.statusCode
      ).json({
        success: false,
        message: error.message
      });
    }

    console.error(
      'Error en getProductos:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Error al obtener productos'
    });
  }
};

// ==========================================
// GET PRODUCTO POR ID
// ==========================================

/**
 * Obtener un producto por ID.
 *
 * Ruta:
 * GET /api/admin/productos/:id
 */
const getProductoById = async (req, res) => {
  try {
    const productoId =
      parsePositiveInteger(
        req.params.id
      );

    if (productoId === null) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const producto =
      await Producto.findByPk(
        productoId,
        {
          include: [
            {
              model: Categoria,
              as: 'categoria',
              attributes: [
                'id',
                'nombre',
                'activo'
              ]
            },
            {
              model: Subcategoria,
              as: 'subcategoria',
              attributes: [
                'id',
                'nombre',
                'activo'
              ]
            },
            {
              model: Proveedor,
              as: 'proveedor',
              attributes: [
                'id',
                'nombre',
                'contacto'
              ]
            }
          ]
        }
      );

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        producto
      }
    });
  } catch (error) {
    console.error(
      'Error en getProductoById:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Error al obtener producto'
    });
  }
};

// ==========================================
// CREAR PRODUCTO
// ==========================================

/**
 * Crear nuevo producto.
 *
 * Ruta:
 * POST /api/admin/productos
 */
const validarIdsCrearProducto = (categoriaId, subcategoriaId, proveedorId) => {
  const categoriaIdNum = parsePositiveInteger(categoriaId);

  if (categoriaIdNum === null) {
    return { error: 'El ID de categoría no es válido' };
  }

  const subcategoriaIdNum = parsePositiveInteger(subcategoriaId);

  if (subcategoriaIdNum === null) {
    return { error: 'El ID de subcategoría no es válido' };
  }

  let proveedorIdNum = null;

  if (proveedorId !== undefined && proveedorId !== null && proveedorId !== '') {
    proveedorIdNum = parsePositiveInteger(proveedorId);

    if (proveedorIdNum === null) {
      return { error: 'El ID de proveedor no es válido' };
    }
  }

  return {
    categoriaIdNum,
    subcategoriaIdNum,
    proveedorIdNum,
    error: null
  };
};

const validarPrecioYStock = (precio, stock) => {
  const precioNum = Number(precio);

  if (!Number.isFinite(precioNum) || precioNum <= 0) {
    return { error: 'El precio debe ser mayor a 0' };
  }

  const stockNum =
    stock === undefined || stock === ''
      ? 0
      : Number(stock);

  if (!Number.isInteger(stockNum) || stockNum < 0) {
    return {
      error: 'El stock debe ser un número entero no negativo'
    };
  }

  return {
    precioNum,
    stockNum,
    error: null
  };
};

const validarCategoriaYSubcategoria = async (
  categoriaIdNum,
  subcategoriaIdNum
) => {
  const categoria = await Categoria.findByPk(categoriaIdNum);

  if (!categoria) {
    return {
      error: 'No existe la categoría seleccionada',
      status: 404
    };
  }

  if (!categoria.activo) {
    return {
      error: 'La categoría está inactiva',
      status: 400
    };
  }

  const subcategoria = await Subcategoria.findByPk(
    subcategoriaIdNum
  );

  if (!subcategoria) {
    return {
      error: 'No existe la subcategoría seleccionada',
      status: 404
    };
  }

  if (!subcategoria.activo) {
    return {
      error: 'La subcategoría está inactiva',
      status: 400
    };
  }

  if (subcategoria.categoriaId !== categoriaIdNum) {
    return {
      error:
        'La subcategoría no pertenece a la categoría seleccionada',
      status: 400
    };
  }

  return {
    categoria,
    subcategoria,
    error: null
  };
};
const crearProducto = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      stock,
      categoriaId,
      subcategoriaId,
      proveedorId
    } = req.body;

    if (!nombre || !precio || !categoriaId || !subcategoriaId) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }

    const ids = validarIdsCrearProducto(
      categoriaId,
      subcategoriaId,
      proveedorId
    );

    if (ids.error) {
      return res.status(400).json({
        success: false,
        message: ids.error
      });
    }

    const valores = validarPrecioYStock(precio, stock);

    if (valores.error) {
      return res.status(400).json({
        success: false,
        message: valores.error
      });
    }

    const relaciones = await validarCategoriaYSubcategoria(
      ids.categoriaIdNum,
      ids.subcategoriaIdNum
    );

    if (relaciones.error) {
      return res.status(relaciones.status || 400).json({
        success: false,
        message: relaciones.error
      });
    }

    const imagen = req.file
      ? getStoredImageUrl(req, req.file.filename)
      : getStoredImageUrl(req, null);

    const nuevoProducto = await Producto.create({
      nombre: nombre.trim(),
      descripcion: descripcion || null,
      precio: valores.precioNum,
      stock: valores.stockNum,
      categoriaId: ids.categoriaIdNum,
      subcategoriaId: ids.subcategoriaIdNum,
      proveedorId: ids.proveedorIdNum,
      imagen
    });

    return res.status(201).json({
      success: true,
      message: 'Producto creado correctamente',
      data: {
        producto: nuevoProducto
      }
    });
  } catch (error) {
    console.error('Error en crearProducto:', error);

    if (req.file) {
      deleteFile(req.file.filename);
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors?.map((item) => item.message)
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ==========================================
// ACTUALIZAR PRODUCTO
// ==========================================

/**
 * Actualizar producto existente.
 *
 * Ruta:
 * PUT /api/admin/productos/:id
 */
// ==========================================
// FUNCIONES AUXILIARES - ACTUALIZAR PRODUCTO
// ==========================================

const validarCategoriaActualizacion = async (
  categoriaId,
  producto
) => {
  let categoriaIdNum = producto.categoriaId;

  if (
    categoriaId === undefined ||
    categoriaId === ''
  ) {
    return {
      categoriaIdNum,
      error: null
    };
  }

  categoriaIdNum =
    parsePositiveInteger(categoriaId);

  if (categoriaIdNum === null) {
    return {
      categoriaIdNum: null,
      error:
        'El ID de categoría no es válido'
    };
  }

  if (
    categoriaIdNum !==
    producto.categoriaId
  ) {
    const categoria =
      await Categoria.findByPk(
        categoriaIdNum
      );

    if (!categoria?.activo) {
      return {
        categoriaIdNum,
        error:
          'Categoría inválida o inactiva'
      };
    }
  }

  return {
    categoriaIdNum,
    error: null
  };
};


const validarSubcategoriaActualizacion = async (
  subcategoriaId,
  producto,
  categoriaIdNum
) => {
  if (
    subcategoriaId === undefined ||
    subcategoriaId === ''
  ) {
    return {
      subcategoriaIdNum:
        producto.subcategoriaId,
      error: null
    };
  }

  const subcategoriaIdNum =
    parsePositiveInteger(
      subcategoriaId
    );

  if (subcategoriaIdNum === null) {
    return {
      subcategoriaIdNum: null,
      error:
        'El ID de subcategoría no es válido'
    };
  }

  if (
    subcategoriaIdNum !==
    producto.subcategoriaId
  ) {
    const subcategoria =
      await Subcategoria.findByPk(
        subcategoriaIdNum
      );

    if (!subcategoria?.activo) {
      return {
        subcategoriaIdNum,
        error:
          'Subcategoría inválida o inactiva'
      };
    }

    if (
      subcategoria.categoriaId !==
      categoriaIdNum
    ) {
      return {
        subcategoriaIdNum,
        error:
          'La subcategoría no pertenece a la categoría seleccionada'
      };
    }
  }

  return {
    subcategoriaIdNum,
    error: null
  };
};


const validarPrecioActualizacion = (
  precio
) => {
  if (
    precio === undefined ||
    precio === ''
  ) {
    return {
      value: null,
      error: null
    };
  }

  const precioNum = Number(precio);

  if (
    !Number.isFinite(precioNum) ||
    precioNum <= 0
  ) {
    return {
      value: null,
      error:
        'El precio debe ser mayor a 0'
    };
  }

  return {
    value: precioNum,
    error: null
  };
};


const validarStockActualizacion = (
  stock
) => {
  if (
    stock === undefined ||
    stock === ''
  ) {
    return {
      value: null,
      error: null
    };
  }

  const stockNum = Number(stock);

  if (
    !Number.isInteger(stockNum) ||
    stockNum < 0
  ) {
    return {
      value: null,
      error:
        'El stock debe ser un número entero no negativo'
    };
  }

  return {
    value: stockNum,
    error: null
  };
};


const validarProveedorActualizacion = (
  proveedorId
) => {
  if (proveedorId === undefined) {
    return {
      value: undefined,
      error: null
    };
  }

  if (proveedorId === '') {
    return {
      value: null,
      error: null
    };
  }

  const proveedorIdNum =
    parsePositiveInteger(
      proveedorId
    );

  if (proveedorIdNum === null) {
    return {
      value: null,
      error:
        'El ID de proveedor no es válido'
    };
  }

  return {
    value: proveedorIdNum,
    error: null
  };
};


const actualizarImagenProducto = (
  req,
  producto
) => {
  if (req.file) {
    if (producto.imagen) {
      deleteFile(
        producto.imagen
      );
    }

    producto.imagen =
      getStoredImageUrl(
        req,
        req.file.filename
      );

    return;
  }

  const tieneImagenEnBody =
    Object.hasOwn(req.body, 'imagen') ||
    Object.hasOwn(req.body, 'image') ||
    Object.hasOwn(req.body, 'imagenUrl') ||
    Object.hasOwn(req.body, 'imageUrl');

  if (tieneImagenEnBody) {
    producto.imagen =
      getStoredImageUrl(
        req,
        getImagenFromBody(req.body)
      );
  }
};


const actualizarCamposProducto = (
  producto,
  datos,
  categoriaIdNum,
  subcategoriaIdNum
) => {
  const {
    nombre,
    descripcion,
    categoriaId,
    subcategoriaId,
    activo
  } = datos;

  if (nombre !== undefined) {
    producto.nombre = nombre;
  }

  if (descripcion !== undefined) {
    producto.descripcion =
      descripcion;
  }

  if (
    categoriaId !== undefined &&
    categoriaId !== ''
  ) {
    producto.categoriaId =
      categoriaIdNum;
  }

  if (
    subcategoriaId !== undefined &&
    subcategoriaId !== ''
  ) {
    producto.subcategoriaId =
      subcategoriaIdNum;
  }

  if (activo !== undefined) {
    producto.activo =
      typeof activo === 'string'
        ? [
            'true',
            '1',
            'on'
          ].includes(
            activo.toLowerCase()
          )
        : Boolean(activo);
  }
};


// ==========================================
// ACTUALIZAR PRODUCTO
// ==========================================

const actualizarProducto = async (
  req,
  res
) => {
  try {
    const productoId =
      parsePositiveInteger(
        req.params.id
      );

    if (productoId === null) {
      return res.status(400).json({
        success: false,
        message:
          'ID de producto inválido'
      });
    }

    const {
      nombre,
      descripcion,
      precio,
      stock,
      categoriaId,
      subcategoriaId,
      proveedorId,
      activo
    } = req.body;

    const producto =
      await Producto.findByPk(
        productoId
      );

    if (!producto) {
      return res.status(404).json({
        success: false,
        message:
          'Producto no encontrado'
      });
    }

    // ==========================================
    // VALIDAR CATEGORÍA
    // ==========================================

    const categoriaResultado =
      await validarCategoriaActualizacion(
        categoriaId,
        producto
      );

    if (categoriaResultado.error) {
      return res.status(400).json({
        success: false,
        message:
          categoriaResultado.error
      });
    }

    const {
      categoriaIdNum
    } = categoriaResultado;

    // ==========================================
    // VALIDAR SUBCATEGORÍA
    // ==========================================

    const subcategoriaResultado =
      await validarSubcategoriaActualizacion(
        subcategoriaId,
        producto,
        categoriaIdNum
      );

    if (subcategoriaResultado.error) {
      return res.status(400).json({
        success: false,
        message:
          subcategoriaResultado.error
      });
    }

    const {
      subcategoriaIdNum
    } = subcategoriaResultado;

    // ==========================================
    // VALIDAR PRECIO
    // ==========================================

    const precioResultado =
      validarPrecioActualizacion(
        precio
      );

    if (precioResultado.error) {
      return res.status(400).json({
        success: false,
        message:
          precioResultado.error
      });
    }

    if (
      precioResultado.value !== null
    ) {
      producto.precio =
        precioResultado.value;
    }

    // ==========================================
    // VALIDAR STOCK
    // ==========================================

    const stockResultado =
      validarStockActualizacion(
        stock
      );

    if (stockResultado.error) {
      return res.status(400).json({
        success: false,
        message:
          stockResultado.error
      });
    }

    if (
      stockResultado.value !== null
    ) {
      producto.stock =
        stockResultado.value;
    }

    // ==========================================
    // VALIDAR PROVEEDOR
    // ==========================================

    const proveedorResultado =
      validarProveedorActualizacion(
        proveedorId
      );

    if (proveedorResultado.error) {
      return res.status(400).json({
        success: false,
        message:
          proveedorResultado.error
      });
    }

    if (
      proveedorResultado.value !==
      undefined
    ) {
      producto.proveedorId =
        proveedorResultado.value;
    }

    // ==========================================
    // IMAGEN
    // ==========================================

    actualizarImagenProducto(
      req,
      producto
    );

    // ==========================================
    // ACTUALIZAR CAMPOS
    // ==========================================

    actualizarCamposProducto(
      producto,
      {
        nombre,
        descripcion,
        categoriaId,
        subcategoriaId,
        activo
      },
      categoriaIdNum,
      subcategoriaIdNum
    );

    // ==========================================
    // GUARDAR
    // ==========================================

    await producto.save();

    // ==========================================
    // RECARGAR RELACIONES
    // ==========================================

    await producto.reload({
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: [
            'id',
            'nombre'
          ]
        },
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: [
            'id',
            'nombre'
          ]
        },
        {
          model: Proveedor,
          as: 'proveedor',
          attributes: [
            'id',
            'nombre'
          ]
        }
      ]
    });

    res.json({
      success: true,
      message:
        'Producto actualizado exitosamente',
      data: {
        producto
      }
    });
  } catch (error) {
    console.error(
      'Error en actualizarProducto:',
      error
    );

    if (req.file) {
      deleteFile(
        req.file.filename
      );
    }

    if (
      error.name ===
      'SequelizeValidationError'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Errores de validación',
        errors:
          error.errors.map(
            (e) => e.message
          )
      });
    }

    res.status(500).json({
      success: false,
      message:
        'Error al actualizar producto'
    });
  }
};

// ==========================================
// TOGGLE PRODUCTO
// ==========================================

/**
 * Activar/desactivar producto.
 *
 * Ruta:
 * PATCH /api/admin/productos/:id/toggle
 */
const toggleProducto = async (
  req,
  res
) => {
  try {
    const productoId =
      parsePositiveInteger(
        req.params.id
      );

    if (productoId === null) {
      return res.status(400).json({
        success: false,
        message:
          'ID de producto inválido'
      });
    }

    const producto =
      await Producto.findByPk(
        productoId
      );

    if (!producto) {
      return res.status(404).json({
        success: false,
        message:
          'Producto no encontrado'
      });
    }

    producto.activo =
      !producto.activo;

    await producto.save();

    res.json({
      success: true,
      message:
        `Producto ${
          producto.activo
            ? 'activado'
            : 'desactivado'
        } exitosamente`,
      data: {
        producto
      }
    });
  } catch (error) {
    console.error(
      'Error en toggleProducto:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Error al cambiar estado del producto'
    });
  }
};

// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

/**
 * Eliminar producto.
 *
 * Ruta:
 * DELETE /api/admin/productos/:id
 */
const eliminarProducto = async (
  req,
  res
) => {
  try {
    const productoId =
      parsePositiveInteger(
        req.params.id
      );

    if (productoId === null) {
      return res.status(400).json({
        success: false,
        message:
          'ID de producto inválido'
      });
    }

    const producto =
      await Producto.findByPk(
        productoId
      );

    if (!producto) {
      return res.status(404).json({
        success: false,
        message:
          'Producto no encontrado'
      });
    }

    await producto.destroy();

    res.json({
      success: true,
      message:
        'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error(
      'Error en eliminarProducto:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Error al eliminar producto'
    });
  }
};

// ==========================================
// ACTUALIZAR STOCK
// ==========================================

/**
 * Actualizar stock de un producto.
 *
 * Ruta:
 * PATCH /api/admin/productos/:id/stock
 *
 * Body:
 * {
 *   cantidad,
 *   operacion
 * }
 *
 * Operaciones:
 * - aumentar
 * - reducir
 * - establecer
 */
const actualizarStock = async (
  req,
  res
) => {
  try {
    const productoId =
      parsePositiveInteger(
        req.params.id
      );

    if (productoId === null) {
      return res.status(400).json({
        success: false,
        message:
          'ID de producto inválido'
      });
    }

    const {
      cantidad,
      operacion
    } = req.body;

    // ==========================================
    // VALIDAR CAMPOS
    // ==========================================

    if (
      cantidad === undefined ||
      operacion === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Se requiere cantidad y operación'
      });
    }

    // ==========================================
    // VALIDAR CANTIDAD
    // ==========================================

    const cantidadNum =
      Number(cantidad);

    if (
      !Number.isInteger(
        cantidadNum
      ) ||
      cantidadNum < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'La cantidad debe ser un número entero no negativo'
      });
    }

    // ==========================================
    // VALIDAR OPERACIÓN
    // ==========================================

    const operacionesValidas = [
      'aumentar',
      'reducir',
      'establecer'
    ];

    if (
      typeof operacion !== 'string' ||
      !operacionesValidas.includes(
        operacion
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Operación inválida. Usa: aumentar, reducir o establecer'
      });
    }

    // ==========================================
    // BUSCAR PRODUCTO
    // ==========================================

    const producto =
      await Producto.findByPk(
        productoId
      );

    if (!producto) {
      return res.status(404).json({
        success: false,
        message:
          'Producto no encontrado'
      });
    }

    const stockAnterior =
      producto.stock;

    let nuevoStock;

    // ==========================================
    // APLICAR OPERACIÓN
    // ==========================================

    switch (operacion) {
      case 'aumentar':
        await producto.aumentarStock(
          cantidadNum
        );

        nuevoStock =
          producto.stock;

        break;

      case 'reducir':
        if (
          cantidadNum >
          producto.stock
        ) {
          return res.status(400).json({
            success: false,
            message:
              `No hay suficiente stock. Stock actual: ${producto.stock}`
          });
        }

        await producto.reducirStock(
          cantidadNum
        );

        nuevoStock =
          producto.stock;

        break;

      case 'establecer':
        producto.stock =
          cantidadNum;

        await producto.save();

        nuevoStock =
          producto.stock;

        break;

      default:
        return res.status(400).json({
          success: false,
          message:
            'Operación inválida'
        });
    }

    // ==========================================
    // VALIDAR RESULTADO
    // ==========================================

    if (
      !Number.isInteger(
        nuevoStock
      ) ||
      nuevoStock < 0
    ) {
      return res.status(500).json({
        success: false,
        message:
          'Error al calcular el nuevo stock'
      });
    }

    // ==========================================
    // RESPUESTA
    // ==========================================

    const mensajesOperacion = {
      aumentar: 'aumentado',
      reducir: 'reducido',
      establecer: 'establecido'
    };

    res.json({
      success: true,

      message:
        `Stock ${mensajesOperacion[operacion]} exitosamente`,

      data: {
        productoId:
          producto.id,

        nombre:
          producto.nombre,

        stockAnterior:
          operacion === 'establecer'
            ? null
            : stockAnterior,

        stockNuevo:
          producto.stock
      }
    });
  } catch (error) {
    console.error(
      'Error en actualizarStock:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Error al actualizar stock'
    });
  }
};

// ==========================================
// EXPORTAR CONTROLADORES
// ==========================================

module.exports = {
  getProductos,
  getProductoById,
  crearProducto,
  actualizarProducto,
  toggleProducto,
  eliminarProducto,
  actualizarStock
};