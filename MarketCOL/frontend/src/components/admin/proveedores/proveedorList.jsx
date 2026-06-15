import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, Pagination, Alert, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import ProveedorForm from './proveedorForm';
import { useAuth } from '../../../context/AuthContext';
import { exportarProveedoresAPDF, exportarProveedoresAExcel } from '../../../utils/exportUtils';

const ProveedorList = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    buscar: '',
    activo: '',
    pagina: 1,
    limite: 10
  });
  const [paginacion, setPaginacion] = useState({ total: 0, totalPaginas: 0 });
  
  // Modal
  const [showForm, setShowForm] = useState(false);
  const [proveedorEditar, setProveedorEditar] = useState(null);

  useEffect(() => {
    fetchProveedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const fetchProveedores = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filtros };
      if (!params.activo) delete params.activo;
      if (!params.buscar) delete params.buscar;
      
      const res = await api.get('/admin/proveedores', { params });
      setProveedores(res.data.data.proveedores || []);
      setPaginacion(res.data.data.paginacion || { total: 0, totalPaginas: 0 });
    } catch (err) {
      setError('Error al cargar proveedores');
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
      await api.patch(`/admin/proveedores/${id}/toggle`);
      fetchProveedores();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este proveedor? Se eliminará solo si no tiene productos asociados.')) return;
    try {
      await api.delete(`/admin/proveedores/${id}`);
      fetchProveedores();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar proveedor');
    }
  };

  const handleEdit = (proveedor) => {
    setProveedorEditar(proveedor);
    setShowForm(true);
  };

  const handleCreate = () => {
    setProveedorEditar(null);
    setShowForm(true);
  };

  const handleFormSave = () => {
    fetchProveedores();
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>
            <i className="bi bi-truck me-2"></i>
            Gestión de Proveedores
          </h1>
          <p className="text-muted mb-0">
            Administra los proveedores del sistema
          </p>
        </div>
        <div>
          <Dropdown className="d-inline-block me-2">
            <Dropdown.Toggle variant="success" id="dropdown-exportar-proveedores">
              <i className="bi bi-download me-1"></i>
              Exportar
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => exportarProveedoresAPDF(proveedores)}>
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Exportar a PDF
              </Dropdown.Item>
              <Dropdown.Item onClick={async () => exportarProveedoresAExcel(proveedores)}>
                <i className="bi bi-file-earmark-excel me-2"></i>
                Exportar a Excel
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button variant="outline-secondary" onClick={() => navigate('/admin')} className="me-2">
            <i className="bi bi-arrow-left me-1"></i>
            Volver
          </Button>
          {isAdmin && (
            <Button variant="primary" onClick={handleCreate}>
              <i className="bi bi-plus-circle me-2"></i>
              Nuevo Proveedor
            </Button>
          )}
        </div>
      </div>

      <p className="text-muted mb-3">
        Total: {paginacion.total} proveedor{paginacion.total !== 1 ? 'es' : ''}
      </p>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filtros */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light">
          <i className="bi bi-funnel me-2"></i>
          <strong>Filtros</strong>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Buscar</Form.Label>
                <Form.Control
                  type="text"
                  name="buscar"
                  placeholder="Nombre, contacto o email..."
                  value={filtros.buscar}
                  onChange={handleFiltroChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
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
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla de proveedores */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Cargando proveedores...
                  </td>
                </tr>
              ) : proveedores.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No hay proveedores que mostrar
                  </td>
                </tr>
              ) : (
                proveedores.map(prov => (
                  <tr key={prov.id}>
                    <td>#{prov.id}</td>
                    <td>
                      <strong>{prov.nombre}</strong>
                    </td>
                    <td>{prov.contacto || '—'}</td>
                    <td>{prov.telefono || '—'}</td>
                    <td>{prov.email || '—'}</td>
                    <td>
                      <Badge bg={prov.activo ? 'success' : 'secondary'}>
                        {prov.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleEdit(prov)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="me-1"
                        onClick={() => handleToggle(prov.id)}
                      >
                        <i className={`bi bi-${prov.activo ? 'eye-slash' : 'eye'}`}></i>
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(prov.id)}
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
      <ProveedorForm
        show={showForm}
        onHide={() => setShowForm(false)}
        proveedor={proveedorEditar}
        onSave={handleFormSave}
      />
    </Container>
  );
};

export default ProveedorList;