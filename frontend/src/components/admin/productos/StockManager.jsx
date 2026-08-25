import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import api from '../../../services/api';

const StockManager = ({ productoId, stockActual, onStockUpdated }) => {
  const [cantidad, setCantidad] = useState(1);
  const [operacion, setOperacion] = useState('aumentar');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cantidad < 1) return;
    
    setLoading(true);
    try {
      await api.patch(`/admin/productos/${productoId}/stock`, {
        cantidad: Number(cantidad),
        operacion
      });
      onStockUpdated();
      setCantidad(1);
    } catch (error) {
      alert(error.response?.data?.message || 'Error al actualizar stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="d-flex gap-2 align-items-center">
      <Form.Select
        size="sm"
        value={operacion}
        onChange={(e) => setOperacion(e.target.value)}
        style={{ width: '110px' }}
      >
        <option value="aumentar">Aumentar</option>
        <option value="reducir">Reducir</option>
        <option value="establecer">Establecer</option>
      </Form.Select>
      <InputGroup size="sm" style={{ width: '120px' }}>
        <Form.Control
          type="number"
          min="1"
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          required
        />
      </InputGroup>
      <Button
        type="submit"
        size="sm"
        variant="outline-primary"
        disabled={loading}
      >
        {loading ? '...' : 'Actualizar'}
      </Button>
    </Form>
  );
};

export default StockManager;