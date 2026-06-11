/**
 * Componente: ProductoList.jsx
 * Descripción: Lista de productos en el panel de administración con opciones para crear, editar, eliminar y activar/desactivar
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, Pagination, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import StockManager from './StockManager';
import ProductoForm from './ProductoForm';
import { useAuth } from '../../../context/AuthContext';

const ProductoList = () => {
  const { isAdmin } = useAuth();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    categoriaId: '',
    buscar: '',
    activo: '',
    pagina: 1,
    limite: 12
  });
  const [paginacion, setPaginacion] = useState({ total: 0, totalPaginas: 0 });
  
  // Modal
  const [showForm, setShowForm] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);

  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    fetchProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const fetchCategorias = async () => {
    try {
      const res = await api.get('/admin/categorias?activo=true');
      setCategorias(res.data.data.categorias || []);
    } catch (err) {
      console.error('Error al cargar categorías', err);
    }
  };

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const params = { ...filtros };
      if (!params.categoriaId) delete params.categoriaId;
      if (!params.activo) delete params.activo;
      if (!params.buscar) delete params.buscar;
      
      const res = await api.get('/admin/productos', { params });
      setProductos(res.data.data.productos || []);
      setPaginacion(res.data.data.paginacion || { total: 0, totalPaginas: 0 });
    } catch (err) {
      setError('Error al cargar productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value, pagina: 1 }));
  };

  const handlePageChange = (page) => {
    setFiltros(prev => ({ ...prev, pagina: page }));
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/admin/productos/${id}/toggle`);
      fetchProductos();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await api.delete(`/admin/productos/${id}`);
      fetchProductos();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleEdit = (producto) => {
    setProductoEditar(producto);
    setShowForm(true);
  };

  const handleCreate = () => {
    setProductoEditar(null);
    setShowForm(true);
  };

  const handleFormSave = () => {
    fetchProductos();
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Productos</h1>
        <Button variant="primary" onClick={handleCreate}>
          <i className="bi bi-plus-circle me-2"></i>
          Nuevo Producto
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filtros */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Categoría</Form.Label>
                <Form.Select
                  name="categoriaId"
                  value={filtros.categoriaId}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  name="activo"
                  value={filtros.activo}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Buscar</Form.Label>
                <Form.Control
                  type="text"
                  name="buscar"
                  placeholder="Nombre del producto..."
                  value={filtros.buscar}
                  onChange={handleFiltroChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla de productos */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    Cargando productos...
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No hay productos que mostrar
                  </td>
                </tr>
              ) : (
                productos.map(prod => (
                  <tr key={prod.id}>
                    <td>#{prod.id}</td>
                    <td>
                      {prod.imagen ? (
                        <img
                          src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${prod.imagen}`}
                          alt={prod.nombre}
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          className="rounded"
                        />
                      ) : (
                        <div className="bg-light d-flex align-items-center justify-content-center rounded" style={{ width: '50px', height: '50px' }}>
                          <i className="bi bi-image text-muted"></i>
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{prod.nombre}</strong>
                      {prod.proveedor && (
                        <div className="small text-muted">{prod.proveedor.nombre}</div>
                      )}
                    </td>
                    <td>{prod.Categoria?.nombre || '—'}</td>
                    <td>{formatearPrecio(prod.precio)}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={prod.stock > 10 ? 'success' : prod.stock > 0 ? 'warning' : 'danger'}>
                          {prod.stock}
                        </Badge>
                        <StockManager
                          productoId={prod.id}
                          stockActual={prod.stock}
                          onStockUpdated={fetchProductos}
                        />
                      </div>
                    </td>
                    <td>
                      <Badge bg={prod.activo ? 'success' : 'secondary'}>
                        {prod.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleEdit(prod)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="me-1"
                        onClick={() => handleToggle(prod.id)}
                      >
                        <i className={`bi bi-${prod.activo ? 'eye-slash' : 'eye'}`}></i>
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(prod.id)}
                        >
                          <i className="bi bi-trash"></i>
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
              <Pagination.First
                disabled={filtros.pagina === 1}
                onClick={() => handlePageChange(1)}
              />
              <Pagination.Prev
                disabled={filtros.pagina === 1}
                onClick={() => handlePageChange(filtros.pagina - 1)}
              />
              {[...Array(paginacion.totalPaginas).keys()].map(page => (
                <Pagination.Item
                  key={page + 1}
                  active={page + 1 === filtros.pagina}
                  onClick={() => handlePageChange(page + 1)}
                >
                  {page + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                disabled={filtros.pagina === paginacion.totalPaginas}
                onClick={() => handlePageChange(filtros.pagina + 1)}
              />
              <Pagination.Last
                disabled={filtros.pagina === paginacion.totalPaginas}
                onClick={() => handlePageChange(paginacion.totalPaginas)}
              />
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      {/* Modal de formulario */}
      <ProductoForm
        show={showForm}
        onHide={() => setShowForm(false)}
        producto={productoEditar}
        onSave={handleFormSave}
      />
    </Container>
  );
};

export default ProductoList;