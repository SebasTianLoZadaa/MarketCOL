import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import api from '../../../services/api';

const ProveedorForm = ({ show, onHide, proveedor, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!proveedor;

  useEffect(() => {
    if (proveedor) {
      setFormData({
        nombre: proveedor.nombre || '',
        contacto: proveedor.contacto || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        direccion: proveedor.direccion || ''
      });
    } else {
      setFormData({
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: ''
      });
    }
  }, [proveedor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      if (isEditing) {
        response = await api.put(`/admin/proveedores/${proveedor.id}`, formData);
      } else {
        response = await api.post('/admin/proveedores', formData);
      }

      if (response.data.success) {
        onSave();
        onHide();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar proveedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
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

          <Form.Group className="mb-3">
            <Form.Label>Persona de contacto</Form.Label>
            <Form.Control
              type="text"
              name="contacto"
              value={formData.contacto}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Teléfono</Form.Label>
            <Form.Control
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Dirección</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Proveedor'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ProveedorForm;