/**
 * ============================================
 * NAVBAR - MarketCOL (Rediseño)
 * ============================================
 */

import React, { memo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const NavigationBar = memo(() => {
  const { user, isAuthenticated, isAdmin, isAuxiliar, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const isActive = (path) => location.pathname === path;

  return (
    <Navbar
      expand="lg"
      sticky="top"
      className="mk-navbar"
      style={{ height: 60 }}
    >
      <Container>
        {/* ── Logo ── */}
        <Navbar.Brand
          as={Link}
          to="/"
          className="d-flex align-items-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          <div style={{
            width: 32, height: 32,
            background: 'var(--red)',
            borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="21" r="1" fill="white"/>
              <circle cx="20" cy="21" r="1" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 17, color: 'var(--carbon)', lineHeight: 1,
            }}>
              MerkaCiro
            </div>
            <div style={{
              fontSize: 10, color: 'var(--gray)',
              letterSpacing: '0.8px', textTransform: 'uppercase', lineHeight: 1.2,
            }}>
              MarketCol
            </div>
          </div>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="marketcol-nav" style={{ border: 'none' }} />

        <Navbar.Collapse id="marketcol-nav">
          {/* ── Nav links ── */}
          <Nav className="me-auto">
            <Nav.Link
              as={Link} to="/"
              className={isActive('/') ? 'active' : ''}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Inicio
            </Nav.Link>
            <Nav.Link
              as={Link} to="/catalogo"
              className={isActive('/catalogo') ? 'active' : ''}
            >
              Catálogo
            </Nav.Link>

            {/* Admin dropdown */}
            {(isAdmin || isAuxiliar) && (
              <NavDropdown title="Administración" id="admin-dropdown">
                <NavDropdown.Item as={Link} to="/admin">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="me-2">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Dashboard
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/admin/categorias">Categorías</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/subcategorias">Subcategorías</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/productos">Productos</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/proveedores">Proveedores</NavDropdown.Item>
                {isAdmin && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/admin/usuarios">Usuarios</NavDropdown.Item>
                  </>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/admin/pedidos">Pedidos</NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>

          {/* ── Right actions ── */}
          <Nav className="align-items-center gap-1">
            {/* Carrito */}
            <Nav.Link as={Link} to="/carrito" style={{ position: 'relative', padding: '6px 10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13" stroke="var(--charcoal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="21" r="1" fill="var(--charcoal)"/>
                <circle cx="20" cy="21" r="1" fill="var(--charcoal)"/>
              </svg>
            </Nav.Link>

            {isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/mis-pedidos" style={{ fontSize: 14 }}>
                  Mis Pedidos
                </Nav.Link>

                {(isAdmin || isAuxiliar) && (
                  <Nav.Link as={Link} to="/catalogo" style={{ color: 'var(--success) !important', fontSize: 14 }}>
                    Ver Tienda
                  </Nav.Link>
                )}

                <NavDropdown
                  title={
                    <span style={{ fontWeight: 500, fontSize: 14 }}>
                      {user?.nombre || 'Mi Cuenta'}
                    </span>
                  }
                  id="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Item as={Link} to="/perfil">Mi Perfil</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item
                    onClick={handleLogout}
                    style={{ color: 'var(--red)' }}
                  >
                    Cerrar Sesión
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <div style={{ width: 1, height: 20, background: 'var(--gray-border)', margin: '0 4px' }} />
                <Nav.Link
                  as={Link} to="/login"
                  className="mk-btn mk-btn-outline mk-btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  Ingresar
                </Nav.Link>
                <Nav.Link
                  as={Link} to="/register"
                  className="mk-btn mk-btn-primary mk-btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  Crear cuenta
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
});

NavigationBar.displayName = 'NavigationBar';
export default NavigationBar;
