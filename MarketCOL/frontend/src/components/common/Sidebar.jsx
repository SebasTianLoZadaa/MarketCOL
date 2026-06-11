/**
 * ============================================
 * SIDEBAR COMPONENT
 * ============================================
 * Menú lateral para el panel de administración.
 * Se adapta según el rol del usuario (admin/auxiliar).
 */

import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="bg-dark text-white vh-100 p-3 position-sticky top-0" style={{ minWidth: '250px' }}>
      <div className="text-center py-3 border-bottom border-secondary">
        <h5 className="mb-0">
          <i className="bi bi-speedometer2 me-2"></i>
          Panel Admin
        </h5>
        <small className="text-muted">MarketCOL</small>
      </div>

      <Nav className="flex-column mt-3">
        <Nav.Link
          as={Link}
          to="/admin"
          className={`text-white mb-1 rounded ${isActive('/admin') && !isActive('/admin/') ? 'bg-primary' : ''}`}
        >
          <i className="bi bi-grid me-2"></i>
          Dashboard
        </Nav.Link>

        <div className="text-muted small text-uppercase mt-3 mb-1 px-2">Catálogo</div>

        <Nav.Link
          as={Link}
          to="/admin/categorias"
          className={`text-white mb-1 rounded ${isActive('/admin/categorias') ? 'bg-primary' : ''}`}
        >
          <i className="bi bi-tags me-2"></i>
          Categorías
        </Nav.Link>

        <Nav.Link
          as={Link}
          to="/admin/subcategorias"
          className={`text-white mb-1 rounded ${isActive('/admin/subcategorias') ? 'bg-primary' : ''}`}
        >
          <i className="bi bi-diagram-2 me-2"></i>
          Subcategorías
        </Nav.Link>

        <Nav.Link
          as={Link}
          to="/admin/productos"
          className={`text-white mb-1 rounded ${isActive('/admin/productos') ? 'bg-primary' : ''}`}
        >
          <i className="bi bi-box-seam me-2"></i>
          Productos
        </Nav.Link>

        <Nav.Link
          as={Link}
          to="/admin/proveedores"
          className={`text-white mb-1 rounded ${isActive('/admin/proveedores') ? 'bg-primary' : ''}`}
        >
          <i className="bi bi-truck me-2"></i>
          Proveedores
        </Nav.Link>

        <div className="text-muted small text-uppercase mt-3 mb-1 px-2">Ventas</div>

        <Nav.Link
          as={Link}
          to="/admin/pedidos"
          className={`text-white mb-1 rounded ${isActive('/admin/pedidos') ? 'bg-primary' : ''}`}
        >
          <i className="bi bi-receipt me-2"></i>
          Pedidos
        </Nav.Link>

        {isAdmin && (
          <>
            <div className="text-muted small text-uppercase mt-3 mb-1 px-2">Sistema</div>

            <Nav.Link
              as={Link}
              to="/admin/usuarios"
              className={`text-white mb-1 rounded ${isActive('/admin/usuarios') ? 'bg-primary' : ''}`}
            >
              <i className="bi bi-people me-2"></i>
              Usuarios
            </Nav.Link>
          </>
        )}

        <div className="text-muted small text-uppercase mt-3 mb-1 px-2">Tienda</div>

        <Nav.Link
          as={Link}
          to="/catalogo"
          className="text-white mb-1 rounded"
          target="_blank"
        >
          <i className="bi bi-shop me-2"></i>
          Ver Catálogo
        </Nav.Link>
      </Nav>

      <div className="position-absolute bottom-0 start-0 p-3 w-100 border-top border-secondary">
        <small className="text-muted">
          <i className="bi bi-person-circle me-1"></i>
          MarketCOL v1.0
        </small>
      </div>
    </div>
  );
};

export default Sidebar;