/**
 * ============================================
 * MODELO DETALLE PEDIDO
 * ============================================
 * Define la estructura de la tabla 'detalle_pedidos' en MySQL usando Sequelize ORM.
 * Cada fila representa UN producto incluido dentro de un pedido específico.
 * Es la tabla intermedia de la relación muchos-a-muchos entre Pedido y Producto.
 * Ejemplo: Si un pedido tiene 3 productos, habrá 3 filas en esta tabla con el mismo pedidoId.
 * Guarda precio y cantidad "congelados" al momento de la compra (historial inmutable).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ============================================
// CONFIGURACIÓN DE VALIDACIONES (DRY)
// ============================================

/**
 * Validadores reutilizables para evitar duplicidad
 */
const VALIDACIONES = {
  // Validación para campos obligatorios con mensaje personalizado
  required: (campo, mensaje) => ({
    notNull: { msg: mensaje || `Debe especificar un ${campo}` }
  }),

  // Validación para números enteros
  entero: (minimo = 1, mensaje = null) => ({
    isInt: { msg: mensaje || 'Debe ser un número entero' },
    min: { 
      args: [minimo], 
      msg: mensaje || `Debe ser al menos ${minimo}` 
    }
  }),

  // Validación para números decimales (precios)
  decimal: (minimo = 0, mensaje = null) => ({
    isDecimal: { msg: mensaje || 'Debe ser un número decimal válido' },
    min: { 
      args: [minimo], 
      msg: mensaje || 'No puede ser negativo' 
    }
  })
};

// ============================================
// CONFIGURACIÓN DE CLAVES FORÁNEAS (DRY)
// ============================================

/**
 * Configuración base para claves foráneas
 */
const CLAVE_FORANEA = (tablaReferencia, onDelete = 'CASCADE', campo = null) => ({
  type: DataTypes.INTEGER,
  allowNull: false,
  references: {
    model: tablaReferencia,
    key: 'id'
  },
  onUpdate: 'CASCADE',
  onDelete: onDelete,
  validate: VALIDACIONES.required(campo || tablaReferencia.slice(0, -1))
});

// ============================================
// DEFINICIÓN DEL MODELO
// ============================================

const DetallePedido = sequelize.define('DetallePedido', {
  // ==========================================
  // COLUMNAS DE LA TABLA 'detalle_pedidos'
  // ==========================================
  
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },

  pedidoId: {
    ...CLAVE_FORANEA('pedidos', 'CASCADE', 'pedido'),
    // Sobrescribimos el mensaje para que sea más específico
    validate: {
      notNull: { msg: 'Debe especificar un pedido' }
    }
  },

  productoId: {
    ...CLAVE_FORANEA('productos', 'RESTRICT', 'producto'),
    // Sobrescribimos el mensaje y añadimos validación adicional
    validate: {
      notNull: { msg: 'Debe especificar un producto' }
    }
  },

  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: VALIDACIONES.entero(1, 'La cantidad debe ser al menos 1')
  },

  precioUnitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: VALIDACIONES.decimal(0, 'El precio no puede ser negativo')
  },

  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: VALIDACIONES.decimal(0, 'El subtotal no puede ser negativo')
  }

}, {
  tableName: 'detalle_pedidos',
  timestamps: false,
  
  indexes: [
    { fields: ['pedidoId'] },
    { fields: ['productoId'] }
  ],
  
  hooks: {
    beforeCreate: (detalle) => {
      detalle.subtotal = calcularSubtotal(detalle.precioUnitario, detalle.cantidad);
    },

    beforeUpdate: (detalle) => {
      if (detalle.changed('precioUnitario') || detalle.changed('cantidad')) {
        detalle.subtotal = calcularSubtotal(detalle.precioUnitario, detalle.cantidad);
      }
    }
  }
});

// ============================================
// FUNCIONES REUTILIZABLES (DRY)
// ============================================

/**
 * Calcula el subtotal de una línea de detalle
 * @param {number|string} precioUnitario - Precio unitario del producto
 * @param {number} cantidad - Cantidad comprada
 * @returns {number} Subtotal calculado
 */
