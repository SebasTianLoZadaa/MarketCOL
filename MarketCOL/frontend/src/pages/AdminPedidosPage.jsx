/**
 * ============================================
 * ADMIN PEDIDOS PAGE - MarketCOL
 * ============================================
 * Gestión de pedidos con estados: pendiente, preparando, listo, entregado, cancelado
 * Incluye confirmación de pago (estadoPago)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, Pagination, Alert, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { exportarPedidosAPDF, exportarPedidosAExcel } from '../utils/exportUtils';

const AdminPedidosPage = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal de detalle
  const [showModal, setShowModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    estado: '',
    estadoPago: '',
    buscar: '',
    fechaInicio: '',
    fechaFin: '',
    pagina: 1,
    limite: 20
  });
  
  const [paginacion, setPaginacion] = useState({ total: 0, totalPaginas: 0 });
  const [tipoExportacion, setTipoExportacion] = useState('pdf');

  const cargarPedidos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filtros };
      if (!params.estado) delete params.estado;
      if (!params.estadoPago) delete params.estadoPago;
      if (!params.buscar) delete params.buscar;
      if (!params.fechaInicio) delete params.fechaInicio;
      if (!params.fechaFin) delete params.fechaFin;
      
      const response = await api.get('/admin/pedidos', { params });
      
      if (response.data.success) {
        setPedidos(response.data.data.pedidos || []);
        setPaginacion(response.data.data.paginacion || { total: 0, totalPaginas: 0 });
      } else {
        setError('Error al cargar pedidos');
      }
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value, pagina: 1 }));
  };

  const handlePageChange = (page) => {
    setFiltros(prev => ({ ...prev, pagina: page }));
  };

  const handleConfirmarPago = async (id) => {
    if (!window.confirm('¿Confirmar que el cliente ha pagado? El pedido pasará a estado "preparando".')) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/pedidos/${id}/confirmar-pago`);
      cargarPedidos();
      if (showModal && pedidoSeleccionado?.id === id) {
        const res = await api.get(`/admin/pedidos/${id}`);
        setPedidoSeleccionado(res.data.data.pedido);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al confirmar pago');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/pedidos/${id}/estado`, { estado: nuevoEstado });
      cargarPedidos();
      if (showModal && pedidoSeleccionado?.id === id) {
        const res = await api.get(`/admin/pedidos/${id}`);
        setPedidoSeleccionado(res.data.data.pedido);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerDetalle = async (pedido) => {
    try {
      const res = await api.get(`/admin/pedidos/${pedido.id}`);
      setPedidoSeleccionado(res.data.data.pedido);
      setShowModal(true);
    } catch (err) {
      alert('Error al cargar detalle del pedido');
    }
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-CO', {
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
      'listo': 'Pedido listo',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return mapping[estado] || estado;
  };

  const getEstadoPagoBadge = (estadoPago) => {
    return estadoPago === 'confirmado' ? 'success' : 'warning';
  };

  const getEstadoPagoTexto = (estadoPago) => {
    return estadoPago === 'confirmado' ? 'Pagado' : 'Pendiente';
  };

  if (loading && pedidos.length === 0) {
    return <LoadingSpinner message="Cargando pedidos..." />;
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="bi bi-receipt me-2"></i>
          Gestión de Pedidos
        </h1>
        <div>
          <Button variant="outline-secondary" onClick={() => navigate('/admin')} className="me-2">
            <i className="bi bi-arrow-left me-1"></i>
            Volver
          </Button>
          <div className="btn-group">
            <Button 
              variant="success" 
              onClick={() => tipoExportacion === 'pdf' 
                ? exportarPedidosAPDF(pedidos) 
                : exportarPedidosAExcel(pedidos)
              }
            >
              <i className={`bi bi-file-earmark-${tipoExportacion === 'pdf' ? 'pdf' : 'excel'} me-1`}></i>
              Exportar
            </Button>
            <Button variant="success" className="dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" />
            <ul className="dropdown-menu">
              <li>
                <button className="dropdown-item" onClick={() => { setTipoExportacion('pdf'); exportarPedidosAPDF(pedidos); }}>
                  <i className="bi bi-file-earmark-pdf me-2"></i>PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => { setTipoExportacion('excel'); exportarPedidosAExcel(pedidos); }}>
                  <i className="bi bi-file-earmark-excel me-2"></i>Excel
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filtros */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Estado del pedido</Form.Label>
                <Form.Select name="estado" value={filtros.estado} onChange={handleFiltroChange}>
                  <option value="">Todos</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="preparando">Preparando</option>
                  <option value="listo">Pedido listo</option>
                  <option value="entregado">Entregados</option>
                  <option value="cancelado">Cancelados</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Estado de pago</Form.Label>
                <Form.Select name="estadoPago" value={filtros.estadoPago} onChange={handleFiltroChange}>
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Buscar cliente</Form.Label>
                <Form.Control
                  type="text"
                  name="buscar"
                  placeholder="Nombre o email"
                  value={filtros.buscar}
                  onChange={handleFiltroChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Desde</Form.Label>
                <Form.Control
                  type="date"
                  name="fechaInicio"
                  value={filtros.fechaInicio}
                  onChange={handleFiltroChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Hasta</Form.Label>
                <Form.Control
                  type="date"
                  name="fechaFin"
                  value={filtros.fechaFin}
                  onChange={handleFiltroChange}
                />
              </Form.Group>
            </Col>
            <Col md={9} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={() => setFiltros({ estado: '', estadoPago: '', buscar: '', fechaInicio: '', fechaFin: '', pagina: 1, limite: 20 })}
              >
                <i className="bi bi-x-circle me-1"></i>
                Limpiar filtros
              </Button>
            </Col>
          </Row>
          <div className="text-muted mt-2">
            Mostrando {pedidos.length} de {paginacion.total} pedidos
          </div>
        </Card.Body>
      </Card>

      {/* Tabla de pedidos */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No hay pedidos que mostrar
                  </td>
                </tr>
              ) : (
                pedidos.map(pedido => (
                  <tr key={pedido.id}>
                    <td>#{pedido.id}</td>
                    <td>
                      {pedido.usuario?.nombre} {pedido.usuario?.apellido}<br />
                      <small className="text-muted">{pedido.usuario?.email}</small>
                    </td>
                    <td>{formatearFecha(pedido.createdAt)}</td>
                    <td><strong>{formatearPrecio(pedido.total)}</strong></td>
                    <td>
                      <Badge bg={getEstadoBadge(pedido.estado)}>
                        {getEstadoTexto(pedido.estado)}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getEstadoPagoBadge(pedido.estadoPago)}>
                        {getEstadoPagoTexto(pedido.estadoPago)}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleVerDetalle(pedido)}
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                      {pedido.estadoPago === 'pendiente' && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-1"
                          onClick={() => handleConfirmarPago(pedido.id)}
                          disabled={actionLoading}
                          title="Confirmar pago"
                        >
                          <i className="bi bi-cash"></i>
                        </Button>
                      )}
                      {pedido.estado === 'listo' && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleCambiarEstado(pedido.id, 'entregado')}
                          disabled={actionLoading}
                          title="Marcar como entregado"
                        >
                          <i className="bi bi-check-circle"></i>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
        
        {/* Paginación */}
        {paginacion.totalPaginas > 1 && (
          <Card.Footer>
            <Pagination className="justify-content-center mb-0">
              <Pagination.First disabled={filtros.pagina === 1} onClick={() => handlePageChange(1)} />
              <Pagination.Prev disabled={filtros.pagina === 1} onClick={() => handlePageChange(filtros.pagina - 1)} />
              {[...Array(paginacion.totalPaginas).keys()].map(page => (
                <Pagination.Item
                  key={page + 1}
                  active={page + 1 === filtros.pagina}
                  onClick={() => handlePageChange(page + 1)}
                >
                  {page + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next disabled={filtros.pagina === paginacion.totalPaginas} onClick={() => handlePageChange(filtros.pagina + 1)} />
              <Pagination.Last disabled={filtros.pagina === paginacion.totalPaginas} onClick={() => handlePageChange(paginacion.totalPaginas)} />
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      {/* Modal de detalle */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Pedido #{pedidoSeleccionado?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pedidoSeleccionado && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Cliente</h6>
                  <p className="mb-1"><strong>{pedidoSeleccionado.usuario?.nombre} {pedidoSeleccionado.usuario?.apellido}</strong></p>
                  <p className="mb-1">{pedidoSeleccionado.usuario?.email}</p>
                  <p className="mb-1">Tel: {pedidoSeleccionado.telefono}</p>
                  {pedidoSeleccionado.usuario?.cedula && <p>Cédula: {pedidoSeleccionado.usuario.cedula}</p>}
                </Col>
                <Col md={6}>
                  <h6>Detalles del pedido</h6>
                  <p className="mb-1">Fecha: {formatearFecha(pedidoSeleccionado.createdAt)}</p>
                  <p className="mb-1">
                    Estado: <Badge bg={getEstadoBadge(pedidoSeleccionado.estado)}>{getEstadoTexto(pedidoSeleccionado.estado)}</Badge>
                  </p>
                  <p className="mb-1">
                    Pago: <Badge bg={getEstadoPagoBadge(pedidoSeleccionado.estadoPago)}>{getEstadoPagoTexto(pedidoSeleccionado.estadoPago)}</Badge> ({pedidoSeleccionado.metodoPago})
                  </p>
                  <p className="mb-1">Modalidad: {pedidoSeleccionado.modalidadEntrega}</p>
                </Col>
              </Row>
              
              {pedidoSeleccionado.notas && (
                <Alert variant="info">
                  <strong>Notas:</strong> {pedidoSeleccionado.notas}
                </Alert>
              )}

              <h6>Productos</h6>
              <Table size="sm">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Cant.</th>
                    <th className="text-end">P. Unit.</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidoSeleccionado.detalles?.map((detalle, idx) => (
                    <tr key={idx}>
                      <td>{detalle.producto?.nombre || 'Producto eliminado'}</td>
                      <td className="text-center">{detalle.cantidad}</td>
                      <td className="text-end">{formatearPrecio(detalle.precioUnitario)}</td>
                      <td className="text-end">{formatearPrecio(detalle.precioUnitario * detalle.cantidad)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan="3" className="text-end">Total:</th>
                    <th className="text-end">{formatearPrecio(pedidoSeleccionado.total)}</th>
                  </tr>
                </tfoot>
              </Table>

              <div className="mt-4">
                <h6>Acciones</h6>
                <div className="d-flex flex-wrap gap-2">
                  {pedidoSeleccionado.estadoPago === 'pendiente' && (
                    <Button variant="success" onClick={() => handleConfirmarPago(pedidoSeleccionado.id)} disabled={actionLoading}>
                      <i className="bi bi-cash me-2"></i>Confirmar Pago
                    </Button>
                  )}
                  {pedidoSeleccionado.estado === 'pendiente' && pedidoSeleccionado.estadoPago === 'confirmado' && (
                    <Button variant="info" onClick={() => handleCambiarEstado(pedidoSeleccionado.id, 'preparando')} disabled={actionLoading}>
                      Marcar como Preparando
                    </Button>
                  )}
                  {pedidoSeleccionado.estado === 'preparando' && (
                    <Button variant="primary" onClick={() => handleCambiarEstado(pedidoSeleccionado.id, 'listo')} disabled={actionLoading}>
                      Marcar como Pedido listo
                    </Button>
                  )}
                  {pedidoSeleccionado.estado === 'listo' && (
                    <Button variant="success" onClick={() => handleCambiarEstado(pedidoSeleccionado.id, 'entregado')} disabled={actionLoading}>
                      Marcar como Entregado
                    </Button>
                  )}
                  {(pedidoSeleccionado.estado === 'pendiente' || pedidoSeleccionado.estado === 'preparando') && (
                    <Button variant="danger" onClick={() => handleCambiarEstado(pedidoSeleccionado.id, 'cancelado')} disabled={actionLoading}>
                      Cancelar Pedido
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPedidosPage;