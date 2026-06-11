/**
 * ============================================
 * ADMIN DASHBOARD - MarketCOL (Rediseño)
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ── Sidebar ── */
const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { icon: '⚡', label: 'Dashboard',    path: '/admin' },
    { icon: '📦', label: 'Productos',    path: '/admin/productos' },
    { icon: '📋', label: 'Pedidos',      path: '/admin/pedidos' },
    { icon: '🏷️', label: 'Categorías',   path: '/admin/categorias' },
    { icon: '🔖', label: 'Subcategorías',path: '/admin/subcategorias' },
    { icon: '🚛', label: 'Proveedores',  path: '/admin/proveedores' },
    { icon: '👥', label: 'Usuarios',     path: '/admin/usuarios' },
  ];

  return (
    <div style={{
      width: 220, background: 'white', borderRight: '1px solid var(--gray-border)',
      padding: '20px 14px', flexShrink: 0,
      position: 'sticky', top: 60, height: 'calc(100vh - 60px)', overflowY: 'auto',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'var(--gray)',
        letterSpacing: '1.2px', textTransform: 'uppercase',
        marginBottom: 12, padding: '0 10px',
      }}>Panel</div>

      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`mk-sidebar-link ${isActive(item.path) ? 'active' : ''}`}
          style={{ marginBottom: 2 }}
        >
          <span style={{ fontSize: 16 }}>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}

      <hr className="mk-divider" style={{ margin: '14px 0' }} />

      <Link to="/catalogo" className="mk-sidebar-link" style={{ color: 'var(--success)' }}>
        <span>🏪</span><span>Ver tienda</span>
      </Link>

      <button
        className="mk-sidebar-link"
        style={{ color: 'var(--red)', marginTop: 4, cursor: 'pointer' }}
        onClick={() => { logout(); navigate('/login'); }}
      >
        <span>🚪</span><span>Cerrar sesión</span>
      </button>
    </div>
  );
};

/* ── Stat Card ── */
const StatCard = ({ title, value, icon, accent = 'var(--red)', link, loading }) => (
  <Link to={link || '#'} style={{ textDecoration: 'none' }}>
    <div className="mk-card" style={{
      padding: '20px 22px', transition: 'all 0.2s',
      cursor: link ? 'pointer' : 'default',
    }}
      onMouseEnter={e => { if (link) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
    >
      {loading ? (
        <div style={{
          height: 60, background: 'var(--gray-light)',
          borderRadius: 'var(--radius)', animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 26 }}>{icon}</span>
            {link && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="var(--gray)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 26, color: accent, marginBottom: 4, lineHeight: 1,
          }}>{value}</div>
          <div style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 500 }}>{title}</div>
          <div style={{ height: 3, background: 'var(--gray-light)', borderRadius: 2, marginTop: 14 }}>
            <div style={{ height: '100%', background: accent, borderRadius: 2, width: '65%', opacity: 0.5 }} />
          </div>
        </>
      )}
    </div>
  </Link>
);

/* ── Dashboard Page ── */
const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pedidosPendientes: 0, pedidosListos: 0,
    ventasHoy: 0, stockBajo: 0,
    totalProductos: 0, totalClientes: 0,
  });
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fmt = (v) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

  const ESTADO_STYLE = {
    pendiente:  { bg: 'rgba(217,119,6,0.1)', color: '#92400E' },
    listo:      { bg: 'rgba(217,43,43,0.08)', color: 'var(--red)' },
    entregado:  { bg: 'rgba(22,163,74,0.1)',  color: 'var(--success)' },
    cancelado:  { bg: 'var(--gray-light)',    color: 'var(--gray)' },
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [pedidosRes, usuariosRes, productosRes] = await Promise.all([
          api.get('/admin/pedidos/estadisticas'),
          api.get('/admin/usuarios/stats'),
          api.get('/admin/productos?limite=1000'),
        ]);

        const stockBajo = productosRes.data.data.productos.filter(p => p.stock < 10).length;

        setStats({
          pedidosPendientes: pedidosRes.data.data.pedidosPorEstado.find(e => e.estado === 'pendiente')?.cantidad || 0,
          pedidosListos:     pedidosRes.data.data.pedidosPorEstado.find(e => e.estado === 'listo')?.cantidad || 0,
          ventasHoy:         parseFloat(pedidosRes.data.data.ventasHoy || 0),
          stockBajo,
          totalProductos:    productosRes.data.data.total || productosRes.data.data.productos.length,
          totalClientes:     usuariosRes.data.data.totalClientes || 0,
        });

        // Últimos pedidos
        const pedidosRecentRes = await api.get('/admin/pedidos?limite=5');
        setPedidosRecientes(pedidosRecentRes.data.data?.pedidos || []);
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
        setError('No se pudieron cargar las estadísticas. Verifica la conexión con el backend.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
      <AdminSidebar />

      <div style={{ flex: 1, padding: '28px 32px', background: 'var(--gray-light)', minWidth: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--carbon)', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: 14, margin: '4px 0 0' }}>
            Bienvenido, {user?.nombre} {user?.apellido} — MerkaCiro
          </p>
        </div>

        {error && (
          <div className="mk-alert mk-alert-danger" style={{ marginBottom: 24 }}>⚠️ {error}</div>
        )}

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div className="fade-up fade-up-d1">
            <StatCard title="Pedidos pendientes" value={stats.pedidosPendientes} icon="🛒"
              accent="var(--warning)" link="/admin/pedidos?estado=pendiente" loading={loading} />
          </div>
          <div className="fade-up fade-up-d2">
            <StatCard title="Listos para recoger" value={stats.pedidosListos} icon="📦"
              accent="var(--red)" link="/admin/pedidos?estado=listo" loading={loading} />
          </div>
          <div className="fade-up fade-up-d3">
            <StatCard title="Ventas del día" value={loading ? '—' : fmt(stats.ventasHoy)} icon="💰"
              accent="var(--success)" loading={loading} />
          </div>
          <div className="fade-up fade-up-d4">
            <StatCard title="Stock bajo (<10)" value={stats.stockBajo} icon="⚠️"
              accent="#7C3AED" link="/admin/productos?stockBajo=true" loading={loading} />
          </div>
        </div>

        {/* Accesos rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            {
              title: 'Gestión de Productos',
              desc: 'Administra el catálogo, actualiza precios y controla el inventario.',
              links: [
                { to: '/admin/productos', label: `Productos (${stats.totalProductos})`, primary: true },
                { to: '/admin/categorias', label: 'Categorías' },
              ],
            },
            {
              title: 'Gestión de Pedidos',
              desc: 'Revisa pedidos pendientes, confirma pagos y actualiza estados.',
              links: [
                { to: '/admin/pedidos', label: `Pedidos pendientes (${stats.pedidosPendientes})`, primary: true },
                { to: '/admin/pedidos?estado=listo', label: `Listos (${stats.pedidosListos})` },
              ],
            },
            {
              title: 'Otras Gestiones',
              desc: 'Usuarios, proveedores y otros recursos del sistema.',
              links: [
                { to: '/admin/usuarios', label: `Clientes (${stats.totalClientes})`, primary: true },
                { to: '/admin/proveedores', label: 'Proveedores' },
              ],
            },
          ].map((block, i) => (
            <div key={i} className="mk-card" style={{ padding: '22px 22px' }}>
              <h5 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--carbon)', marginBottom: 8 }}>
                {block.title}
              </h5>
              <p style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                {block.desc}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {block.links.map((l, j) => (
                  <Link key={j} to={l.to}
                    className={`mk-btn ${l.primary ? 'mk-btn-primary' : 'mk-btn-ghost'} mk-btn-sm`}
                    style={{ textDecoration: 'none', justifyContent: 'center' }}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pedidos recientes */}
        {pedidosRecientes.length > 0 && (
          <div className="mk-card">
            <div style={{
              padding: '16px 22px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', borderBottom: '1px solid var(--gray-border)',
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, margin: 0 }}>
                Pedidos recientes
              </h3>
              <Link to="/admin/pedidos" className="mk-btn mk-btn-outline mk-btn-sm"
                style={{ textDecoration: 'none' }}>
                Ver todos
              </Link>
            </div>
            <table className="mk-table">
              <thead>
                <tr>
                  {['Pedido', 'Cliente', 'Total', 'Estado', 'Acción'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidosRecientes.map(p => {
                  const st = ESTADO_STYLE[p.estado] || ESTADO_STYLE.pendiente;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
                        #{String(p.id).padStart(3, '0')}
                      </td>
                      <td>{p.usuario?.nombre || p.usuario?.email || '—'} {p.usuario?.apellido || ''}</td>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--red)' }}>
                        {fmt(p.total || 0)}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 100,
                          fontSize: 11, fontWeight: 600, background: st.bg, color: st.color,
                        }}>
                          {p.estado}
                        </span>
                      </td>
                      <td>
                        <Link to={`/pedido/${p.id}`} className="mk-btn mk-btn-ghost mk-btn-sm"
                          style={{ textDecoration: 'none' }}>
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
