import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Alert,
  Spinner
} from 'react-bootstrap';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const PedidoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPedido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPedido = async () => {
    setLoading(true);
    setError(null);
    try {
      // El backend usa el mismo endpoint para cliente y admin, pero con verificación de propiedad
      const endpoint = isAdmin 
        ? `/admin/pedidos/${id}` 
        : `/cliente/pedidos/${id}`;
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        setPedido(response.data.data.pedido);
      } else {
        setError('No se pudo cargar el pedido');
      }
    } catch (err) {
      console.error('Error fetching pedido:', err);
      if (err.response?.status === 404) {
        setError('Pedido no encontrado');
      } else if (err.response?.status === 403) {
        setError('No tienes permiso para ver este pedido');
      } else {
        setError('Error al cargar el pedido');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarPago = async () => {
    if (!window.confirm('¿Confirmar que el cliente ha pagado?')) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/pedidos/${id}/confirmar-pago`);
      fetchPedido(); // recargar
    } catch (err) {
      alert(err.response?.data?.message || 'Error al confirmar pago');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/pedidos/${id}/estado`, { estado: nuevoEstado });
      fetchPedido();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!window.confirm('¿Cancelar este pedido?')) return;
    setActionLoading(true);
    try {
      await api.put(`/cliente/pedidos/${id}/cancelar`);
      fetchPedido();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cancelar');
    } finally {
      setActionLoading(false);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado) => {
    const mapping = {
      'pendiente': 'warning',
      'preparando': 'info',
      'listo': 'primary',
      'entregado': 'success',
      'cancelado': 'danger'
    };
    return mapping[estado] || 'secondary';
  };

  const getEstadoTexto = (estado) => {
    const mapping = {
      'pendiente': 'Pendiente',
      'preparando': 'Preparando',
      'listo': 'Listo para recoger',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return mapping[estado] || estado;
  };

  const getEstadoPagoBadge = (estadoPago) => {
    return estadoPago === 'confirmado' ? 'success' : 'warning';
  };

  const getEstadoPagoTexto = (estadoPago) => {
    return estadoPago === 'confirmado' ? 'Confirmado' : 'Pendiente';
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando pedido...</p>
      </Container>
    );
  }

  if (error || !pedido) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || 'No se encontró el pedido'}
        </Alert>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </Container>
    );
  }

  const productos = pedido.detalles || [];
  const puedeCancelarCliente = !isAdmin && ['pendiente', 'preparando'].includes(pedido.estado);
  const mostrarBotonConfirmarPago = isAdmin && pedido.estadoPago === 'pendiente';
  const mostrarAccionesAdmin = isAdmin && pedido.estado !== 'cancelado' && pedido.estado !== 'entregado';

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="bi bi-receipt me-2"></i>
          Pedido #{pedido.id}
        </h1>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2"></i>
          Volver
        </Button>
      </div>

      <Row>
        <Col lg={8}>
          {/* Productos */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Productos</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Cantidad</th>
                    <th className="text-end">Precio Unit.</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          {item.producto?.imagen && (
                            <img
                              src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.producto.imagen}`}
                              alt={item.producto.nombre}
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              className="me-3 rounded"
                            />
                          )}
                          <div>
                            <strong>{item.producto?.nombre || 'Producto eliminado'}</strong>
                            {item.producto?.descripcion && (
                              <div className="small text-muted">{item.producto.descripcion}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center align-middle">{item.cantidad}</td>
                      <td className="text-end align-middle">{formatearPrecio(item.precioUnitario)}</td>
                      <td className="text-end align-middle fw-bold">
                        {formatearPrecio(item.precioUnitario * item.cantidad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-light">
                  <tr>
                    <td colSpan="3" className="text-end fw-bold">Total:</td>
                    <td className="text-end fw-bold">{formatearPrecio(pedido.total)}</td>
                  </tr>
                </tfoot>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Información del pedido */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Información del Pedido</h5>
            </Card.Header>
            <Card.Body>
              <dl className="row mb-0">
                <dt className="col-sm-5">Fecha:</dt>
                <dd className="col-sm-7">{formatearFecha(pedido.createdAt)}</dd>

                <dt className="col-sm-5">Estado:</dt>
                <dd className="col-sm-7">
                  <Badge bg={getEstadoBadge(pedido.estado)}>
                    {getEstadoTexto(pedido.estado)}
                  </Badge>
                </dd>

                <dt className="col-sm-5">Estado de Pago:</dt>
                <dd className="col-sm-7">
                  <Badge bg={getEstadoPagoBadge(pedido.estadoPago)}>
                    {getEstadoPagoTexto(pedido.estadoPago)}
                  </Badge>
                </dd>

                <dt className="col-sm-5">Método de Pago:</dt>
                <dd className="col-sm-7 text-capitalize">{pedido.metodoPago || '—'}</dd>

                <dt className="col-sm-5">Modalidad:</dt>
                <dd className="col-sm-7 text-capitalize">{pedido.modalidadEntrega || 'recoger'}</dd>

                <dt className="col-sm-5">Teléfono:</dt>
                <dd className="col-sm-7">{pedido.telefono || '—'}</dd>

                {pedido.direccionEnvio && (
                  <>
                    <dt className="col-sm-5">Dirección:</dt>
                    <dd className="col-sm-7">{pedido.direccionEnvio}</dd>
                  </>
                )}

                {pedido.notas && (
                  <>
                    <dt className="col-sm-5">Notas:</dt>
                    <dd className="col-sm-7">{pedido.notas}</dd>
                  </>
                )}

                {pedido.fechaPago && (
                  <>
                    <dt className="col-sm-5">Fecha de Pago:</dt>
                    <dd className="col-sm-7">{formatearFecha(pedido.fechaPago)}</dd>
                  </>
                )}

                {pedido.fechaEntrega && (
                  <>
                    <dt className="col-sm-5">Fecha de Entrega:</dt>
                    <dd className="col-sm-7">{formatearFecha(pedido.fechaEntrega)}</dd>
                  </>
                )}
              </dl>
            </Card.Body>
          </Card>

          {/* Datos del Cliente (visible solo para admin) */}
          {isAdmin && pedido.usuario && (
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Cliente</h5>
              </Card.Header>
              <Card.Body>
                <dl className="row mb-0">
                  <dt className="col-sm-4">Nombre:</dt>
                  <dd className="col-sm-8">{pedido.usuario.nombre} {pedido.usuario.apellido}</dd>
                  <dt className="col-sm-4">Email:</dt>
                  <dd className="col-sm-8">{pedido.usuario.email}</dd>
                  {pedido.usuario.cedula && (
                    <>
                      <dt className="col-sm-4">Cédula:</dt>
                      <dd className="col-sm-8">{pedido.usuario.cedula}</dd>
                    </>
                  )}
                </dl>
              </Card.Body>
            </Card>
          )}

          {/* Acciones */}
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Acciones</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                {/* Botón Confirmar Pago (Admin) */}
                {mostrarBotonConfirmarPago && (
                  <Button
                    variant="success"
                    onClick={handleConfirmarPago}
                    disabled={actionLoading}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Confirmar Pago
                  </Button>
                )}

                {/* Cambiar estado (Admin) */}
                {mostrarAccionesAdmin && (
                  <>
                    {pedido.estado === 'pendiente' && pedido.estadoPago === 'confirmado' && (
                      <Button
                        variant="info"
                        onClick={() => handleCambiarEstado('preparando')}
                        disabled={actionLoading}
                      >
                        Marcar como Preparando
                      </Button>
                    )}
                    {pedido.estado === 'preparando' && (
                      <Button
                        variant="primary"
                        onClick={() => handleCambiarEstado('listo')}
                        disabled={actionLoading}
                      >
                        Marcar como Listo
                      </Button>
                    )}
                    {pedido.estado === 'listo' && (
                      <Button
                        variant="success"
                        onClick={() => handleCambiarEstado('entregado')}
                        disabled={actionLoading}
                      >
                        Marcar como Entregado
                      </Button>
                    )}
                    {(pedido.estado === 'pendiente' || pedido.estado === 'preparando') && (
                      <Button
                        variant="danger"
                        onClick={() => handleCambiarEstado('cancelado')}
                        disabled={actionLoading}
                      >
                        Cancelar Pedido
                      </Button>
                    )}
                  </>
                )}

                {/* Cancelar (Cliente) */}
                {puedeCancelarCliente && (
                  <Button
                    variant="danger"
                    onClick={handleCancelar}
                    disabled={actionLoading}
                  >
                    Cancelar Pedido
                  </Button>
                )}

                {/* Enlace WhatsApp si el pago es por WhatsApp y está pendiente */}
                {pedido.metodoPago === 'whatsapp' && pedido.estadoPago === 'pendiente' && !isAdmin && (
                  <Button
                    variant="success"
                    href={`https://wa.me/${process.env.REACT_APP_WHATSAPP_NUMBER || '573203097032'}?text=Hola%20MerkaCiro,%20mi%20pedido%20%23${pedido.id}%20está%20pendiente%20de%20pago.%20Total:%20${formatearPrecio(pedido.total)}`}
                    target="_blank"
                  >
                    <i className="bi bi-whatsapp me-2"></i>
                    Coordinar Pago por WhatsApp
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PedidoDetail;