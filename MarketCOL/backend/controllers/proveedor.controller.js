/**
 * ============================================
 * CONTROLADOR DE PROVEEDORES
 * ============================================
 * Gestiona el CRUD de proveedores para el supermercado.
 * Funciones exclusivas para ADMIN (panel de administración).
 * Requiere autenticación y rol 'administrador' o 'auxiliar' (según ruta).
 */

// Importa el modelo Proveedor desde models/Proveedor.js.
// Representa la tabla 'proveedores' en la BD.
const Proveedor = require('../models/Proveedor');

// Importa el modelo Producto para verificar relaciones antes de eliminar.
const Producto = require('../models/Producto');

/**
 * Obtener todos los proveedores (con filtros opcionales)
 * 
 * Ruta: GET /api/admin/proveedores
 * Query params opcionales: ?activo=true&buscar=texto
 * Retorna lista de proveedores, incluyendo cantidad de productos asociados.
 */
const getProveedores = async (req, res) => {
  try {
    // Extrae filtros de los query params (opcionales)
    const { activo, buscar } = req.query;
    
    // Construye el objeto where dinámicamente
    const where = {};
    
    // Filtro por estado activo/inactivo
    if (activo !== undefined) {
      // Convierte string "true"/"false" a booleano
      where.activo = activo === 'true';
    }
    
    // Filtro de búsqueda por nombre o email
    if (buscar) {
      // Op.or: condición OR en SQL (busca en nombre O en email)
      const { Op } = require('sequelize');
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { email: { [Op.like]: `%${buscar}%` } }
      ];
    }
    
    // Consulta todos los proveedores que coinciden con los filtros
    const proveedores = await Proveedor.findAll({
      where,
      // attributes: permite incluir campos calculados (virtuales)
      attributes: {
        include: [
          // Subconsulta para contar productos asociados a cada proveedor
          // NOTA: Esto requiere que la relación esté definida en los modelos
          [
            require('sequelize').literal(`(
              SELECT COUNT(*)
              FROM productos
              WHERE productos.proveedorId = Proveedor.id
            )`),
            'totalProductos'
          ]
        ]
      },
      order: [['nombre', 'ASC']]  // Orden alfabético por nombre
    });
    
    res.json({
      success: true,
      data: {
        proveedores,
        total: proveedores.length
      }
    });
    
  } catch (error) {
    console.error('Error en getProveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedores',
      error: error.message
    });
  }
};

/**
 * Obtener un proveedor por su ID
 * 
 * Ruta: GET /api/admin/proveedores/:id
 * Incluye lista de productos que suministra (solo datos básicos)
 */
const getProveedorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Busca el proveedor por clave primaria
    const proveedor = await Proveedor.findByPk(id, {
      include: [
        {
          model: Producto,
          as: 'productos',           // Alias de la relación (definir en modelos)
          attributes: ['id', 'nombre', 'precio', 'stock', 'activo'],
          required: false            // LEFT JOIN (trae proveedor aunque no tenga productos)
        }
      ]
    });
    
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: { proveedor }
    });
    
  } catch (error) {
    console.error('Error en getProveedorById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedor',
      error: error.message
    });
  }
};

/**
 * Crear un nuevo proveedor
 * 
 * Ruta: POST /api/admin/proveedores
 * Body esperado: { nombre, contacto, telefono, email, direccion }
 * Acceso: Solo administrador (no auxiliar)
 */
const crearProveedor = async (req, res) => {
  try {
    const { nombre, contacto, telefono, email, direccion } = req.body;
    
    // Validación: nombre es obligatorio
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del proveedor es requerido'
      });
    }
    
    // Validación de email (si se proporciona)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }
    }
    
    // Verificar si ya existe un proveedor con el mismo nombre
    const proveedorExistente = await Proveedor.findOne({
      where: { nombre }
    });
    
    if (proveedorExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un proveedor con ese nombre'
      });
    }
    
    // Crear el proveedor
    const nuevoProveedor = await Proveedor.create({
      nombre: nombre.trim(),
      contacto: contacto || null,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      activo: true  // Por defecto activo
    });
    
    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: { proveedor: nuevoProveedor }
    });
    
  } catch (error) {
    console.error('Error en crearProveedor:', error);
    
    // Manejo de error de unicidad (por si acaso)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un proveedor con ese nombre o email'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear proveedor',
      error: error.message
    });
  }
};

/**
 * Actualizar un proveedor existente
 * 
 * Ruta: PUT /api/admin/proveedores/:id
 * Body: campos a actualizar (todos opcionales)
 * Acceso: Solo administrador
 */
const actualizarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contacto, telefono, email, direccion } = req.body;
    
    // Buscar proveedor
    const proveedor = await Proveedor.findByPk(id);
    
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    // Validar email si se está actualizando
    if (email !== undefined) {
      if (email && email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Formato de email inválido'
          });
        }
      }
    }
    
    // Verificar unicidad de nombre si se está cambiando
    if (nombre && nombre !== proveedor.nombre) {
      const proveedorExistente = await Proveedor.findOne({
        where: { nombre }
      });
      
      if (proveedorExistente && proveedorExistente.id !== proveedor.id) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro proveedor con ese nombre'
        });
      }
    }
    
    // Actualizar solo los campos proporcionados
    if (nombre !== undefined) proveedor.nombre = nombre.trim();
    if (contacto !== undefined) proveedor.contacto = contacto || null;
    if (telefono !== undefined) proveedor.telefono = telefono || null;
    if (email !== undefined) proveedor.email = email || null;
    if (direccion !== undefined) proveedor.direccion = direccion || null;
    
    await proveedor.save();
    
    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: { proveedor }
    });
    
  } catch (error) {
    console.error('Error en actualizarProveedor:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un proveedor con ese nombre o email'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar proveedor',
      error: error.message
    });
  }
};

/**
 * Activar o desactivar un proveedor
 * 
 * Ruta: PATCH /api/admin/proveedores/:id/toggle
 * Invierte el estado actual del campo 'activo'
 * Acceso: Solo administrador
 */
const toggleProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proveedor = await Proveedor.findByPk(id);
    
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    // Invertir estado
    proveedor.activo = !proveedor.activo;
    await proveedor.save();
    
    res.json({
      success: true,
      message: `Proveedor ${proveedor.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: { proveedor }
    });
    
  } catch (error) {
    console.error('Error en toggleProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del proveedor',
      error: error.message
    });
  }
};

/**
 * Eliminar un proveedor permanentemente
 * 
 * Ruta: DELETE /api/admin/proveedores/:id
 * Solo se puede eliminar si NO tiene productos asociados
 * Acceso: Solo administrador
 */
const eliminarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proveedor = await Proveedor.findByPk(id);
    
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    // Verificar si tiene productos asociados
    const productosAsociados = await Producto.count({
      where: { proveedorId: id }
    });
    
    if (productosAsociados > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el proveedor porque tiene ${productosAsociados} producto(s) asociado(s)`
      });
    }
    
    await proveedor.destroy();
    
    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error en eliminarProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar proveedor',
      error: error.message
    });
  }
};

// Exportar todas las funciones
module.exports = {
  getProveedores,
  getProveedorById,
  crearProveedor,
  actualizarProveedor,
  toggleProveedor,
  eliminarProveedor
};