import React from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';

/**
 * Tarjeta individual de estadística
 */
const StatCard = ({ title, value, icon, color = 'primary', link }) => {
  return (
    <Card className="h-100 shadow-sm">
      <Card.Body className="d-flex align-items-center">
        <div className={`me-3 text-${color}`} style={{ fontSize: '2rem' }}>
          {icon}
        </div>
        <div className="flex-grow-1">
          <h6 className="text-primary mb-1">{title}</h6>
          <h3 className="mb-0 text-danger">{value}</h3>
        </div>
        {link && (
          <Button variant="outline-primary" size="sm" href={link} className="ms-2">
            Ver
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

/**
 * Componente que agrupa todas las tarjetas de estadísticas del dashboard
 */
const StatsCards = ({ stats, loading }) => {
  if (loading) {
    return (
      <Row className="g-3">
        {[1, 2, 3, 4].map((i) => (
          <Col key={i} md={6} lg={3}>
            <Card className="h-100">
              <Card.Body>
                <div className="placeholder-glow">
                  <span className="placeholder col-12" style={{ height: '60px' }}></span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row className="g-3">
      <Col md={6} lg={3}>
        <StatCard
          title="Pedidos Pendientes"
          value={stats.pedidosPendientes || 0}
          icon="🛒"
          color="warning"
          link="/admin/pedidos?estado=pendiente"
        />
      </Col>
      <Col md={6} lg={3}>
        <StatCard
          title="Aliste y recoja"
          value={stats.pedidosListos || 0}
          icon="📦"
          color="success"
          link="/admin/pedidos?estado=listo"
        />
      </Col>
      <Col md={6} lg={3}>
        <StatCard
          title="Ventas del Día"
          value={`$${stats.ventasHoy?.toLocaleString() || '0'}`}
          icon="💰"
          color="primary"
        />
      </Col>
      <Col md={6} lg={3}>
        <StatCard
          title="Productos con Stock Bajo"
          value={stats.stockBajo || 0}
          icon="⚠️"
          color="danger"
          link="/admin/productos?stockBajo=true"
        />
      </Col>
    </Row>
  );
};

export default StatsCards;