/**
 * ============================================
 * PEDIDO CONFIRMADO PAGE - MarketCOL
 * ============================================
 * Página de confirmación/detalle después de realizar un pedido
 */

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Alert, ListGroup, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import pedidoService from '../services/pedidoService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PedidoConfirmadoPage = () => {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadPedido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  const loadPedido = async () => {
    setLoading(true);
    try {
      const response = await pedidoService.getPedidoById(id);
      if (response.success && response.data) {
        setPedido(response.data.pedido || response.data);
      } else {
        setMensaje({ tipo: 'danger', texto: response.message || 'Error al cargar el pedido' });
      }
    } catch (error) {
      console.error('Error al cargar pedido:', error);
      setMensaje({ tipo: 'danger', texto: error.message || 'Error al cargar el pedido' });
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

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': 'warning',
      'preparando': 'info',
      'listo': 'primary',
      'entregado': 'success',
      'cancelado': 'danger'
    };
    return badges[estado] || 'secondary';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      'pendiente': 'Pendiente',
      'preparando': 'Preparando',
      'listo': 'Listo para recoger',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return textos[estado] || estado;
  };

  const getEstadoPagoBadge = (estadoPago) => {
    return estadoPago === 'confirmado' ? 'success' : 'warning';
  };

  const getEstadoPagoTexto = (estadoPago) => {
    return estadoPago === 'confirmado' ? 'Confirmado' : 'Pendiente';
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const numeroTienda = process.env.REACT_APP_WHATSAPP_NUMBER || '573001234567';
    const mensaje = `Hola MerkaCiro, mi pedido #${pedido.id} está pendiente de pago. Total: ${formatearPrecio(pedido.total)}`;
    const link = `https://wa.me/${numeroTienda}?text=${encodeURIComponent(mensaje)}`;
    window.open(link, '_blank');
  };

  if (loading) {
    return <LoadingSpinner message="Cargando información del pedido..." />;
  }

  if (!pedido) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          No se pudo cargar la información del pedido
        </Alert>
        <Button onClick={() => navigate('/mis-pedidos')}>Ver Mis Pedidos</Button>
      </Container>
    );
  }

  const mostrarWhatsApp = pedido.metodoPago === 'whatsapp' && pedido.estadoPago === 'pendiente';

  return (
    <Container className="py-4">
      {/* Encabezado de confirmación */}
      <Card className="mb-4 border-success">
        <Card.Body className="text-center py-5">
          <div className="mb-3">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
          </div>
          <h1 className="text-success mb-3">¡Pedido Recibido!</h1>
          <p className="lead mb-4">
            Tu pedido ha sido registrado exitosamente.
            {pedido.estado === 'pendiente' && ' Está pendiente de confirmación de pago.'}
          </p>
          <div className="d-flex justify-content-center gap-4 flex-wrap">
            <div className="text-start">
              <small className="text-muted d-block">Número de Pedido</small>
              <strong className="fs-4">#{pedido.id}</strong>
            </div>
            <div className="text-start">
              <small className="text-muted d-block">Fecha</small>
              <strong>{formatearFecha(pedido.createdAt)}</strong>
            </div>
            <div className="text-start">
              <small className="text-muted d-block">Estado</small>
              <Badge bg={getEstadoBadge(pedido.estado)} className="fs-6">
                {getEstadoTexto(pedido.estado)}
              </Badge>
            </div>
            <div className="text-start">
              <small className="text-muted d-block">Pago</small>
              <Badge bg={getEstadoPagoBadge(pedido.estadoPago)} className="fs-6">
                {getEstadoPagoTexto(pedido.estadoPago)}
              </Badge>
            </div>
          </div>
        </Card.Body>
      </Card>

      {mensaje.texto && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
          {mensaje.texto}
        </Alert>
      )}

      <Row>
        {/* Información del pedido */}
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-box-seam me-2"></i>
                Productos del Pedido
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Precio</th>
                    <th className="text-center">Cantidad</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.detalles && pedido.detalles.map((detalle) => (
                    <tr key={detalle.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={detalle.producto?.imagen || '/images/producto-default.svg'}
                            alt={detalle.producto?.nombre}
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            className="rounded me-3"
                            onError={(e) => {
                              e.target.src = '/images/producto-default.svg';
                            }}
                          />
                          <div>
                            <div className="fw-bold">{detalle.producto?.nombre}</div>
                            {detalle.producto?.categoria && (
                              <small className="text-muted">
                                {detalle.producto.categoria.nombre}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center align-middle">
                        {formatearPrecio(detalle.precioUnitario)}
                      </td>
                      <td className="text-center align-middle">
                        {detalle.cantidad}
                      </td>
                      <td className="text-end align-middle fw-bold">
                        {formatearPrecio(detalle.subtotal || detalle.precioUnitario * detalle.cantidad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Información de Contacto
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="text-muted mb-2">Teléfono de Contacto</h6>
                  <p className="mb-0">{pedido.telefono}</p>
                </Col>
                <Col md={6}>
                  <h6 className="text-muted mb-2">Modalidad</h6>
                  <p className="mb-0">
                    <i className="bi bi-shop me-1 text-success"></i>
                    Aliste y recoja
                  </p>
                </Col>
              </Row>
              {pedido.notas && (
                <Row className="mt-3">
                  <Col>
                    <h6 className="text-muted mb-2">Notas adicionales</h6>
                    <p className="mb-0 fst-italic">"{pedido.notas}"</p>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Resumen del pedido */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Resumen del Pedido</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush" className="mb-3">
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span>{formatearPrecio(pedido.total)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Modalidad:</span>
                  <span className="text-success">
                    <i className="bi bi-shop me-1"></i>
                    Aliste y recoja
                  </span>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Método de pago:</span>
                  <span className="text-capitalize">{pedido.metodoPago}</span>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <strong className="fs-5">Total a pagar:</strong>
                  <strong className="text-primary fs-4">{formatearPrecio(pedido.total)}</strong>
                </ListGroup.Item>
              </ListGroup>

              {mostrarWhatsApp && (
                <Alert variant="success" className="mb-3">
                  <i className="bi bi-whatsapp me-2"></i>
                  <strong>Pago pendiente</strong>
                  <p className="mb-2 mt-1">
                    Coordina tu pago por WhatsApp para que preparemos tu pedido.
                  </p>
                  <Button
                    variant="success"
                    className="w-100"
                    onClick={handleWhatsApp}
                  >
                    <i className="bi bi-whatsapp me-2"></i>
                    Contactar por WhatsApp
                  </Button>
                </Alert>
              )}

              {pedido.estadoPago === 'pendiente' && pedido.metodoPago !== 'whatsapp' && (
                <Alert variant="warning">
                  <i className="bi bi-hourglass-split me-2"></i>
                  Tu pedido está pendiente de pago. Por favor, realiza el pago en tienda al recoger.
                </Alert>
              )}

              {pedido.estado === 'listo' && (
                <Alert variant="info">
                  <i className="bi bi-check-circle me-2"></i>
                  ¡Tu pedido está listo! Puedes pasar a recogerlo en la tienda.
                </Alert>
              )}

              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  onClick={() => navigate('/mis-pedidos')}
                >
                  <i className="bi bi-list-ul me-2"></i>
                  Ver Mis Pedidos
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={handleImprimir}
                >
                  <i className="bi bi-printer me-2"></i>
                  Imprimir Comprobante
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate('/catalogo')}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Seguir Comprando
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PedidoConfirmadoPage;