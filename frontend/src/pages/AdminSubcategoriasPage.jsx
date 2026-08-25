/**
 * ============================================
 * ADMIN SUBCATEGORÍAS PAGE - MarketCOL
 * ============================================
 * Gestión CRUD de subcategorías
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Badge, Dropdown, Row, Col, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { exportarSubcategoriasAPDF, exportarSubcategoriasAExcel } from '../utils/exportUtils';

const AdminSubcategoriasPage = () => {
  useAuth();
  const navigate = useNavigate();

  const [subcategorias, setSubcategorias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [mensaje, setMensaje] = useState({
    tipo: '',
    texto: ''
  });

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 25;

  // Filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    categoriaId: 'todas',
    estado: 'todos'
  });

  // Datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoriaId: '',
    activo: true
  });

  // ============================================
  // FILTRAR SUBCATEGORÍAS
  // ============================================

  const subcategoriasFiltradas = useMemo(() => {
    return subcategorias.filter((sub) => {
      // Filtro por búsqueda
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();

        const categoria = categorias.find(
          (categoriaActual) => categoriaActual.id === sub.categoriaId
        );

        const coincide =
          sub.nombre.toLowerCase().includes(busqueda) ||
          (sub.descripcion &&
            sub.descripcion.toLowerCase().includes(busqueda)) ||
          (categoria &&
            categoria.nombre.toLowerCase().includes(busqueda));

        if (!coincide) {
          return false;
        }
      }

      // Filtro por categoría
      if (
        filtros.categoriaId !== 'todas' &&
        sub.categoriaId !== Number.parseInt(filtros.categoriaId, 10)
      ) {
        return false;
      }

      // Filtro por estado
      if (filtros.estado !== 'todos') {
        if (filtros.estado === 'activos' && !sub.activo) {
          return false;
        }

        if (filtros.estado === 'inactivos' && sub.activo) {
          return false;
        }
      }

      return true;
    });
  }, [
    subcategorias,
    filtros.busqueda,
    filtros.categoriaId,
    filtros.estado,
    categorias
  ]);

  // ============================================
  // PAGINACIÓN
  // ============================================

  const totalPaginas = Math.ceil(
    subcategoriasFiltradas.length / registrosPorPagina
  );

  const subcategoriasPaginadas = useMemo(() => {
    const inicio =
      (paginaActual - 1) * registrosPorPagina;

    const fin = inicio + registrosPorPagina;

    return subcategoriasFiltradas.slice(inicio, fin);
  }, [
    subcategoriasFiltradas,
    paginaActual,
    registrosPorPagina
  ]);

  // ============================================
  // MAPA DE CATEGORÍAS
  // ============================================

  const categoriaNombreMap = useMemo(() => {
    return categorias.reduce((map, categoria) => {
      map[categoria.id] = categoria.nombre;
      return map;
    }, {});
  }, [categorias]);

  // ============================================
  // RESET DE PÁGINA AL CAMBIAR FILTROS
  // ============================================

  useEffect(() => {
    setPaginaActual(1);
  }, [
    filtros.busqueda,
    filtros.categoriaId,
    filtros.estado
  ]);

  // ============================================
  // CARGAR DATOS
  // ============================================

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [subcatResponse, catResponse] = await Promise.all([
        api.get('/admin/subcategorias'),
        api.get('/admin/categorias')
      ]);

      const subcategoriasData =
        subcatResponse.data?.data?.subcategorias ||
        subcatResponse.data?.subcategorias ||
        subcatResponse.data?.data ||
        [];

      const categoriasData =
        catResponse.data?.data?.categorias ||
        catResponse.data?.categorias ||
        catResponse.data?.data ||
        [];

      setSubcategorias(
        Array.isArray(subcategoriasData)
          ? subcategoriasData
          : []
      );

      setCategorias(
        Array.isArray(categoriasData)
          ? categoriasData
          : []
      );
    } catch (error) {
      console.error('Error al cargar datos:', error);

      setMensaje({
        tipo: 'danger',
        texto: 'Error al cargar los datos'
      });

      setSubcategorias([]);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // CARGAR DATOS AL MONTAR
  // ============================================

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // ABRIR MODAL
  // ============================================

  const handleShowModal = (subcategoria = null) => {
    if (subcategoria) {
      setEditando(subcategoria);

      setFormData({
        nombre: subcategoria.nombre,
        descripcion: subcategoria.descripcion || '',
        categoriaId: subcategoria.categoriaId,
        activo: subcategoria.activo
      });
    } else {
      setEditando(null);

      setFormData({
        nombre: '',
        descripcion: '',
        categoriaId: '',
        activo: true
      });
    }

    setShowModal(true);
  };

  // ============================================
  // CERRAR MODAL
  // ============================================

  const handleCloseModal = () => {
    setShowModal(false);
    setEditando(null);

    setFormData({
      nombre: '',
      descripcion: '',
      categoriaId: '',
      activo: true
    });
  };

  // ============================================
  // CAMBIAR FORMULARIO
  // ============================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked
    } = e.target;

    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: type === 'checkbox'
        ? checked
        : value
    }));
  };

  // ============================================
  // GUARDAR SUBCATEGORÍA
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editando) {
        await api.put(
          `/admin/subcategorias/${editando.id}`,
          formData
        );

        setMensaje({
          tipo: 'success',
          texto: 'Subcategoría actualizada exitosamente'
        });
      } else {
        await api.post(
          '/admin/subcategorias',
          formData
        );

        setMensaje({
          tipo: 'success',
          texto: 'Subcategoría creada exitosamente'
        });
      }

      handleCloseModal();
      await loadData();
    } catch (error) {
      console.error(
        'Error al guardar subcategoría:',
        error
      );

      setMensaje({
        tipo: 'danger',
        texto:
          error.response?.data?.message ||
          'Error al guardar la subcategoría'
      });
    }
  };

  // ============================================
  // ELIMINAR SUBCATEGORÍA
  // ============================================

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        '¿Estás seguro de eliminar esta subcategoría?'
      )
    ) {
      return;
    }

    try {
      await api.delete(`/admin/subcategorias/${id}`);

      setMensaje({
        tipo: 'success',
        texto: 'Subcategoría eliminada exitosamente'
      });

      await loadData();
    } catch (error) {
      console.error(
        'Error al eliminar subcategoría:',
        error
      );

      setMensaje({
        tipo: 'danger',
        texto:
          error.response?.data?.message ||
          'Error al eliminar la subcategoría'
      });
    }
  };

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  const handleToggleActivo = async (subcategoria) => {
    try {
      await api.put(
        `/admin/subcategorias/${subcategoria.id}`,
        {
          nombre: subcategoria.nombre,
          descripcion: subcategoria.descripcion,
          categoriaId: subcategoria.categoriaId,
          activo: !subcategoria.activo
        }
      );

      setMensaje({
        tipo: 'success',
        texto: `Subcategoría ${
          !subcategoria.activo
            ? 'activada'
            : 'desactivada'
        } exitosamente`
      });

      await loadData();
    } catch (error) {
      console.error(
        'Error al cambiar estado:',
        error
      );

      setMensaje({
        tipo: 'danger',
        texto: 'Error al cambiar el estado'
      });
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <LoadingSpinner message="Cargando subcategorías..." />
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Container className="py-4">

      {/* ============================================
          ENCABEZADO
          ============================================ */}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>
            <i
              className="bi bi-folder2 me-2"
              aria-hidden="true"
            ></i>
            <span>Gestión de Subcategorías</span>
          </h1>

          <p className="text-muted mb-0">
            Administra las subcategorías de productos
          </p>
        </div>

        <div>

          {/* Exportar */}
          <Dropdown className="d-inline-block me-2">
            <Dropdown.Toggle
              variant="success"
              id="dropdown-exportar-subcategorias"
            >
              <i
                className="bi bi-download me-1"
                aria-hidden="true"
              ></i>
              <span>Exportar</span>
            </Dropdown.Toggle>

            <Dropdown.Menu>

              <Dropdown.Item
                onClick={() =>
                  exportarSubcategoriasAPDF(
                    subcategoriasFiltradas,
                    categorias
                  )
                }
              >
                <i
                  className="bi bi-file-earmark-pdf me-2"
                  aria-hidden="true"
                ></i>
                <span>Exportar a PDF</span>
              </Dropdown.Item>

              <Dropdown.Item
                onClick={() =>
                  exportarSubcategoriasAExcel(
                    subcategoriasFiltradas,
                    categorias
                  )
                }
              >
                <i
                  className="bi bi-file-earmark-excel me-2"
                  aria-hidden="true"
                ></i>
                <span>Exportar a Excel</span>
              </Dropdown.Item>

            </Dropdown.Menu>
          </Dropdown>

          {/* Volver */}
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/admin')}
            className="me-2"
          >
            <i
              className="bi bi-arrow-left me-1"
              aria-hidden="true"
            ></i>
            <span>Volver</span>
          </Button>

          {/* Nueva subcategoría */}
          <Button
            variant="primary"
            onClick={() => handleShowModal()}
          >
            <i
              className="bi bi-plus-circle me-1"
              aria-hidden="true"
            ></i>
            <span>Nueva Subcategoría</span>
          </Button>

        </div>
      </div>

      {/* ============================================
          MENSAJES
          ============================================ */}

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

      {/* ============================================
          FILTROS
          ============================================ */}

      <Card className="mb-3">

        <Card.Header className="bg-light">
          <h5 className="mb-0">
            <i
              className="bi bi-funnel me-2"
              aria-hidden="true"
            ></i>
            <span>Filtros</span>
          </h5>
        </Card.Header>

        <Card.Body>

          <Row className="g-3 mb-3">

            {/* Buscar */}
            <Col md={3}>
              <InputGroup>

                <InputGroup.Text>
                  <i
                    className="bi bi-search"
                    aria-hidden="true"
                  ></i>
                </InputGroup.Text>

                <Form.Control
                  type="text"
                  placeholder="Buscar..."
                  value={filtros.busqueda}
                  onChange={(e) =>
                    setFiltros((prevFiltros) => ({
                      ...prevFiltros,
                      busqueda: e.target.value
                    }))
                  }
                />

              </InputGroup>
            </Col>

            {/* Categoría */}
            <Col md={3}>
              <Form.Select
                value={filtros.categoriaId}
                onChange={(e) =>
                  setFiltros((prevFiltros) => ({
                    ...prevFiltros,
                    categoriaId: e.target.value
                  }))
                }
              >
                <option value="todas">
                  Todas las categorías
                </option>

                {categorias.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                  >
                    {cat.nombre}
                  </option>
                ))}
              </Form.Select>
            </Col>

            {/* Estado */}
            <Col md={2}>
              <Form.Select
                value={filtros.estado}
                onChange={(e) =>
                  setFiltros((prevFiltros) => ({
                    ...prevFiltros,
                    estado: e.target.value
                  }))
                }
              >
                <option value="todos">
                  Todos
                </option>

                <option value="activos">
                  Activos
                </option>

                <option value="inactivos">
                  Inactivos
                </option>
              </Form.Select>
            </Col>

            {/* Limpiar */}
            <Col md={2}>
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() =>
                  setFiltros({
                    busqueda: '',
                    categoriaId: 'todas',
                    estado: 'todos'
                  })
                }
              >
                <i
                  className="bi bi-x-circle me-1"
                  aria-hidden="true"
                ></i>
                <span>Limpiar</span>
              </Button>
            </Col>

          </Row>

          <Row>
            <Col>
              <div className="text-muted small">
                <i
                  className="bi bi-info-circle me-1"
                  aria-hidden="true"
                ></i>
                <span>
                  Mostrando {subcategoriasFiltradas.length} de{' '}
                  {subcategorias.length} subcategorías
                </span>
              </div>
            </Col>
          </Row>

        </Card.Body>
      </Card>

      {/* ============================================
          TABLA
          ============================================ */}

      <Card>

        <Card.Body className="p-0">

          <Table
            responsive
            hover
            className="mb-0"
          >
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th className="text-center">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>

              {subcategoriasFiltradas.length === 0 ? (

                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-4 text-muted"
                  >
                    No hay subcategorías registradas
                  </td>
                </tr>

              ) : (

                subcategoriasPaginadas.map((sub) => (

                  <tr key={sub.id}>

                    <td className="align-middle">
                      {sub.id}
                    </td>

                    <td className="align-middle fw-bold">
                      {sub.nombre}
                    </td>

                    <td className="align-middle">
                      <Badge bg="info">
                        {categoriaNombreMap[sub.categoriaId] ||
                          'N/A'}
                      </Badge>
                    </td>

                    <td className="align-middle">
                      {sub.descripcion || '-'}
                    </td>

                    <td className="align-middle">
                      <Badge
                        bg={
                          sub.activo
                            ? 'success'
                            : 'secondary'
                        }
                      >
                        {sub.activo
                          ? 'Activo'
                          : 'Inactivo'}
                      </Badge>
                    </td>

                    <td className="align-middle text-center">

                      {/* Editar */}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() =>
                          handleShowModal(sub)
                        }
                        title="Editar subcategoría"
                      >
                        <i
                          className="bi bi-pencil"
                          aria-hidden="true"
                        ></i>
                        <span className="visually-hidden">
                          Editar
                        </span>
                      </Button>

                      {/* Activar / desactivar */}
                      <Button
                        variant={
                          sub.activo
                            ? 'outline-warning'
                            : 'outline-success'
                        }
                        size="sm"
                        className="me-1"
                        onClick={() =>
                          handleToggleActivo(sub)
                        }
                        title={
                          sub.activo
                            ? 'Desactivar subcategoría'
                            : 'Activar subcategoría'
                        }
                      >
                        <i
                          className={`bi bi-${
                            sub.activo
                              ? 'x-circle'
                              : 'check-circle'
                          }`}
                          aria-hidden="true"
                        ></i>

                        <span className="visually-hidden">
                          {sub.activo
                            ? 'Desactivar'
                            : 'Activar'}
                        </span>
                      </Button>

                      {/* Eliminar */}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() =>
                          handleDelete(sub.id)
                        }
                        title="Eliminar subcategoría"
                      >
                        <i
                          className="bi bi-trash"
                          aria-hidden="true"
                        ></i>

                        <span className="visually-hidden">
                          Eliminar
                        </span>
                      </Button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>
          </Table>

        </Card.Body>
      </Card>

      {/* ============================================
          PAGINACIÓN
          ============================================ */}

      {totalPaginas > 1 && (
        <Card className="mt-3">

          <Card.Body>

            <div className="d-flex justify-content-between align-items-center">

              <div>
                <small className="text-muted">

                  <i
                    className="bi bi-file-text me-1"
                    aria-hidden="true"
                  ></i>

                  <span>
                    Página <strong>{paginaActual}</strong> de{' '}
                    <strong>{totalPaginas}</strong> - Mostrando{' '}
                    <strong>
                      {subcategoriasPaginadas.length}
                    </strong>{' '}
                    de{' '}
                    <strong>
                      {subcategoriasFiltradas.length}
                    </strong>{' '}
                    registros
                  </span>

                </small>
              </div>

              <div className="btn-group">

                {/* Primera página */}
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() =>
                    setPaginaActual(1)
                  }
                  disabled={paginaActual === 1}
                  title="Primera página"
                >
                  <i
                    className="bi bi-chevron-bar-left"
                    aria-hidden="true"
                  ></i>

                  <span className="visually-hidden">
                    Primera página
                  </span>
                </Button>

                {/* Página anterior */}
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() =>
                    setPaginaActual(
                      (prev) => prev - 1
                    )
                  }
                  disabled={paginaActual === 1}
                  title="Página anterior"
                >
                  <i
                    className="bi bi-chevron-left me-1"
                    aria-hidden="true"
                  ></i>

                  <span>Anterior</span>
                </Button>

                {/* Página actual */}
                <Button
                  variant="primary"
                  size="sm"
                  disabled
                >
                  {paginaActual} / {totalPaginas}
                </Button>

                {/* Página siguiente */}
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() =>
                    setPaginaActual(
                      (prev) => prev + 1
                    )
                  }
                  disabled={
                    paginaActual === totalPaginas
                  }
                  title="Página siguiente"
                >
                  <span>Siguiente</span>

                  <i
                    className="bi bi-chevron-right ms-1"
                    aria-hidden="true"
                  ></i>
                </Button>

                {/* Última página */}
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() =>
                    setPaginaActual(totalPaginas)
                  }
                  disabled={
                    paginaActual === totalPaginas
                  }
                  title="Última página"
                >
                  <i
                    className="bi bi-chevron-bar-right"
                    aria-hidden="true"
                  ></i>

                  <span className="visually-hidden">
                    Última página
                  </span>
                </Button>

              </div>
            </div>

          </Card.Body>
        </Card>
      )}

      {/* ============================================
          MODAL CREAR / EDITAR
          ============================================ */}

      <Modal
        show={showModal}
        onHide={handleCloseModal}
      >

        <Modal.Header closeButton>
          <Modal.Title>
            {editando
              ? 'Editar Subcategoría'
              : 'Nueva Subcategoría'}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>

          <Modal.Body>

            {/* Categoría */}
            <Form.Group className="mb-3">

              <Form.Label>
                Categoría{' '}
                <span className="text-danger">
                  *
                </span>
              </Form.Label>

              <Form.Select
                name="categoriaId"
                value={formData.categoriaId}
                onChange={handleChange}
                required
              >
                <option value="">
                  Seleccionar categoría...
                </option>

                {categorias
                  .filter((categoria) => categoria.activo)
                  .map((cat) => (
                    <option
                      key={cat.id}
                      value={cat.id}
                    >
                      {cat.nombre}
                    </option>
                  ))}
              </Form.Select>

            </Form.Group>

            {/* Nombre */}
            <Form.Group className="mb-3">

              <Form.Label>
                Nombre{' '}
                <span className="text-danger">
                  *
                </span>
              </Form.Label>

              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Televisores"
              />

            </Form.Group>

            {/* Descripción */}
            <Form.Group className="mb-3">

              <Form.Label>
                Descripción
              </Form.Label>

              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Descripción de la subcategoría (opcional)"
              />

            </Form.Group>

            {/* Estado */}
            <Form.Group className="mb-3">

              <Form.Check
                type="checkbox"
                name="activo"
                label="Subcategoría activa"
                checked={formData.activo}
                onChange={handleChange}
              />

            </Form.Group>

          </Modal.Body>

          <Modal.Footer>

            <Button
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              type="submit"
            >
              {editando
                ? 'Actualizar'
                : 'Crear'}
            </Button>

          </Modal.Footer>

        </Form>
      </Modal>

    </Container>
  );
};

export default AdminSubcategoriasPage;