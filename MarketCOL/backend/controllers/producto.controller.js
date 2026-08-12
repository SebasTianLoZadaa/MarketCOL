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
    const {
      categoriaId,
      subcategoriaId,
      activo,
      conStock,
      buscar,
      pagina = '1',
      limite = '100'
    } = req.query;

    // ==========================================
    // VALIDAR CATEGORÍA
    // ==========================================

    const categoriaIdNum =
      categoriaId !== undefined
        ? parsePositiveInteger(categoriaId)
        : null;

    if (
      categoriaId !== undefined &&
      categoriaIdNum === null
    ) {
      return res.status(400).json({
        success: false,
        message: 'El ID de categoría no es válido'
      });
    }

    // ==========================================
    // VALIDAR SUBCATEGORÍA
    // ==========================================

    const subcategoriaIdNum =
      subcategoriaId !== undefined
        ? parsePositiveInteger(subcategoriaId)
        : null;

    if (
      subcategoriaId !== undefined &&
      subcategoriaIdNum === null
    ) {
      return res.status(400).json({
        success: false,
        message: 'El ID de subcategoría no es válido'
      });
    }

    // ==========================================
    // VALIDAR ACTIVO
    // ==========================================

    let activoValue;

    if (activo !== undefined) {
      if (
        activo !== 'true' &&
        activo !== 'false'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'El parámetro activo debe ser true o false'
        });
      }

      activoValue = activo === 'true';
    }

    // ==========================================
    // VALIDAR STOCK
    // ==========================================

    if (
      conStock !== undefined &&
      conStock !== 'true' &&
      conStock !== 'false'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'El parámetro conStock debe ser true o false'
      });
    }

    // ==========================================
    // VALIDAR BÚSQUEDA
    // ==========================================

    let buscarValue = '';

    if (buscar !== undefined) {
      if (typeof buscar !== 'string') {
        return res.status(400).json({
          success: false,
          message:
            'El parámetro buscar no es válido'
        });
      }

      buscarValue = buscar.trim();

      if (buscarValue.length > 100) {
        return res.status(400).json({
          success: false,
          message:
            'El texto de búsqueda es demasiado largo'
        });
      }
    }

    // ==========================================
    // VALIDAR PAGINACIÓN
    // ==========================================

    const paginaNum =
      parsePositiveInteger(pagina);

    const limiteNum =
      parsePositiveInteger(limite);

    if (paginaNum === null) {
      return res.status(400).json({
        success: false,
        message:
          'El número de página no es válido'
      });
    }

    if (
      limiteNum === null ||
      limiteNum > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          'El límite debe estar entre 1 y 100'
      });
    }

    // ==========================================
    // CONSTRUIR WHERE
    // ==========================================

    const where = {};

    if (categoriaIdNum !== null) {
      where.categoriaId = categoriaIdNum;
    }

    if (subcategoriaIdNum !== null) {
      where.subcategoriaId =
        subcategoriaIdNum;
    }

    if (activoValue !== undefined) {
      where.activo = activoValue;
    }

    if (conStock === 'true') {
      where.stock = {
        [Op.gt]: 0
      };
    }

    // ==========================================
    // BÚSQUEDA POR TEXTO
    // ==========================================

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

    // ==========================================
    // PAGINACIÓN
    // ==========================================

    const offset =
      (paginaNum - 1) * limiteNum;

    // ==========================================
    // OPCIONES SEQUELIZE
    // ==========================================

    const opciones = {
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
    };

    const {
      count,
      rows: productos
    } = await Producto.findAndCountAll(
      opciones
    );

    // ==========================================
    // RESPUESTA
    // ==========================================

    res.json({
      success: true,
      data: {
        productos,

        paginacion: {
          total: count,
          pagina: paginaNum,
          limite: limiteNum,
          totalPaginas:
            Math.ceil(
              count / limiteNum
            )
        }
      }
    });

  } catch (error) {
    console.error(
      'Error en getProductos:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Error al obtener productos'
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
        message:
          'ID de producto inválido'
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
        message:
          'Producto no encontrado'
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
      message:
        'Error al obtener producto'
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

    // ==========================================
    // VALIDAR CAMPOS OBLIGATORIOS
    // ==========================================

    if (
      !nombre ||
      !precio ||
      !categoriaId ||
      !subcategoriaId
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Faltan campos requeridos: nombre, precio, categoriaId y subcategoriaId'
      });
    }

    // ==========================================
    // VALIDAR IDs
    // ==========================================

    const categoriaIdNum =
      parsePositiveInteger(
        categoriaId
      );

    const subcategoriaIdNum =
      parsePositiveInteger(
        subcategoriaId
      );

    if (categoriaIdNum === null) {
      return res.status(400).json({
        success: false,
        message:
          'El ID de categoría no es válido'
      });
    }

    if (subcategoriaIdNum === null) {
      return res.status(400).json({
        success: false,
        message:
          'El ID de subcategoría no es válido'
      });
    }

    // ==========================================
    // VALIDAR PROVEEDOR
    // ==========================================

    let proveedorIdNum = null;

    if (
      proveedorId !== undefined &&
      proveedorId !== null &&
      proveedorId !== ''
    ) {
      proveedorIdNum =
        parsePositiveInteger(
          proveedorId
        );

      if (proveedorIdNum === null) {
        return res.status(400).json({
          success: false,
          message:
            'El ID de proveedor no es válido'
        });
      }
    }

    // ==========================================
    // VALIDAR CATEGORÍA
    // ==========================================

    const categoria =
      await Categoria.findByPk(
        categoriaIdNum
      );

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message:
          'No existe la categoría seleccionada'
      });
    }

    if (!categoria.activo) {
      return res.status(400).json({
        success: false,
        message:
          'La categoría está inactiva'
      });
    }

    // ==========================================
    // VALIDAR SUBCATEGORÍA
    // ==========================================

    const subcategoria =
      await Subcategoria.findByPk(
        subcategoriaIdNum
      );

    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        message:
          'No existe la subcategoría seleccionada'
      });
    }

    if (!subcategoria.activo) {
      return res.status(400).json({
        success: false,
        message:
          'La subcategoría está inactiva'
      });
    }

    if (
      subcategoria.categoriaId !==
      categoriaIdNum
    ) {
      return res.status(400).json({
        success: false,
        message:
          'La subcategoría no pertenece a la categoría seleccionada'
      });
    }

    // ==========================================
    // VALIDAR PRECIO
    // ==========================================

    const precioNum =
      Number(precio);

    if (
      !Number.isFinite(precioNum) ||
      precioNum <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'El precio debe ser mayor a 0'
      });
    }

    // ==========================================
    // VALIDAR STOCK
    // ==========================================

    const stockNum =
      stock === undefined ||
      stock === ''
        ? 0
        : Number(stock);

    if (
      !Number.isInteger(stockNum) ||
      stockNum < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'El stock debe ser un número entero no negativo'
      });
    }

    // ==========================================
    // IMAGEN
    // ==========================================

    const imagen = req.file
      ? getStoredImageUrl(
          req,
          req.file.filename
        )
      : getStoredImageUrl(
          req,
          getImagenFromBody(req.body)
        );

    // ==========================================
    // CREAR PRODUCTO
    // ==========================================

    const nuevoProducto =
      await Producto.create({
        nombre,
        descripcion:
          descripcion || null,

        precio: precioNum,

        stock: stockNum,

        categoriaId:
          categoriaIdNum,

        subcategoriaId:
          subcategoriaIdNum,

        proveedorId:
          proveedorIdNum,

        imagen,

        activo: true
      });

    // ==========================================
    // RECARGAR RELACIONES
    // ==========================================

    await nuevoProducto.reload({
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

    res.status(201).json({
      success: true,
      message:
        'Producto creado exitosamente',

      data: {
        producto: nuevoProducto
      }
    });

  } catch (error) {

    console.error(
      'Error en crearProducto:',
      error
    );

    // Elimina archivo si falló la creación.
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
        'Error al crear producto'
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

    // ==========================================
    // VALIDAR CATEGORÍA
    // ==========================================

    let categoriaIdNum =
      producto.categoriaId;

    if (
      categoriaId !== undefined &&
      categoriaId !== ''
    ) {
      categoriaIdNum =
        parsePositiveInteger(
          categoriaId
        );

      if (categoriaIdNum === null) {
        return res.status(400).json({
          success: false,
          message:
            'El ID de categoría no es válido'
        });
      }

      if (
        categoriaIdNum !==
        producto.categoriaId
      ) {
        const categoria =
          await Categoria.findByPk(
            categoriaIdNum
          );

        if (
          !categoria ||
          !categoria.activo
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Categoría inválida o inactiva'
          });
        }
      }
    }

    // ==========================================
    // VALIDAR SUBCATEGORÍA
    // ==========================================

    if (
      subcategoriaId !== undefined &&
      subcategoriaId !== ''
    ) {

      const subcategoriaIdNum =
        parsePositiveInteger(
          subcategoriaId
        );

      if (subcategoriaIdNum === null) {
        return res.status(400).json({
          success: false,
          message:
            'El ID de subcategoría no es válido'
        });
      }

      if (
        subcategoriaIdNum !==
        producto.subcategoriaId
      ) {

        const subcategoria =
          await Subcategoria.findByPk(
            subcategoriaIdNum
          );

        if (
          !subcategoria ||
          !subcategoria.activo
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Subcategoría inválida o inactiva'
          });
        }

        if (
          subcategoria.categoriaId !==
          categoriaIdNum
        ) {
          return res.status(400).json({
            success: false,
            message:
              'La subcategoría no pertenece a la categoría seleccionada'
          });
        }
      }
    }

    // ==========================================
    // VALIDAR PRECIO
    // ==========================================

    if (
      precio !== undefined &&
      precio !== ''
    ) {
      const precioNum =
        Number(precio);

      if (
        !Number.isFinite(precioNum) ||
        precioNum <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'El precio debe ser mayor a 0'
        });
      }

      producto.precio =
        precioNum;
    }

    // ==========================================
    // VALIDAR STOCK
    // ==========================================

    if (
      stock !== undefined &&
      stock !== ''
    ) {
      const stockNum =
        Number(stock);

      if (
        !Number.isInteger(stockNum) ||
        stockNum < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'El stock debe ser un número entero no negativo'
        });
      }

      producto.stock =
        stockNum;
    }

    // ==========================================
    // VALIDAR PROVEEDOR
    // ==========================================

    if (
      proveedorId !== undefined
    ) {

      if (proveedorId === '') {

        producto.proveedorId =
          null;

      } else {

        const proveedorIdNum =
          parsePositiveInteger(
            proveedorId
          );

        if (
          proveedorIdNum === null
        ) {
          return res.status(400).json({
            success: false,
            message:
              'El ID de proveedor no es válido'
          });
        }

        producto.proveedorId =
          proveedorIdNum;
      }
    }

    // ==========================================
    // IMAGEN
    // ==========================================

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

    } else if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        'imagen'
      ) ||
      Object.prototype.hasOwnProperty.call(
        req.body,
        'image'
      ) ||
      Object.prototype.hasOwnProperty.call(
        req.body,
        'imagenUrl'
      ) ||
      Object.prototype.hasOwnProperty.call(
        req.body,
        'imageUrl'
      )
    ) {

      producto.imagen =
        getStoredImageUrl(
          req,
          getImagenFromBody(req.body)
        );
    }

    // ==========================================
    // ACTUALIZAR CAMPOS
    // ==========================================

    if (
      nombre !== undefined
    ) {
      producto.nombre =
        nombre;
    }

    if (
      descripcion !== undefined
    ) {
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
        parsePositiveInteger(
          subcategoriaId
        );
    }

    if (
      activo !== undefined
    ) {

      if (
        typeof activo === 'string'
      ) {

        producto.activo =
          [
            'true',
            '1',
            'on'
          ].includes(
            activo.toLowerCase()
          );

      } else {

        producto.activo =
          Boolean(activo);
      }
    }

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

    res.json({
      success: true,

      message:
        `Stock ${
          operacion === 'aumentar'
            ? 'aumentado'
            : operacion === 'reducir'
              ? 'reducido'
              : 'establecido'
        } exitosamente`,

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