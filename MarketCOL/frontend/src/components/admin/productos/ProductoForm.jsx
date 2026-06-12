
/**
 * Componente: ProductoForm.jsx
 * Descripción: Formulario para crear o editar productos en el panel de administración.
 * Funcionalidades: - Permite ingresar nombre, descripción, precio, stock, categoría, subcategoría, proveedor e imagen del producto.
 */



import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import api from '../../../services/api';

const ProductoForm = ({ show, onHide, producto, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoriaId: '',
    subcategoriaId: '',
    proveedorId: '',
    imagen: '',
  });
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!producto;

  useEffect(() => {
    fetchCategorias();
    fetchProveedores();
  }, []);

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio || '',
        stock: producto.stock || '',
        categoriaId: producto.categoriaId || '',
        subcategoriaId: producto.subcategoriaId || '',
        proveedorId: producto.proveedorId || '',
        imagen: producto.imagen || '',
      });
      if (producto.imagen) {
        setPreview(producto.imagen.startsWith('http')
          ? producto.imagen
          : `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${producto.imagen}`);
      } else {
        setPreview('');
      }
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        categoriaId: '',
        subcategoriaId: '',
        proveedorId: '',
        imagen: '',
      });
      setPreview('');
      setImagen(null);
    }
  }, [producto]);

  useEffect(() => {
    if (formData.categoriaId) {
      fetchSubcategorias(formData.categoriaId);
    } else {
      setSubcategorias([]);
    }
  }, [formData.categoriaId]);

  const fetchCategorias = async () => {
    try {
      const res = await api.get('/admin/categorias?activo=true');
      setCategorias(res.data.data.categorias || []);
    } catch (err) {
      console.error('Error al cargar categorías', err);
    }
  };

  const fetchSubcategorias = async (categoriaId) => {
    try {
      const res = await api.get(`/admin/subcategorias?categoriaId=${categoriaId}&activo=true`);
      setSubcategorias(res.data.data.subcategorias || []);
    } catch (err) {
      console.error('Error al cargar subcategorías', err);
    }
  };

  const fetchProveedores = async () => {
    try {
      const res = await api.get('/admin/proveedores?activo=true');
      setProveedores(res.data.data.proveedores || []);
    } catch (err) {
      console.error('Error al cargar proveedores', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append('nombre', formData.nombre);
      data.append('descripcion', formData.descripcion);
      data.append('precio', formData.precio);
      data.append('stock', formData.stock);
      data.append('categoriaId', formData.categoriaId);
      data.append('subcategoriaId', formData.subcategoriaId);
      if (formData.proveedorId) data.append('proveedorId', formData.proveedorId);
      if (imagen) {
        data.append('imagen', imagen);
      } else if (formData.imagen) {
        data.append('imagen', formData.imagen.trim());
      }

      let response;
      if (isEditing) {
       response = await api.put(`/admin/productos/${producto.id}`, data);
      } else {
        response = await api.post('/admin/productos', data);
      }

      if (response.data.success) {
        onSave();
        onHide();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre *</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Proveedor</Form.Label>
                <Form.Select
                  name="proveedorId"
                  value={formData.proveedorId}
                  onChange={handleChange}
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
            />
          </Form.Group>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Precio *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Stock *</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Categoría *</Form.Label>
                <Form.Select
                  name="categoriaId"
                  value={formData.categoriaId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Subcategoría *</Form.Label>
                <Form.Select
                  name="subcategoriaId"
                  value={formData.subcategoriaId}
                  onChange={handleChange}
                  required
                  disabled={!formData.categoriaId}
                >
                  <option value="">Seleccionar...</option>
                  {subcategorias.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>URL de Imagen</Form.Label>
            <Form.Control
              type="text"
              name="imagen"
              value={formData.imagen}
              onChange={handleChange}
              placeholder="https://example.com/imagen.jpg"
            />
            <Form.Text className="text-muted">
              Ingresa una URL de imagen si no vas a subir un archivo.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Archivo de Imagen</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleImagenChange}
            />
            {preview && (
              <div className="mt-2">
                <img
                  src={preview}
                  alt="Preview"
                  style={{ maxHeight: '150px', objectFit: 'contain' }}
                  className="border rounded"
                />
              </div>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Producto'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ProductoForm;