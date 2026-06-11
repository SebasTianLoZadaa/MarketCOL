import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CheckoutForm = ({ cartItems, total, onPedidoCreado }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    telefono: user?.telefono || '',
    metodoPago: 'whatsapp',
    notasAdicionales: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.telefono || formData.telefono.trim() === '') {
      setError('El teléfono de contacto es obligatorio');
      return;
    }

    if (cartItems.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        metodoPago: formData.metodoPago,
        notasAdicionales: formData.notasAdicionales
      };
      
      // Solo enviar teléfono si es diferente al del perfil o si no hay perfil
      if (formData.telefono !== user?.telefono) {
        payload.telefono = formData.telefono;
      }

      const response = await api.post('/cliente/pedidos', payload);

      if (response.data.success) {
        const pedido = response.data.data.pedido;
        const linkPago = response.data.data.linkPago;
        
        // Si eligió WhatsApp, abrir enlace en nueva pestaña
        if (formData.metodoPago === 'whatsapp' && linkPago) {
          window.open(linkPago, '_blank');
        }
        
        // Notificar al componente padre
        if (onPedidoCreado) {
          onPedidoCreado(pedido);
        }
        
        // Redirigir a página de confirmación
        navigate(`/pedido/${pedido.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el pedido');
    } finally {
      setLoading(false);
    }
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white">
        <h5 className="mb-0">Finalizar Compra</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Teléfono de contacto *</Form.Label>
            <Form.Control
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Ej: 3001234567"
              required
            />
            <Form.Text className="text-muted">
              Te contactaremos para coordinar la entrega o pago.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Método de pago *</Form.Label>
            <Form.Select
              name="metodoPago"
              value={formData.metodoPago}
              onChange={handleChange}
              required
            >
              <option value="whatsapp">WhatsApp (coordinar transferencia)</option>
              <option value="efectivo">Efectivo al recoger</option>
            </Form.Select>
            {formData.metodoPago === 'whatsapp' && (
              <Form.Text className="text-muted">
                Al confirmar, serás redirigido a WhatsApp para coordinar el pago con la tienda.
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Notas adicionales (opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="notasAdicionales"
              value={formData.notasAdicionales}
              onChange={handleChange}
              placeholder="Ej: Prefiero recoger en la tarde"
            />
          </Form.Group>

          <div className="border-top pt-3 mt-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold">Total a pagar:</span>
              <span className="fs-4 fw-bold text-primary">{formatearPrecio(total)}</span>
            </div>

            <Button
              variant="primary"
              type="submit"
              size="lg"
              className="w-100"
              disabled={loading || cartItems.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Procesando...
                </>
              ) : (
                'Confirmar Pedido'
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CheckoutForm;
