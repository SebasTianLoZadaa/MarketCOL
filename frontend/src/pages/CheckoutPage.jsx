/**
 * ============================================
 * CHECKOUT PAGE - MarketCOL
 * ============================================
 * Página para finalizar la compra (modalidad aliste y recoja)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  ListGroup
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import carritoService from '../services/carritoService';
import pedidoService from '../services/pedidoService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CheckoutPage = () => {
  const [carrito, setCarrito] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState({
    tipo: '',
    texto: ''
  });

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    telefono: '',
    metodoPago: 'whatsapp',
    notasAdicionales: ''
  });

  /**
   * Cargar carrito
   */
  const loadCarrito = useCallback(async () => {
    setLoading(true);

    try {
      const response = await carritoService.getCarrito();

      const carritoData =
        response?.data ||
        response?.carrito ||
        null;

      if (
        !carritoData ||
        !Array.isArray(carritoData.items) ||
        carritoData.items.length === 0
      ) {
        setMensaje({
          tipo: 'warning',
          texto: 'Tu carrito está vacío'
        });

        setTimeout(() => {
          navigate('/carrito');
        }, 2000);

        return;
      }

      setCarrito(carritoData);
    } catch (error) {
      console.error('Error al cargar carrito:', error);

      setMensaje({
        tipo: 'danger',
        texto: 'Error al cargar el carrito'
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * Verificar autenticación y cargar información inicial
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setMensaje({
        tipo: 'warning',
        texto: 'Debes iniciar sesión para finalizar tu pedido'
      });

      const timer = setTimeout(() => {
        navigate('/login');
      }, 2000);

      return () => clearTimeout(timer);
    }

    if (user?.telefono) {
      setFormData((prev) => ({
        ...prev,
        telefono: user.telefono
      }));
    }

    loadCarrito();
  }, [isAuthenticated, navigate, user, loadCarrito]);

  /**
   * Manejar cambios en el formulario
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Crear pedido
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const telefonoFinal =
      formData.telefono?.trim() ||
      user?.telefono ||
      '';

    if (!telefonoFinal) {
      setMensaje({
        tipo: 'danger',
        texto: 'El teléfono de contacto es requerido'
      });

      return;
    }

    setProcesando(true);

    setMensaje({
      tipo: '',
      texto: ''
    });

    try {
      const payload = {
        metodoPago: formData.metodoPago,
        notasAdicionales: formData.notasAdicionales
      };

      /**
       * Solo enviar teléfono si es diferente
       * al registrado en el perfil.
       */
      if (telefonoFinal !== user?.telefono) {
        payload.telefono = telefonoFinal;
      }

      const response = await pedidoService.crearPedido(payload);

      if (response?.success) {
        const pedido = response.data?.pedido;
        const pedidoId = pedido?.id;

        if (!pedidoId) {
          setMensaje({
            tipo: 'danger',
            texto: 'Error: No se pudo obtener el ID del pedido'
          });

          return;
        }

        /**
         * Si el método de pago es WhatsApp
         * y existe un enlace, abrirlo.
         */
        if (
          formData.metodoPago === 'whatsapp' &&
          response.data?.linkPago
        ) {
          window.open(
            response.data.linkPago,
            '_blank',
            'noopener,noreferrer'
          );
        }

        /**
         * Redirigir al detalle del pedido.
         */
        navigate(`/pedido/${pedidoId}`);
      } else {
        setMensaje({
          tipo: 'danger',
          texto:
            response?.message ||
            'Error al procesar el pedido'
        });
      }
    } catch (error) {
      console.error('Error al crear pedido:', error);

      setMensaje({
        tipo: 'danger',
        texto:
          error.response?.data?.message ||
          error.message ||
          'Error al procesar el pedido'
      });
    } finally {
      setProcesando(false);
    }
  };

  /**
   * Formatear precio en pesos colombianos
   */
  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(Number(precio) || 0);
  };

  if (loading) {
    return (
      <LoadingSpinner message="Cargando información..." />
    );
  }

  const items = carrito?.items || [];

  const total = Number.parseFloat(
    carrito?.resumen?.total || 0
  );

  return (
    <Container className="py-4">
      <h1 className="mb-4">
        <i className="bi bi-bag-check me-2"></i>
        <span>Finalizar Pedido</span>
      </h1>

      {mensaje.texto && (
        <Alert
          variant={mensaje.tipo}
          dismissible
          onClose={() =>
            setMensaje({
              tipo: '',
              texto: ''
            })
          }
        >
          {mensaje.texto}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                Información de Contacto
              </h5>
            </Card.Header>

            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Nombre Completo
                  </Form.Label>

                  <Form.Control
                    type="text"
                    value={
                      `${user?.nombre || ''} ${
                        user?.apellido || ''
                      }`.trim() || '—'
                    }
                    disabled
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Correo Electrónico
                  </Form.Label>

                  <Form.Control
                    type="email"
                    value={user?.email || '—'}
                    disabled
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Teléfono de Contacto{' '}
                    <span className="text-danger">*</span>
                  </Form.Label>

                  <Form.Control
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej: 3001234567"
                    required
                  />

                  <Form.Text className="text-muted">
                    Te contactaremos para coordinar la
                    entrega del pedido.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Método de Pago{' '}
                    <span className="text-danger">*</span>
                  </Form.Label>

                  <Form.Select
                    name="metodoPago"
                    value={formData.metodoPago}
                    onChange={handleChange}
                    required
                  >
                    <option value="whatsapp">
                      WhatsApp (coordinar transferencia)
                    </option>

                    <option value="efectivo">
                      Efectivo al recoger en tienda
                    </option>
                  </Form.Select>

                  {formData.metodoPago === 'whatsapp' && (
                    <Form.Text className="text-muted">
                      Al confirmar, serás redirigido a
                      WhatsApp para coordinar el pago con
                      la tienda.
                    </Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    Notas Adicionales (Opcional)
                  </Form.Label>

                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="notasAdicionales"
                    value={formData.notasAdicionales}
                    onChange={handleChange}
                    placeholder="Ej: Prefiero recoger en la tarde"
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    disabled={procesando}
                  >
                    {procesando ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        ></span>

                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <i
                          className="bi bi-check-circle me-2"
                          aria-hidden="true"
                        ></i>

                        <span>Confirmar Pedido</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => navigate('/carrito')}
                    disabled={procesando}
                  >
                    <i
                      className="bi bi-arrow-left me-2"
                      aria-hidden="true"
                    ></i>

                    <span>Volver al Carrito</span>
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card
            className="sticky-top"
            style={{ top: '20px' }}
          >
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                Resumen del Pedido
              </h5>
            </Card.Header>

            <Card.Body>
              <ListGroup
                variant="flush"
                className="mb-3"
              >
                {items.map((item) => {
                  const precioUnitario =
                    item.precioUnitario ??
                    item.precio ??
                    0;

                  const cantidad =
                    Number(item.cantidad) || 0;

                  const subtotal =
                    Number(precioUnitario) * cantidad;

                  return (
                    <ListGroup.Item
                      key={item.id}
                      className="px-0"
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="flex-grow-1">
                          <div className="fw-bold">
                            {item.producto?.nombre ||
                              item.nombre ||
                              'Producto'}
                          </div>

                          <small className="text-muted">
                            Cantidad: {cantidad} x{' '}
                            {formatearPrecio(
                              precioUnitario
                            )}
                          </small>
                        </div>

                        <div className="fw-bold">
                          {formatearPrecio(subtotal)}
                        </div>
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>

              <hr />

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>

                <span>
                  {formatearPrecio(total)}
                </span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Modalidad:</span>

                <span className="text-success">
                  <i
                    className="bi bi-shop me-1"
                    aria-hidden="true"
                  ></i>

                  <span>Aliste y recoja</span>
                </span>
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-0">
                <strong className="fs-5">
                  Total a pagar:
                </strong>

                <strong className="text-primary fs-4">
                  {formatearPrecio(total)}
                </strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;