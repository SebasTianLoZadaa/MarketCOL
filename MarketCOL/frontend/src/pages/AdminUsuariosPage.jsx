/**
 * ============================================
 * ADMIN USUARIOS PAGE - MarketCOL
 * ============================================
 * Gestión de usuarios del sistema (clientes, auxiliares, administradores)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Badge, Row, Col, InputGroup, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { exportarUsuariosAPDF, exportarUsuariosAExcel } from '../utils/exportUtils';
import { useAuth } from '../context/AuthContext';

const AdminUsuariosPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [usuarioActual, setUsuarioActual] = useState({
    id: null,
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    cedula: '',
    rol: 'cliente',
    activo: true
  });

  // Filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    rol: 'todos',
    estado: 'todos'
  });

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 25;

  const cargarUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/usuarios?limite=1000');
      const data = response.data?.data?.usuarios || response.data?.usuarios || response.data?.data || [];
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cargar usuarios' });
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editando) {
        const dataActualizar = { ...usuarioActual };
        if (!dataActualizar.password) {
          delete dataActualizar.password;
        }
        await api.put(`/admin/usuarios/${usuarioActual.id}`, dataActualizar);
        setMensaje({ tipo: 'success', texto: 'Usuario actualizado exitosamente' });
      } else {
        if (!usuarioActual.password) {
          setMensaje({ tipo: 'danger', texto: 'La contraseña es requerida para nuevos usuarios' });
          return;
        }
        await api.post('/admin/usuarios', usuarioActual);
        setMensaje({ tipo: 'success', texto: 'Usuario creado exitosamente' });
      }

      setShowModal(false);
      limpiarFormulario();
      cargarUsuarios();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      setMensaje({
        tipo: 'danger',
        texto: error.response?.data?.message || 'Error al guardar usuario'
      });
    }
  };

  const handleEditar = (usuario) => {
    setUsuarioActual({
      ...usuario,
      password: ''
    });
    setEditando(true);
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await api.delete(`/admin/usuarios/${id}`);
      setMensaje({ tipo: 'success', texto: 'Usuario eliminado exitosamente' });
      cargarUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setMensaje({
        tipo: 'danger',
        texto: error.response?.data?.message || 'Error al eliminar usuario'
      });
    }
  };

  const handleToggleActivo = async (usuario) => {
    try {
      await api.patch(`/admin/usuarios/${usuario.id}/toggle`);
      setMensaje({
        tipo: 'success',
        texto: `Usuario ${usuario.activo ? 'desactivado' : 'activado'} exitosamente`
      });
      cargarUsuarios();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cambiar estado del usuario' });
    }
  };

  const limpiarFormulario = () => {
    setUsuarioActual({
      id: null,
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      telefono: '',
      direccion: '',
      cedula: '',
      rol: 'cliente',
      activo: true
    });
    setEditando(false);
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      rol: 'todos',
      estado: 'todos'
    });
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(usuario => {
      const busquedaLower = filtros.busqueda.toLowerCase().trim();
      const pasaBusqueda = !busquedaLower ||
        usuario.nombre?.toLowerCase().includes(busquedaLower) ||
        usuario.apellido?.toLowerCase().includes(busquedaLower) ||
        usuario.email?.toLowerCase().includes(busquedaLower) ||
        usuario.cedula?.includes(busquedaLower);

      const pasaRol = filtros.rol === 'todos' || usuario.rol === filtros.rol;
      const pasaEstado = filtros.estado === 'todos' ||
        (filtros.estado === 'activo' && usuario.activo) ||
        (filtros.estado === 'inactivo' && !usuario.activo);

      return pasaBusqueda && pasaRol && pasaEstado;
    });
  }, [usuarios, filtros]);

  const totalPaginas = Math.ceil(usuariosFiltrados.length / registrosPorPagina);
  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return usuariosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [usuariosFiltrados, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros]);

  const getRolBadge = (rol) => {
    const mapping = {
      'administrador': 'danger',
      'auxiliar': 'warning',
      'cliente': 'info'
    };
    return mapping[rol] || 'secondary';
  };

  if (loading) {
    return <LoadingSpinner message="Cargando usuarios..." />;
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>
            <i className="bi bi-people me-2"></i>
            Gestión de Usuarios
          </h1>
          <p className="text-muted mb-0">Administra los usuarios del sistema</p>
        </div>
        <div>
          <Button variant="outline-secondary" onClick={() => navigate('/admin')} className="me-2">
            <i className="bi bi-arrow-left me-1"></i>
            Volver
          </Button>
          <div className="btn-group me-2">
            <Button variant="success" onClick={() => exportarUsuariosAPDF(usuariosFiltrados)}>
              <i className="bi bi-file-earmark-pdf me-1"></i>
              Exportar
            </Button>
            <Button variant="success" className="dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" />
            <ul className="dropdown-menu">
              <li><button className="dropdown-item" onClick={() => exportarUsuariosAPDF(usuariosFiltrados)}>PDF</button></li>
              <li><button className="dropdown-item" onClick={() => exportarUsuariosAExcel(usuariosFiltrados)}>Excel</button></li>
            </ul>
          </div>
          {isAdmin && (
            <Button variant="primary" onClick={() => { limpiarFormulario(); setShowModal(true); }}>
              <i className="bi bi-plus-circle me-1"></i>
              Nuevo Usuario
            </Button>
          )}
        </div>
      </div>

      {mensaje.texto && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
          {mensaje.texto}
        </Alert>
      )}

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Header className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><i className="bi bi-funnel me-2"></i>Filtros</h5>
            <Button variant="outline-secondary" size="sm" onClick={limpiarFiltros}>
              <i className="bi bi-x-circle me-1"></i>Limpiar
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Buscar</Form.Label>
                <InputGroup>
                  <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Nombre, email o cédula..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Rol</Form.Label>
                <Form.Select
                  value={filtros.rol}
                  onChange={(e) => setFiltros({ ...filtros, rol: e.target.value })}
                >
                  <option value="todos">Todos los roles</option>
                  <option value="administrador">Administradores</option>
                  <option value="auxiliar">Auxiliares</option>
                  <option value="cliente">Clientes</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={filtros.estado}
                  onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                >
                  <option value="todos">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <div className="mt-3">
            <Badge bg="primary">
              <i className="bi bi-people-fill me-1"></i>
              {usuariosFiltrados.length} registro(s) encontrado(s)
            </Badge>
          </div>
        </Card.Body>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosPaginados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No hay usuarios para mostrar
                  </td>
                </tr>
              ) : (
                usuariosPaginados.map(usuario => (
                  <tr key={usuario.id}>
                    <td>{usuario.id}</td>
                    <td>{usuario.nombre} {usuario.apellido || ''}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.cedula || '-'}</td>
                    <td>{usuario.telefono || '-'}</td>
                    <td>
                      <Badge bg={getRolBadge(usuario.rol)}>{usuario.rol}</Badge>
                    </td>
                    <td>
                      <Badge bg={usuario.activo ? 'success' : 'secondary'}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleEditar(usuario)}
                        disabled={!isAdmin && usuario.rol === 'administrador'}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant={usuario.activo ? 'outline-warning' : 'outline-success'}
                        size="sm"
                        className="me-1"
                        onClick={() => handleToggleActivo(usuario)}
                        disabled={!isAdmin}
                      >
                        <i className={`bi bi-${usuario.activo ? 'toggle-on' : 'toggle-off'}`}></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleEliminar(usuario.id)}
                        disabled={!isAdmin}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <Card.Footer>
            <Pagination className="justify-content-center mb-0">
              <Pagination.First disabled={paginaActual === 1} onClick={() => setPaginaActual(1)} />
              <Pagination.Prev disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)} />
              <Pagination.Item active>{paginaActual}</Pagination.Item>
              <Pagination.Next disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(p => p + 1)} />
              <Pagination.Last disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(totalPaginas)} />
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      {/* Modal Crear/Editar */}
      <Modal show={showModal} onHide={() => { setShowModal(false); limpiarFormulario(); }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editando ? 'Editar Usuario' : 'Nuevo Usuario'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    value={usuarioActual.nombre}
                    onChange={(e) => setUsuarioActual({ ...usuarioActual, nombre: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido *</Form.Label>
                  <Form.Control
                    type="text"
                    value={usuarioActual.apellido}
                    onChange={(e) => setUsuarioActual({ ...usuarioActual, apellido: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={usuarioActual.email}
                    onChange={(e) => setUsuarioActual({ ...usuarioActual, email: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cédula</Form.Label>
                  <Form.Control
                    type="text"
                    value={usuarioActual.cedula}
                    onChange={(e) => setUsuarioActual({ ...usuarioActual, cedula: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="tel"
                    value={usuarioActual.telefono}
                    onChange={(e) => setUsuarioActual({ ...usuarioActual, telefono: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Contraseña {editando ? '(dejar vacío para no cambiar)' : '*'}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    value={usuarioActual.password}
                    onChange={(e) => setUsuarioActual({ ...usuarioActual, password: e.target.value })}
                    required={!editando}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={usuarioActual.direccion}
                onChange={(e) => setUsuarioActual({ ...usuarioActual, direccion: e.target.value })}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rol *</Form.Label>
                  <Form.Select
                    value={usuarioActual.rol}
                    onChange={(e) => setUsuarioActual({ ...usuarioActual, rol: e.target.value })}
                    required
                  >
                    <option value="cliente">Cliente</option>
                    <option value="auxiliar">Auxiliar</option>
                    <option value="administrador">Administrador</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado *</Form.Label>
                  <Form.Select
                    value={usuarioActual.activo ? 'true' : 'false'}
                    onChange={(e) => setUsuarioActual({ ...usuarioActual, activo: e.target.value === 'true' })}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowModal(false); limpiarFormulario(); }}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editando ? 'Actualizar' : 'Crear'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminUsuariosPage;