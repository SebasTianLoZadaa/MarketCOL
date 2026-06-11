import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import StatsCards from '../../components/admin/StatsCards';
import { useAuth } from '../../../context/AuthContext';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pedidosPendientes: 0,
    pedidosListos: 0,
    ventasHoy: 0,
    stockBajo: 0,
    totalProductos: 0,
    totalClientes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Obtener estadísticas de pedidos (backend MarketCOL)
        const pedidosRes = await api.get('/admin/pedidos/estadisticas');
        
        // Obtener estadísticas de usuarios (backend MarketCOL)
        const usuariosRes = await api.get('/admin/usuarios/stats');
        
        // Obtener productos para calcular stock bajo (asumimos que stock bajo es < 10)
        const productosRes = await api.get('/admin/productos?limite=1000');
        const stockBajo = productosRes.data.data.productos.filter(p => p.stock < 10).length;

        setStats({
          pedidosPendientes: pedidosRes.data.data.pedidosPorEstado.find(e => e.estado === 'pendiente')?.cantidad || 0,
          pedidosListos: pedidosRes.data.data.pedidosPorEstado.find(e => e.estado === 'listo')?.cantidad || 0,
          ventasHoy: parseFloat(pedidosRes.data.data.ventasHoy || 0),
          stockBajo: stockBajo,
          totalProductos: productosRes.data.data.total || productosRes.data.data.productos.length,
          totalClientes: usuariosRes.data.data.totalClientes || 0,
        });
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
        setError('No se pudieron cargar las estadísticas. Verifica la conexión con el backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard de Administración</h1>
        <p className="text-muted mb-0">
          Bienvenido, {user?.nombre} {user?.apellido}
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Tarjetas de estadísticas */}
      <StatsCards stats={stats} loading={loading} />

      {/* Accesos rápidos */}
      <Row className="mt-4 g-3">
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5>Gestión de Productos</h5>
              <p className="text-muted">
                Administra el catálogo, actualiza precios y controla el inventario.
              </p>
              <div className="d-grid gap-2">
                <Button as={Link} to="/admin/productos" variant="outline-primary">
                  Ver Productos ({stats.totalProductos})
                </Button>
                <Button as={Link} to="/admin/categorias" variant="outline-secondary">
                  Gestionar Categorías
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5>Gestión de Pedidos</h5>
              <p className="text-muted">
                Revisa pedidos pendientes, confirma pagos y actualiza estados.
              </p>
              <div className="d-grid gap-2">
                <Button as={Link} to="/admin/pedidos" variant="outline-warning">
                  Ver Pedidos Pendientes ({stats.pedidosPendientes})
                </Button>
                <Button as={Link} to="/admin/pedidos?estado=listo" variant="outline-success">
                  Listos para Recoger ({stats.pedidosListos})
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5>Otras Gestiones</h5>
              <p className="text-muted">
                Administra usuarios, proveedores y otros recursos del sistema.
              </p>
              <div className="d-grid gap-2">
                <Button as={Link} to="/admin/usuarios" variant="outline-info">
                  Ver Clientes ({stats.totalClientes})
                </Button>
                <Button as={Link} to="/admin/proveedores" variant="outline-dark">
                  Gestionar Proveedores
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboardPage;