const calcularSubtotal = (precioUnitario, cantidad) => {
  return Number.parseFloat(precioUnitario) * cantidad;
};

/**
 * Suma los subtotales de un array de detalles
 * @param {Array} detalles - Array de instancias de DetallePedido
 * @returns {number} Total sumado
 */
const sumarSubtotales = (detalles) => {
  return detalles.reduce((total, detalle) => {
    return total + Number.parseFloat(detalle.subtotal);
  }, 0);
};

// ============================================
// MÉTODOS DE INSTANCIA (DRY)
// ============================================

/**
 * calcularSubtotal() → Calcula manualmente el subtotal de esta línea
 * @returns {number} precioUnitario × cantidad
 */
DetallePedido.prototype.calcularSubtotal = function() {
  return calcularSubtotal(this.precioUnitario, this.cantidad);
};

/**
 * obtenerProducto() → Busca y retorna el producto asociado a este detalle
 * @returns {Promise<Producto>} Instancia del modelo Producto
 */
DetallePedido.prototype.obtenerProducto = async function() {
  const Producto = require('./Producto');
  return await Producto.findByPk(this.productoId);
};

// ============================================
// MÉTODOS ESTÁTICOS (DRY)
// ============================================

/**
 * crearDesdeCarrito() → Convierte los items del carrito en detalles de pedido
 * @param {number} pedidoId - ID del pedido recién creado
 * @param {Array} itemsCarrito - Array de items del carrito
 * @returns {Promise<Array>} Array de detalles creados
 */
DetallePedido.crearDesdeCarrito = async function(pedidoId, itemsCarrito) {
  const detalles = await Promise.all(
    itemsCarrito.map(item => 
      this.create({
        pedidoId,
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario
      })
    )
  );
  
  return detalles;
};

/**
 * calcularTotalPedido() → Suma los subtotales de todos los detalles de un pedido
 * @param {number} pedidoId - ID del pedido
 * @returns {Promise<number>} Total calculado del pedido
 */
DetallePedido.calcularTotalPedido = async function(pedidoId) {
  const detalles = await this.findAll({
    where: { pedidoId }
  });
  
  return sumarSubtotales(detalles);
};

/**
 * obtenerMasVendidos() → Obtiene los productos más vendidos (ranking)
 * @param {number} limite - Cuántos productos retornar (default: 10)
 * @returns {Promise<Array>} Array de { productoId, totalVendido }
 */
DetallePedido.obtenerMasVendidos = async function(limite = 10) {
  const { sequelize } = require('../config/database');
  
  return await this.findAll({
    attributes: [
      'productoId',
      [sequelize.fn('SUM', sequelize.col('cantidad')), 'totalVendido']
    ],
    group: ['productoId'],
    order: [[sequelize.fn('SUM', sequelize.col('cantidad')), 'DESC']],
    limit: limite
  });
};

// ============================================
// MÉTODOS ESTÁTICOS ADICIONALES (para más funcionalidad)
// ============================================

/**
 * obtenerDetallesPorPedido() → Obtiene todos los detalles de un pedido con sus productos
 * @param {number} pedidoId - ID del pedido
 * @returns {Promise<Array>} Detalles con productos incluidos
 */
DetallePedido.obtenerDetallesPorPedido = async function(pedidoId) {
  const Producto = require('./Producto');
  
  return await this.findAll({
    where: { pedidoId },
    include: [{
      model: Producto,
      attributes: ['id', 'nombre', 'imagen']
    }]
  });
};

/**
 * obtenerTotalPorProducto() → Obtiene el total vendido de un producto específico
 * @param {number} productoId - ID del producto
 * @returns {Promise<number>} Total de unidades vendidas
 */
DetallePedido.obtenerTotalPorProducto = async function(productoId) {
  const resultado = await this.findOne({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('cantidad')), 'totalVendido']
    ],
    where: { productoId }
  });
  
  return resultado ? Number.parseInt(resultado.get('totalVendido'), 10) : 0;
};

module.exports = DetallePedido;