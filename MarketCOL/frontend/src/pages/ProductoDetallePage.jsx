/**
 * ============================================
 * PRODUCTO DETALLE PAGE - MarketCOL
 * ============================================
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import catalogoService from '../services/catalogoService';
import carritoService from '../services/carritoService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, getImageUrl } from '../utils/helpers';

const ProductoDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    let mounted = true;

    const loadProducto = async () => {
      setLoading(true);
      setMensaje({ tipo: '', texto: '' });

      try {
        const response = await catalogoService.getProductoById(id);
        const data = response?.data?.producto || response?.producto || response?.data || null;

        if (mounted) {
          setProducto(data);
          setCantidad(1);
        }
      } catch (error) {
        if (mounted) {
          setMensaje({
            tipo: 'danger',
            texto: error?.message || 'No se pudo cargar la información del producto',
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProducto();

    return () => {
      mounted = false;
    };
  }, [id]);

  const stock = Number(producto?.stock || 0);
  const sinStock = stock <= 0;
  const cantidadMaxima = stock > 0 ? stock : 1;
  const imageUrl = useMemo(() => getImageUrl(producto?.imagen), [producto?.imagen]);

  useEffect(() => {
    if (stock > 0 && cantidad > stock) {
      setCantidad(stock);
    }
    if (stock <= 0 && cantidad !== 1) {
      setCantidad(1);
    }
  }, [cantidad, stock]);

  const handleAgregarAlCarrito = async () => {
    if (!producto) return;

    if (sinStock) {
      setMensaje({ tipo: 'warning', texto: 'Este producto está agotado.' });
      return;
    }

    try {
      await carritoService.agregarAlCarrito(producto.id, cantidad, producto);
      setMensaje({ tipo: 'success', texto: `${producto.nombre} agregado al carrito` });
    } catch (error) {
      setMensaje({
        tipo: 'danger',
        texto: error?.message || 'No se pudo agregar el producto al carrito',
      });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando producto..." />;
  }

  if (!producto) {
    return (
      <Container className="py-4">
        <Alert variant={mensaje.tipo || 'danger'} className="mb-4">
          {mensaje.texto || 'No se encontró la información del producto'}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/catalogo')}>
          Volver al catálogo
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center gap-3 mb-4 flex-wrap">
        <div>
          <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </Button>
          <h1 className="mb-2">{producto.nombre}</h1>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {producto.categoria?.nombre && <Badge bg="secondary">{producto.categoria.nombre}</Badge>}
            {producto.subcategoria?.nombre && <Badge bg="info">{producto.subcategoria.nombre}</Badge>}
            <Badge bg={sinStock ? 'danger' : stock < 10 ? 'warning' : 'success'}>
              {sinStock ? 'Agotado' : `Stock: ${stock}`}
            </Badge>
          </div>
        </div>

        <Button variant="outline-primary" onClick={() => navigate('/catalogo')}>
          Seguir comprando
        </Button>
      </div>

      {mensaje.texto && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
          {mensaje.texto}
        </Alert>
      )}

      <Row className="g-4">
        <Col lg={6}>
          <Card className="shadow-sm border-0 h-100 overflow-hidden">
            <div
              style={{
                minHeight: 420,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
              }}
            >
              <img
                src={imageUrl}
                alt={producto.nombre}
                onError={(e) => {
                  e.target.src = '/images/producto-default.svg';
                }}
                style={{
                  width: '100%',
                  maxWidth: 520,
                  maxHeight: 420,
                  objectFit: 'contain',
                  borderRadius: 20,
                }}
              />
            </div>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-4 p-lg-5 d-flex flex-column">
              <div className="mb-3">
                <div className="text-uppercase text-muted small fw-semibold mb-2">Detalle del producto</div>
                <div className="display-6 fw-bold text-danger mb-2">{formatCurrency(producto.precio)}</div>
                <div className="text-muted">Referencia: <strong>#{producto.id}</strong></div>
              </div>

              <div className="mb-4">
                <h5 className="mb-2">Descripción</h5>
                <p className="text-muted mb-0" style={{ lineHeight: 1.7 }}>
                  {producto.descripcion || 'Este producto no tiene descripción.'}
                </p>
              </div>

              <Row className="g-3 mb-4">
                <Col xs={6}>
                  <div className="p-3 rounded-3 bg-light h-100">
                    <div className="text-muted small">Categoría</div>
                    <div className="fw-semibold">{producto.categoria?.nombre || 'Sin categoría'}</div>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="p-3 rounded-3 bg-light h-100">
                    <div className="text-muted small">Subcategoría</div>
                    <div className="fw-semibold">{producto.subcategoria?.nombre || 'Sin subcategoría'}</div>
                  </div>
                </Col>
              </Row>

              <div className="mt-auto">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Cantidad</Form.Label>
                  <InputGroup>
                    <Button
                      variant="outline-secondary"
                      onClick={() => setCantidad((prev) => Math.max(1, prev - 1))}
                      disabled={sinStock}
                    >
                      -
                    </Button>
                    <Form.Control
                      type="number"
                      min={1}
                      max={cantidadMaxima}
                      value={cantidad}
                      onChange={(e) => {
                        const nextValue = Math.max(1, Math.min(cantidadMaxima, Number(e.target.value) || 1));
                        setCantidad(nextValue);
                      }}
                      disabled={sinStock}
                      className="text-center"
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setCantidad((prev) => Math.min(cantidadMaxima, prev + 1))}
                      disabled={sinStock}
                    >
                      +
                    </Button>
                  </InputGroup>
                </Form.Group>

                <div className="d-grid gap-2 d-md-flex">
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={handleAgregarAlCarrito}
                    disabled={sinStock}
                    className="flex-grow-1"
                  >
                    <i className="bi bi-cart-plus me-2"></i>
                    {sinStock ? 'No disponible' : 'Agregar al carrito'}
                  </Button>
                  <Button variant="outline-secondary" size="lg" onClick={() => navigate('/carrito')}>
                    Ver carrito
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductoDetallePage;