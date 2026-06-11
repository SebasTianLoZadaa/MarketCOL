import React from 'react';
import { Button, Form } from 'react-bootstrap';
import api from '../../services/api';

const CartItem = ({ item, onUpdate }) => {
  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  const handleCantidadChange = async (nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    try {
      await api.put(`/cliente/carrito/${item.id}`, { cantidad: nuevaCantidad });
      onUpdate();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al actualizar cantidad');
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm('¿Eliminar este producto del carrito?')) return;
    try {
      await api.delete(`/cliente/carrito/${item.id}`);
      onUpdate();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <tr>
      <td>
        <div className="d-flex align-items-center">
          {item.producto?.imagen && (
            <img
              src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.producto.imagen}`}
              alt={item.producto.nombre}
              style={{ width: '60px', height: '60px', objectFit: 'cover' }}
              className="me-3 rounded"
            />
          )}
          <div>
            <strong>{item.producto?.nombre || 'Producto eliminado'}</strong>
            <div className="text-muted small">{item.producto?.categoria?.nombre}</div>
          </div>
        </div>
      </td>
      <td className="text-end align-middle">
        {formatearPrecio(item.precioUnitario)}
      </td>
      <td className="align-middle" style={{ width: '150px' }}>
        <div className="d-flex align-items-center justify-content-center">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => handleCantidadChange(item.cantidad - 1)}
            disabled={item.cantidad <= 1}
          >
            -
          </Button>
          <Form.Control
            type="number"
            min="1"
            max={item.producto?.stock}
            value={item.cantidad}
            onChange={(e) => handleCantidadChange(parseInt(e.target.value))}
            className="mx-2 text-center"
            style={{ width: '60px' }}
          />
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => handleCantidadChange(item.cantidad + 1)}
            disabled={item.cantidad >= item.producto?.stock}
          >
            +
          </Button>
        </div>
      </td>
      <td className="text-end align-middle fw-bold">
        {formatearPrecio(item.precioUnitario * item.cantidad)}
      </td>
      <td className="text-center align-middle">
        <Button variant="outline-danger" size="sm" onClick={handleEliminar}>
          <i className="bi bi-trash"></i>
        </Button>
      </td>
    </tr>
  );
};

export default CartItem;