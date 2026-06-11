import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CartSummary = ({ items, total, onUpdate }) => {
  const navigate = useNavigate();

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  const handleVaciarCarrito = async () => {
    if (!window.confirm('¿Vaciar todo el carrito?')) return;
    try {
      await api.delete('/cliente/carrito');
      onUpdate();
    } catch (error) {
      alert('Error al vaciar el carrito');
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    navigate('/checkout');
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h5 className="mb-3">Resumen del pedido</h5>
        <div className="d-flex justify-content-between mb-2">
          <span>Subtotal ({items.length} productos):</span>
          <span>{formatearPrecio(total)}</span>
        </div>
        <hr />
        <div className="d-flex justify-content-between mb-3 fw-bold">
          <span>Total a pagar:</span>
          <span>{formatearPrecio(total)}</span>
        </div>
        <div className="d-grid gap-2">
          <Button variant="primary" size="lg" onClick={handleCheckout}>
            Proceder al pago
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate('/catalogo')}>
            Seguir comprando
          </Button>
          {items.length > 0 && (
            <Button variant="outline-danger" onClick={handleVaciarCarrito}>
              Vaciar carrito
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default CartSummary;