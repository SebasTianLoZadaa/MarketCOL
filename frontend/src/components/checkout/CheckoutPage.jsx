import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CartItem from '../carrito/CartItem';
import CartSummary from '../carrito/CartSummary';
import CheckoutForm from './checkout/CheckoutForm';
import { useAuth } from '../../context/AuthContext';

const CheckoutPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [isAuthenticated, navigate]);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cliente/carrito');
      setCartItems(res.data.data.items || []);
    } catch (err) {
      console.error('Error al cargar carrito:', err);
    } finally {
      setLoading(false);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="info">
          Tu carrito está vacío. <a href="/catalogo">Ir al catálogo</a>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">Checkout</h1>
      <Row>
        <Col lg={8}>
          <div className="bg-white rounded shadow-sm p-3 mb-4">
            <h5 className="mb-3">Productos en tu carrito</h5>
            {cartItems.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdate={fetchCart}
                onRemove={fetchCart}
              />
            ))}
          </div>
        </Col>
        <Col lg={4}>
          <CartSummary items={cartItems} loading={loading} />
          <div className="mt-4">
            <CheckoutForm
              cartItems={cartItems}
              total={total}
              onPedidoCreado={() => fetchCart()}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;